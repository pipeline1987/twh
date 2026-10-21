import { AUTHORS, TOPICS } from "@/data/catalog";
import { getArticles } from "@/lib/articles";
import type { Article, SearchFilters, SearchHit, SearchResult } from "@/lib/types";
import { getTypesenseClient, TYPESENSE_COLLECTION, typesenseAvailable } from "@/lib/typesense";

const DEFAULT_PER_PAGE = 12;

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/howgwarts/g, "hogwarts")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function snippetFrom(article: Article, terms: string[]) {
  const haystacks = [article.dek, ...article.body];
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

function scoreArticle(article: Article, terms: string[]) {
  if (terms.length === 0) return 1;
  const title = normalize(article.title);
  const dek = normalize(article.dek);
  const body = normalize(article.body.join(" "));
  const author = normalize(article.author);
  const topic = normalize(article.topic);
  let score = 0;
  for (const term of terms) {
    if (title.includes(term)) score += 8;
    if (dek.includes(term)) score += 4;
    if (author.includes(term)) score += 5;
    if (topic.includes(term)) score += 3;
    if (body.includes(term)) score += 1;
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

function searchArchive(filters: SearchFilters): SearchResult {
  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const terms = normalize(filters.q ?? "")
    .split(" ")
    .filter(Boolean);

  let pool = getArticles();
  if (filters.topic) pool = pool.filter((article) => article.topicSlug === filters.topic);
  if (filters.author) pool = pool.filter((article) => article.authorSlug === filters.author);
  if (filters.from) pool = pool.filter((article) => article.publishedAt >= filters.from!);
  if (filters.to) pool = pool.filter((article) => article.publishedAt <= filters.to!);

  const ranked = pool
    .map((article) => ({ article, score: scoreArticle(article, terms) }))
    .filter((entry) => (terms.length === 0 ? true : entry.score > 0))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.article.publishedAt < b.article.publishedAt ? 1 : -1;
    });

  const facets = applyFacets(ranked.map((entry) => entry.article));
  const start = (page - 1) * perPage;
  const hits: SearchHit[] = ranked.slice(start, start + perPage).map((entry) => ({
    article: entry.article,
    snippet: snippetFrom(entry.article, terms),
  }));

  return {
    hits,
    found: ranked.length,
    page,
    perPage,
    engine: "archive",
    ...facets,
  };
}

function articleById(id: string) {
  return getArticles().find((article) => article.id === id);
}

async function searchTypesense(filters: SearchFilters): Promise<SearchResult | null> {
  const available = await typesenseAvailable();
  if (!available) return null;

  const page = Math.max(1, filters.page ?? 1);
  const perPage = filters.perPage ?? DEFAULT_PER_PAGE;
  const clauses: string[] = [];
  if (filters.topic) clauses.push(`topicSlug:=${filters.topic}`);
  if (filters.author) clauses.push(`authorSlug:=${filters.author}`);
  if (filters.from) clauses.push(`publishedAtTs:>=${Date.parse(`${filters.from}T00:00:00.000Z`)}`);
  if (filters.to) clauses.push(`publishedAtTs:<=${Date.parse(`${filters.to}T23:59:59.000Z`)}`);

  const client = await getTypesenseClient();
  const response = await client.collections(TYPESENSE_COLLECTION).documents().search({
    q: filters.q?.trim() ? filters.q : "*",
    query_by: "title,dek,body,author,topic",
    filter_by: clauses.join(" && ") || undefined,
    sort_by: filters.q?.trim() ? "_text_match:desc,publishedAtTs:desc" : "publishedAtTs:desc",
    facet_by: "topicSlug,authorSlug",
    page,
    per_page: perPage,
    highlight_affix_num_tokens: 16,
    exhaustive_search: true,
  });

  const hits: SearchHit[] = (response.hits ?? [])
    .map((hit) => {
      const document = hit.document as { id?: string };
      const article = document.id ? articleById(document.id) : undefined;
      if (!article) return null;
      const highlight = hit.highlights?.find((entry) => entry.field === "dek" || entry.field === "body" || entry.field === "title");
      const snippet = highlight?.snippet?.replace(/<\/?mark>/g, "") ?? article.dek;
      return { article, snippet };
    })
    .filter((hit): hit is SearchHit => hit !== null);

  const topicFacet = response.facet_counts?.find((facet) => facet.field_name === "topicSlug");
  const authorFacet = response.facet_counts?.find((facet) => facet.field_name === "authorSlug");

  return {
    hits,
    found: response.found ?? hits.length,
    page,
    perPage,
    engine: "typesense",
    topics: (topicFacet?.counts ?? []).map((entry) => ({ value: entry.value, count: entry.count })),
    authors: (authorFacet?.counts ?? []).map((entry) => ({ value: entry.value, count: entry.count })),
  };
}

export async function searchArticles(filters: SearchFilters): Promise<SearchResult> {
  try {
    const typed = await searchTypesense(filters);
    if (typed) return typed;
  } catch {
    // Fall back to the local archive index.
  }
  return searchArchive(filters);
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
