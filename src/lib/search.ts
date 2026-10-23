import { AUTHORS, TOPICS } from "@/data/catalog";
import { getArticles } from "@/lib/articles";
import {
  applyNaturalFilters,
  expandArchiveTerms,
  parseNaturalQuery,
  understoodFrom,
  type NaturalQuery,
} from "@/lib/nl-query";
import { normalizeQuery, resolveSearchQuery, type ResolvedQuery } from "@/lib/query";
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

function scoreArticle(article: Article, terms: string[], allowBody: boolean, requireAll: boolean) {
  if (terms.length === 0) return 1;
  const fields = fieldHaystacks(article);
  let score = 0;
  let matched = 0;
  for (const term of terms) {
    const inTitle = termHits(fields.title, term);
    const inDek = termHits(fields.dek, term);
    const inAuthor = termHits(fields.author, term);
    const inTopic = termHits(fields.topic, term);
    const inBody = termHits(fields.body, term);
    const hit = inTitle || inDek || inAuthor || inTopic || (allowBody && inBody);
    if (!hit) {
      if (requireAll) return 0;
      continue;
    }
    matched += 1;
    if (inTitle) score += 12;
    if (inAuthor) score += 8;
    if (inTopic) score += 6;
    if (inDek) score += 4;
    if (allowBody && inBody) score += 1;
  }
  return matched === 0 ? 0 : score;
}

type FacetKey = "topic" | "author" | "year";

function applyStructured(articles: Article[], filters: SearchFilters, omit?: FacetKey) {
  return articles.filter((article) => {
    if (omit !== "topic" && filters.topic && article.topicSlug !== filters.topic) return false;
    if (omit !== "author" && filters.author && article.authorSlug !== filters.author) return false;
    if (omit !== "year" && filters.year && String(article.year) !== filters.year) return false;
    if (!filters.year || omit === "year") {
      if (filters.from && article.publishedAt < filters.from) return false;
      if (filters.to && article.publishedAt > filters.to) return false;
    }
    return true;
  });
}

function countFacets(articles: Article[]) {
  const topicCounts = new Map<string, number>();
  const authorCounts = new Map<string, number>();
  const yearCounts = new Map<string, number>();
  for (const article of articles) {
    topicCounts.set(article.topicSlug, (topicCounts.get(article.topicSlug) ?? 0) + 1);
    authorCounts.set(article.authorSlug, (authorCounts.get(article.authorSlug) ?? 0) + 1);
    yearCounts.set(String(article.year), (yearCounts.get(String(article.year)) ?? 0) + 1);
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
    years: [...yearCounts.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => Number(b.value) - Number(a.value)),
  };
}

function archiveFacets(matched: Article[], filters: SearchFilters) {
  return {
    topics: countFacets(applyStructured(matched, filters, "topic")).topics,
    authors: countFacets(applyStructured(matched, filters, "author")).authors,
    years: countFacets(applyStructured(matched, filters, "year")).years,
  };
}

function decorateResult(
  result: Omit<SearchResult, "didYouMean" | "understood" | "mode"> &
    Partial<Pick<SearchResult, "didYouMean" | "understood" | "mode">>,
  resolved: ResolvedQuery,
  parsed: NaturalQuery,
  mode: SearchResult["mode"],
): SearchResult {
  return {
    ...result,
    mode,
    understood: understoodFrom(parsed),
    ...(resolved.corrected ? { didYouMean: resolved.q } : {}),
  };
}

function searchArchive(filters: SearchFilters, resolved: ResolvedQuery, parsed: NaturalQuery): SearchResult {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const terms = parsed.natural ? expandArchiveTerms(parsed) : resolved.terms;
  const requireAll = !parsed.natural;

  const rank = (articles: Article[], allowBody: boolean) =>
    articles
      .map((article) => ({ article, score: scoreArticle(article, terms, allowBody, requireAll) }))
      .filter((entry) => (terms.length === 0 ? true : entry.score > 0))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return a.article.publishedAt < b.article.publishedAt ? 1 : -1;
      });

  const textMatched = (() => {
    const focused = rank(getArticles(), false);
    return focused.length > 0 ? focused : rank(getArticles(), true);
  })();
  const matchedArticles = textMatched.map((entry) => entry.article);
  const ranked = applyStructured(matchedArticles, filters)
    .map((article) => textMatched.find((entry) => entry.article.id === article.id)!)
    .filter(Boolean);

  const facets = archiveFacets(matchedArticles, filters);
  const start = (page - 1) * perPage;
  const hits: SearchHit[] = ranked.slice(start, start + perPage).map((entry) => ({
    article: entry.article,
    snippet: snippetFrom(entry.article, terms),
  }));

  return decorateResult(
    {
      hits,
      found: ranked.length,
      page,
      perPage,
      engine: "archive",
      ...facets,
    },
    resolved,
    parsed,
    parsed.natural ? "semantic" : "keyword",
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
  enable_analytics: false,
} as const;

