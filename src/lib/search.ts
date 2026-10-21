import { AUTHORS, TOPICS } from "@/data/catalog";
import { getArticles } from "@/lib/articles";
import { normalizeQuery, resolveSearchQuery } from "@/lib/query";
import type { Article, SearchFilters, SearchHit, SearchResult } from "@/lib/types";
import { getTypesenseClient, TYPESENSE_COLLECTION, typesenseAvailable } from "@/lib/typesense";

const DEFAULT_PER_PAGE = 12;

function snippetFrom(article: Article, terms: string[]) {
  const haystacks = [article.title, article.dek, ...article.body];
  for (const haystack of haystacks) {
    const lower = haystack.toLowerCase();
    const hit = terms.find((term) => lower.includes(term));
    if (hit) {
      const index = lower.indexOf(hit);
      const start = Math.max(0, index - 72);
      const end = Math.min(haystack.length, index + 140);
      return `${start > 0 ? "…" : ""}${haystack.slice(start, end)}${end < haystack.length ? "…" : ""}`;
    }
  }
  return article.dek;
}

function fieldHaystacks(article: Article) {
  return {
    title: normalizeQuery(article.title),
    dek: normalizeQuery(article.dek),
    author: normalizeQuery(article.author),
    topic: normalizeQuery(article.topic),
    body: normalizeQuery(article.body.join(" ")),
  };
}

function termHits(haystack: string, term: string) {
  return haystack.includes(term);
}

function scoreArticle(article: Article, terms: string[], allowBody: boolean) {
  if (terms.length === 0) return 1;
  const fields = fieldHaystacks(article);
  let score = 0;
  for (const term of terms) {
    const inTitle = termHits(fields.title, term);
    const inDek = termHits(fields.dek, term);
    const inAuthor = termHits(fields.author, term);
    const inBody = termHits(fields.body, term);
    if (!inTitle && !inDek && !inAuthor && !(allowBody && inBody)) return 0;
    if (inTitle) score += 12;
    if (inAuthor) score += 8;
    if (inDek) score += 4;
    if (allowBody && inBody) score += 1;
  }
  return score;
}

function applyFacets(hits: Article[]) {
  const topicCounts = new Map<string, number>();
  const authorCounts = new Map<string, number>();
  for (const article of hits) {
    topicCounts.set(article.topicSlug, (topicCounts.get(article.topicSlug) ?? 0) + 1);
    authorCounts.set(article.authorSlug, (authorCounts.get(article.authorSlug) ?? 0) + 1);
  }
  return {
    topics: TOPICS.map((topic) => ({
      value: topic.slug,
      count: topicCounts.get(topic.slug) ?? 0,
    })).filter((topic) => topic.count > 0),
    authors: AUTHORS.map((author) => ({
      value: author.slug,
      count: authorCounts.get(author.slug) ?? 0,
    })).filter((author) => author.count > 0),
  };
}

function withDidYouMean(result: SearchResult, resolved: ReturnType<typeof resolveSearchQuery>): SearchResult {
  return resolved.corrected ? { ...result, didYouMean: resolved.q } : result;
}

function searchArchive(filters: SearchFilters, resolved: ReturnType<typeof resolveSearchQuery>): SearchResult {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const terms = resolved.terms;

  let pool = getArticles();
  if (filters.topic) pool = pool.filter((article) => article.topicSlug === filters.topic);
  if (filters.author) pool = pool.filter((article) => article.authorSlug === filters.author);
  if (filters.from) pool = pool.filter((article) => article.publishedAt >= filters.from!);
  if (filters.to) pool = pool.filter((article) => article.publishedAt <= filters.to!);

  const rank = (allowBody: boolean) =>
    pool
      .map((article) => ({ article, score: scoreArticle(article, terms, allowBody) }))
      .filter((entry) => (terms.length === 0 ? true : entry.score > 0))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.article.publishedAt < b.article.publishedAt ? 1 : -1;
      });

  const ranked = (() => {
    const focused = rank(false);
    return focused.length > 0 ? focused : rank(true);
  })();

  const facets = applyFacets(ranked.map((entry) => entry.article));
  const start = (page - 1) * perPage;
  const hits: SearchHit[] = ranked.slice(start, start + perPage).map((entry) => ({
    article: entry.article,
    snippet: snippetFrom(entry.article, terms),
  }));

  return withDidYouMean(
    {
      hits,
      found: ranked.length,
      page,
      perPage,
      engine: "archive",
      ...facets,
    },
    resolved,
  );
}

function articleById(id: string) {
  return getArticles().find((article) => article.id === id);
}

function deskForTerms(terms: string[]) {
  if (terms.length !== 1) return undefined;
  const term = terms[0];
  return TOPICS.find((topic) => topic.slug === term || topic.name.toLowerCase() === term);
}

function uniqueHits(groups: SearchHit[][]) {
  const seen = new Set<string>();
  const hits: SearchHit[] = [];
  for (const group of groups) {
    for (const hit of group) {
      if (seen.has(hit.article.id)) continue;
      seen.add(hit.article.id);
      hits.push(hit);
    }
  }
  return hits;
}

const TYPESENSE_COMMON = {
  highlight_affix_num_tokens: 16,
  prioritize_exact_match: true,
  prioritize_token_position: true,
  prioritize_num_matching_fields: true,
  drop_tokens_threshold: 0,
  num_typos: 1,
  min_len_1typo: 5,
  min_len_2typo: 9,
  prefix: true,
  exhaustive_search: false,
} as const;

