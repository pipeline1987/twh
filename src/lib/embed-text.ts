import type { Article } from "./types";

export function articleEmbedText(article: Article) {
  return [
    article.kicker,
    article.title,
    article.dek,
    `${article.topic} desk`,
    `By ${article.author}`,
    ...article.body.slice(0, 2),
  ]
    .filter(Boolean)
    .join(". ");
}