async function collectionHasEmbedding() {
  try {
    const client = await getTypesenseClient();
    const collection = await client.collections(TYPESENSE_COLLECTION).retrieve();
    return collection.fields?.some((field) => field.name === "embedding") ?? false;
  } catch {
    return false;
  }
}

async function searchTypesense(
  filters: SearchFilters,
  resolved: ResolvedQuery,
  parsed: NaturalQuery,
): Promise<SearchResult | null> {
  const available = await typesenseAvailable();
  if (!available) return null;

  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const fetchSize = Math.min(250, Math.max(perPage * page, 40));
  const clausesFor = (omit?: FacetKey) => {
    const clauses: string[] = [];
    if (omit !== "topic" && filters.topic) clauses.push(`topicSlug:=${filters.topic}`);
    if (omit !== "author" && filters.author) clauses.push(`authorSlug:=${filters.author}`);
    if (omit !== "year" && filters.year) clauses.push(`year:=${filters.year}`);
    if (!filters.year || omit === "year") {
      if (filters.from) clauses.push(`publishedAtTs:>=${Date.parse(`${filters.from}T00:00:00.000Z`)}`);
      if (filters.to) clauses.push(`publishedAtTs:<=${Date.parse(`${filters.to}T23:59:59.000Z`)}`);
    }
    return clauses;
  };
  const clauses = clausesFor();
  const hasEmbedding = await collectionHasEmbedding();
  const track = !filters.skipAnalytics;

  const client = await getTypesenseClient();
  const collection = client.collections(TYPESENSE_COLLECTION).documents();

  const run = async (
    q: string,
    queryBy: string,
    weights?: string,
    extraFilter?: string,
    overrides?: Record<string, string | number | boolean | undefined | null>,
  ) => {
    const filter = [clauses.join(" && "), extraFilter].filter(Boolean).join(" && ") || undefined;
    const { sort_by: sortBy, ...rest } = overrides ?? {};
    const response = await collection.search({
      q,
      query_by: queryBy,
      query_by_weights: weights,
      filter_by: filter,
      facet_by: "topicSlug,authorSlug,year",
      page: 1,
      per_page: fetchSize,
      exclude_fields: hasEmbedding ? "embedding" : undefined,
      ...TYPESENSE_COMMON,
      ...(sortBy === null
        ? {}
        : { sort_by: sortBy ?? (q === "*" ? "publishedAtTs:desc" : "_text_match:desc,publishedAtTs:desc") }),
      ...rest,
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

  const readFacet = (
    response: Awaited<ReturnType<typeof run>>["response"],
    field: string,
  ) =>
    (response?.facet_counts?.find((facet) => facet.field_name === field)?.counts ?? [])
      .map((entry) => ({ value: String(entry.value), count: entry.count }))
      .sort((a, b) => (field === "year" ? Number(b.value) - Number(a.value) : b.count - a.count));

  const facetQuery = parsed.keywordQ || parsed.semanticQ || "*";
  const [topicFacets, authorFacets, yearFacets] = await Promise.all(
    (["topic", "author", "year"] as const).map(async (key) => {
      const field = key === "topic" ? "topicSlug" : key === "author" ? "authorSlug" : "year";
      const filter = clausesFor(key).join(" && ") || undefined;
      const response = await collection.search({
        q: facetQuery,
        query_by: facetQuery === "*" ? "title" : "title,author,dek",
        filter_by: filter,
        facet_by: field,
        max_facet_values: 50,
        per_page: 0,
        exclude_fields: hasEmbedding ? "embedding" : undefined,
        ...TYPESENSE_COMMON,
      });
      return readFacet(response, field);
    }),
  );

  const finish = (hits: SearchHit[], found: number, mode: SearchResult["mode"]) => {
    const start = (page - 1) * perPage;
    return decorateResult(
      {
        hits: hits.slice(start, start + perPage),
        found,
        page,
        perPage,
        engine: "typesense",
        topics: topicFacets,
        authors: authorFacets,
        years: yearFacets,
      },
      resolved,
      parsed,
      mode,
    );
  };

  if (!resolved.q) {
    const empty = await run("*", "title");
    return finish(empty.hits, empty.response.found ?? empty.hits.length, "keyword");
  }

  const semanticQuery = parsed.intents.length
    ? `${parsed.semanticQ} ${parsed.intents.join(" ")}`
    : parsed.semanticQ;

  const runSemantic = async (q: string) => {
    if (!hasEmbedding || !q) return { hits: [] as SearchHit[] };
    return run(q, "embedding", undefined, undefined, {
      prefix: false,
      num_typos: 0,
      sort_by: null,
      enable_analytics: track,
      vector_query: "embedding:([], k: 60, distance_threshold: 0.60)",
    });
  };

  const runHybrid = async (q: string, alpha: number) => {
    if (!hasEmbedding || !q) return { hits: [] as SearchHit[] };
    return run(q, "title,author,dek,embedding", "8,5,3,0", undefined, {
      prefix: "true,true,true,false",
      num_typos: "1,1,1,0",
      sort_by: "_text_match:desc",
      enable_analytics: track,
      vector_query: `embedding:([], k: 80, alpha: ${alpha})`,
    });
  };

  if (parsed.natural) {
    const semantic = await runSemantic(semanticQuery);
    if (semantic.hits.length > 0) {
      return finish(semantic.hits, semantic.hits.length, "semantic");
    }
    const hybrid = await runHybrid(semanticQuery, 0.75);
    if (hybrid.hits.length > 0) {
      return finish(hybrid.hits, hybrid.hits.length, "semantic");
    }
    if (parsed.keywordQ) {
      const focused = await run(parsed.keywordQ, "title,author,dek,body", "8,5,3,1", undefined, {
        drop_tokens_threshold: 1,
      });
      if (focused.hits.length > 0) {
        return finish(focused.hits, focused.hits.length, "semantic");
      }
    }
    if (filters.topic || filters.author || filters.year || filters.from || filters.to) {
      const empty = await run("*", "title");
      return finish(empty.hits, empty.response.found ?? empty.hits.length, "semantic");
    }
  }

  const literal =
    resolved.corrected && resolved.original
      ? await run(resolved.original, "title,author", "8,5", undefined, { num_typos: 0 })
      : { hits: [] as SearchHit[], response: undefined };
  const exactOriginalInTitle = literal.hits.some((hit) =>
    normalizeQuery(hit.article.title).includes(normalizeQuery(resolved.original)),
  );
  const focused = await run(resolved.q, "title,author", "8,5", undefined, { enable_analytics: track });
  const desk = deskForTerms(resolved.terms);
  const deskResults =
    desk && !filters.topic && !exactOriginalInTitle
      ? await run("*", "title", undefined, `topicSlug:=${desk.slug}`)
      : { hits: [] as SearchHit[] };
  let merged = exactOriginalInTitle
    ? uniqueHits([literal.hits, focused.hits])
    : uniqueHits([literal.hits, focused.hits, deskResults.hits]);

  if (merged.length === 0) {
    const body = await run(resolved.q, "title,author,dek,body", "8,5,3,1", undefined, {
      enable_analytics: track,
    });
    merged = body.hits;
  }

  if (merged.length === 0 && hasEmbedding) {
    const semantic = await runSemantic(semanticQuery);
    if (semantic.hits.length > 0) {
      return finish(semantic.hits, semantic.hits.length, "semantic");
    }
  }

  return finish(merged, merged.length, "keyword");
}

export async function searchArticles(filters: SearchFilters): Promise<SearchResult> {
  const resolved = resolveSearchQuery(filters.q ?? "");
  const parsed = parseNaturalQuery(resolved);
  const effective = applyNaturalFilters(filters, parsed);
  try {
    const typed = await searchTypesense(effective, resolved, parsed);
    if (typed) return typed;
  } catch {
    // Fall back to the local archive index.
  }
  return searchArchive(effective, resolved, parsed);
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
    year: read("year") || undefined,
    from: read("from") || undefined,
    to: read("to") || undefined,
    page: Number.isFinite(page) ? page : 1,
  };
}
