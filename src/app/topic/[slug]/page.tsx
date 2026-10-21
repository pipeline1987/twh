import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { PageFallback } from "@/components/PageFallback";
import { TOPICS } from "@/data/catalog";
import { getArticlesByTopic } from "@/lib/articles";

export function generateStaticParams() {
  return TOPICS.map((topic) => ({ slug: topic.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/topic/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const topic = TOPICS.find((entry) => entry.slug === slug);
  return {
    title: topic?.name ?? "Desk",
    description: topic?.blurb,
  };
}

export default function TopicPage({ params }: PageProps<"/topic/[slug]">) {
  return (
    <Suspense fallback={<PageFallback label="Clearing the desk…" />}>
      <TopicBody params={params} />
    </Suspense>
  );
}

async function TopicBody({ params }: { params: PageProps<"/topic/[slug]">["params"] }) {
  const { slug } = await params;
  const topic = TOPICS.find((entry) => entry.slug === slug);
  if (!topic) notFound();
  const articles = getArticlesByTopic(topic.slug);

  return (
    <div className="grid gap-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">
          {topic.kicker} desk
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-herald-display)] text-5xl">{topic.name}</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">{topic.blurb}</p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
          {articles.length} {articles.length === 1 ? "dispatch" : "dispatches"}
        </p>
      </header>
      <div className="grid gap-8 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
