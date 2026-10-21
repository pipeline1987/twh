import Link from "next/link";
import { MotifMark } from "@/components/MotifMark";
import type { Article } from "@/lib/types";
import { formatDate } from "@/lib/format";

export function FeaturedStory({ article }: { article: Article }) {
  return (
    <article className="grid gap-6 border-b-2 border-ink pb-8 lg:grid-cols-[1.4fr_0.8fr] lg:items-end">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-howler">
          Latest edition · {article.kicker}
        </p>
        <h2 className="mt-3 font-[family-name:var(--font-herald-display)] text-4xl leading-[1.05] sm:text-5xl">
          <Link href={`/article/${article.slug}`} className="hover:text-howler">
            {article.title}
          </Link>
        </h2>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-soft">{article.dek}</p>
        <p className="mt-4 text-xs uppercase tracking-[0.16em] text-ink-soft">
          <Link href={`/author/${article.authorSlug}`} className="hover:text-howler">
            {article.author}
          </Link>
          {" · "}
          {formatDate(article.publishedAt)}
        </p>
      </div>
      <div className="flex flex-col items-start justify-end gap-4 border border-ink bg-parchment-deep/60 p-5">
        <MotifMark motif={article.motif} className="h-20 w-20 text-4xl" />
        <p className="text-sm leading-relaxed text-ink-soft">{article.body[0]}</p>
        <Link
          href={`/article/${article.slug}`}
          className="text-xs font-semibold uppercase tracking-[0.2em] text-howler hover:underline"
        >
          Continue reading
        </Link>
      </div>
    </article>
  );
}
