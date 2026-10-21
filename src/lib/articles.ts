import articlesData from "@/data/articles.json";
import { authorBySlug, topicBySlug } from "@/data/catalog";
import type { Article } from "@/lib/types";

const articles = (articlesData as Article[]).slice().sort((a, b) =>
  a.publishedAt < b.publishedAt ? 1 : -1,
);

export function getArticles() {
  return articles;
}

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getArticlesByTopic(topicSlug: string) {
  return articles.filter((article) => article.topicSlug === topicSlug);
}

export function getArticlesByAuthor(authorSlug: string) {
  return articles.filter((article) => article.authorSlug === authorSlug);
}

export function getArticlesByYear(year: number) {
  return articles.filter((article) => article.year === year);
}

export function getYears() {
  return [...new Set(articles.map((article) => article.year))].sort((a, b) => b - a);
}

export function getLatest(count = 8) {
  return articles.slice(0, count);
}

export function getFeatured() {
  return articles[0];
}

export function getFeaturedByTopic() {
  return articles.filter((article) => article.featured).slice(0, 8);
}

export function getRelated(article: Article, count = 3) {
  return articles
    .filter((candidate) => candidate.slug !== article.slug && candidate.topicSlug === article.topicSlug)
    .slice(0, count);
}

export function getOnThisDay(monthDay: string, excludeSlug?: string) {
  return articles.filter(
    (article) =>
      article.slug !== excludeSlug && article.publishedAt.slice(5) === monthDay,
  );
}

export function getArchiveBounds() {
  return {
    from: articles.at(-1)?.publishedAt ?? "2006-01-01",
    to: articles[0]?.publishedAt ?? "2026-10-20",
    count: articles.length,
    years: getYears().length,
  };
}

export function getAuthorRecord(slug: string) {
  return authorBySlug(slug);
}

export function getTopicRecord(slug: string) {
  return topicBySlug(slug);
}

export function getTopicCounts() {
  const counts = new Map<string, number>();
  for (const article of articles) {
    counts.set(article.topicSlug, (counts.get(article.topicSlug) ?? 0) + 1);
  }
  return counts;
}

export function getAuthorCounts() {
  const counts = new Map<string, number>();
  for (const article of articles) {
    counts.set(article.authorSlug, (counts.get(article.authorSlug) ?? 0) + 1);
  }
  return counts;
}
