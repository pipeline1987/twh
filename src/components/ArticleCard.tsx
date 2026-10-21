import Link from "next/link";
import type { Article } from "@/lib/types";
import { formatShortDate } from "@/lib/format";

export function ArticleCard({
  article,
  eyebrow = true,
}: {
  article: Article;
  eyebrow?: boolean;
}) {
  return (
    <article className="flex flex-col gap-2">
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-howler">
          {article.kicker} · {formatShortDate(article.publishedAt)}
        </p>
      ) : null}
      <h3 className="font-[family-name:var(--font-herald-display)] text-2xl leading-tight">
        <Link href={`/article/${article.slug}`} className="hover:text-howler">
          {article.title}
        </Link>
      </h3>
      <p className="text-sm leading-relaxed text-ink-soft">{article.dek}</p>
      <p className="text-xs uppercase tracking-[0.16em] text-ink-soft">
        <Link href={`/author/${article.authorSlug}`} className="hover:text-howler">
          {article.author}
        </Link>
        {" · "}
        <Link href={`/topic/${article.topicSlug}`} className="hover:text-howler">
          {article.topic}
        </Link>
      </p>
    </article>
  );
}
