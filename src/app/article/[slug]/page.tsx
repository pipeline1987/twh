import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { MotifMark } from "@/components/MotifMark";
import { PageFallback } from "@/components/PageFallback";
import { getArticle, getArticles, getOnThisDay, getRelated } from "@/lib/articles";
import { formatDate } from "@/lib/format";

export function generateStaticParams() {
  return getArticles().map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/article/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return { title: "Missing dispatch" };
  return {
    title: article.title,
    description: article.dek,
  };
}

export default function ArticlePage({ params }: PageProps<"/article/[slug]">) {
  return (
    <Suspense fallback={<PageFallback label="Fetching the dispatch…" />}>
      <ArticleBody params={params} />
    </Suspense>
  );
}

async function ArticleBody({ params }: { params: PageProps<"/article/[slug]">["params"] }) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const related = getRelated(article);
  const onThisDay = getOnThisDay(article.publishedAt.slice(5), article.slug).slice(0, 2);

  return (
    <article className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">
          {article.kicker} · {article.topic}
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-herald-display)] text-4xl leading-[1.05] sm:text-5xl">
          {article.title}
        </h1>
        <p className="mt-4 max-w-2xl text-xl italic leading-relaxed text-ink-soft">{article.dek}</p>
        <p className="mt-5 text-xs uppercase tracking-[0.16em] text-ink-soft">
          <Link href={`/author/${article.authorSlug}`} className="hover:text-howler">
            {article.author}
          </Link>
          {" · "}
          {formatDate(article.publishedAt)}
          {" · "}
          <Link href={`/topic/${article.topicSlug}`} className="hover:text-howler">
            {article.topic}
          </Link>
        </p>
        <div className="paper-rule-double my-6" />
        <div className="max-w-2xl space-y-5 text-lg leading-8">
          {article.body.map((paragraph, index) => (
            <p key={paragraph} className={index === 0 ? "drop-cap" : undefined}>
              {paragraph}
            </p>
          ))}
        </div>
      </div>

      <aside className="border border-ink bg-parchment-deep/40 p-5">
        <MotifMark motif={article.motif} className="h-16 w-16 text-3xl" />
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.2em]">Same desk</p>
        <div className="mt-3 grid gap-5">
          {related.map((item) => (
            <ArticleCard key={item.id} article={item} />
          ))}
        </div>
        {onThisDay.length > 0 ? (
          <div className="mt-8 border-t border-ink pt-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">This day in the archive</p>
            <ul className="mt-3 grid gap-3 text-sm">
              {onThisDay.map((item) => (
                <li key={item.id}>
                  <Link href={`/article/${item.slug}`} className="hover:text-howler">
                    {item.year}: {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </aside>
    </article>
  );
}
