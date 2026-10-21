import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { PageFallback } from "@/components/PageFallback";
import { AUTHORS } from "@/data/catalog";
import { getArticlesByAuthor } from "@/lib/articles";

export function generateStaticParams() {
  return AUTHORS.map((author) => ({ slug: author.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/author/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const author = AUTHORS.find((entry) => entry.slug === slug);
  return {
    title: author?.name ?? "Correspondent",
    description: author?.bio,
  };
}

export default function AuthorPage({ params }: PageProps<"/author/[slug]">) {
  return (
    <Suspense fallback={<PageFallback label="Waiting on the correspondent…" />}>
      <AuthorBody params={params} />
    </Suspense>
  );
}

async function AuthorBody({ params }: { params: PageProps<"/author/[slug]">["params"] }) {
  const { slug } = await params;
  const author = AUTHORS.find((entry) => entry.slug === slug);
  if (!author) notFound();
  const articles = getArticlesByAuthor(author.slug);

  return (
    <div className="grid gap-8">
      <header className="max-w-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">
          {author.title}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-herald-display)] text-5xl">{author.name}</h1>
        <p className="mt-3 text-lg text-ink-soft">{author.bio}</p>
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