async function searchTypesense(
  filters: SearchFilters,
  resolved: ReturnType<typeof resolveSearchQuery>,
): Promise<SearchResult | null> {
  const available = await typesenseAvailable();
  if (!available) return null;

  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const fetchSize = Math.min(250, Math.max(perPage * page, 40));
  const clauses: string[] = [];
  if (filters.topic) clauses.push(`topicSlug:=${filters.topic}`);
  if (filters.author) clauses.push(`authorSlug:=${filters.author}`);
  if (filters.from) clauses.push(`publishedAtTs:>=${Date.parse(`${filters.from}T00:00:00.000Z`)}`);
  if (filters.to) clauses.push(`publishedAtTs:<=${Date.parse(`${filters.to}T23:59:59.000Z`)}`);

  const client = await getTypesenseClient();
  const collection = client.collections(TYPESENSE_COLLECTION).documents();

  const run = async (
    q: string,
    queryBy: string,
    weights?: string,
    extraFilter?: string,
    overrides?: { num_typos?: number },
  ) => {
    const filter = [clauses.join(" && "), extraFilter].filter(Boolean).join(" && ") || undefined;
    const response = await collection.search({
      q,
      query_by: queryBy,
      query_by_weights: weights,
      filter_by: filter,
      facet_by: "topicSlug,authorSlug",
      page: 1,
      per_page: fetchSize,
      sort_by: q === "*" ? "publishedAtTs:desc" : "_text_match:desc,publishedAtTs:desc",
      ...TYPESENSE_COMMON,
      ...overrides,
    });
    const hits: SearchHit[] = (response.hits ?? [])
      .map((hit) => {
        const document = hit.document as { id?: string };
        const article = document.id ? articleById(document.id) : undefined;
        if (!article) return null;
        const highlight = hit.highlights?.find(
          (entry) => entry.field === "title" || entry.field === "dek" || entry.field === "body",
        );
        const snippet = highlight?.snippet?.replace(/<\/?mark>/g, "") ?? article.dek;
        return { article, snippet };
      })
      .filter((hit): hit is SearchHit => hit !== null);
    return { hits, response };
  };

  if (!resolved.q) {
    const empty = await run("*", "title");
    const start = (page - 1) * perPage;
    return {
      hits: empty.hits.slice(start, start + perPage),
      found: empty.response.found ?? empty.hits.length,
      page,
      perPage,
      engine: "typesense",
      topics: (empty.response.facet_counts?.find((facet) => facet.field_name === "topicSlug")?.counts ?? []).map(
        (entry) => ({ value: entry.value, count: entry.count }),
      ),
      authors: (empty.response.facet_counts?.find((facet) => facet.field_name === "authorSlug")?.counts ?? []).map(
        (entry) => ({ value: entry.value, count: entry.count }),
      ),
    };
  }

  const literal =
    resolved.corrected && resolved.original
      ? await run(resolved.original, "title,author", "8,5", undefined, { num_typos: 0 })
      : { hits: [] as SearchHit[], response: undefined };
  const exactOriginalInTitle = literal.hits.some((hit) =>
    normalizeQuery(hit.article.title).includes(normalizeQuery(resolved.original)),
  );
  const focused = await run(resolved.q, "title,author", "8,5");
  const desk = deskForTerms(resolved.terms);
  const deskResults =
    desk && !filters.topic && !exactOriginalInTitle
      ? await run("*", "title", undefined, `topicSlug:=${desk.slug}`)
      : { hits: [] as SearchHit[] };
  let merged = exactOriginalInTitle
    ? uniqueHits([literal.hits, focused.hits])
    : uniqueHits([literal.hits, focused.hits, deskResults.hits]);

  if (merged.length === 0) {
    const body = await run(resolved.q, "title,author,dek,body", "8,5,3,1");
    merged = body.hits;
  }

  const start = (page - 1) * perPage;
  const facetSource = focused.response ?? literal.response;
  return withDidYouMean(
    {
      hits: merged.slice(start, start + perPage),
      found: merged.length,
      page,
      perPage,
      engine: "typesense",
      topics: (facetSource?.facet_counts?.find((facet) => facet.field_name === "topicSlug")?.counts ?? []).map(
        (entry) => ({ value: entry.value, count: entry.count }),
      ),
      authors: (facetSource?.facet_counts?.find((facet) => facet.field_name === "authorSlug")?.counts ?? []).map(
        (entry) => ({ value: entry.value, count: entry.count }),
      ),
    },
    resolved,
  );
}

export async function searchArticles(filters: SearchFilters): Promise<SearchResult> {
  const resolved = resolveSearchQuery(filters.q ?? "");
  try {
    const typed = await searchTypesense(filters, resolved);
    if (typed) return typed;
  } catch {
    // Fall back to the local archive index.
  }
  return searchArchive(filters, resolved);
}

export function parseSearchParams(params: Record<string, string | string[] | undefined>): SearchFilters {
  const read = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };
  const page = Number(read("page") ?? "1");
  return {
    q: read("q") ?? "",
    topic: read("topic") || undefined,
    author: read("author") || undefined,
    from: read("from") || undefined,
    to: read("to") || undefined,
    page: Number.isFinite(page) ? page : 1,
  };
}
