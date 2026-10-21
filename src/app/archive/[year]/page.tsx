import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArticleCard } from "@/components/ArticleCard";
import { PageFallback } from "@/components/PageFallback";
import { getArticlesByYear, getYears } from "@/lib/articles";

export function generateStaticParams() {
  return getYears().map((year) => ({ year: String(year) }));
}

export async function generateMetadata({
  params,
}: PageProps<"/archive/[year]">): Promise<Metadata> {
  const { year } = await params;
  return {
    title: `${year} archive`,
    description: `Wizarding Herald dispatches from ${year}.`,
  };
}

export default function ArchiveYearPage({ params }: PageProps<"/archive/[year]">) {
  return (
    <Suspense fallback={<PageFallback label="Opening the bound volume…" />}>
      <YearBody params={params} />
    </Suspense>
  );
}

async function YearBody({ params }: { params: PageProps<"/archive/[year]">["params"] }) {
  const { year: yearParam } = await params;
  const year = Number(yearParam);
  if (!Number.isFinite(year)) notFound();
  const articles = getArticlesByYear(year);
  if (articles.length === 0) notFound();

  const years = getYears();
  const index = years.indexOf(year);
  const newer = index > 0 ? years[index - 1] : undefined;
  const older = index >= 0 ? years[index + 1] : undefined;

  return (
    <div className="grid gap-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">
          <Link href="/archive" className="hover:text-ink">
            Archive
          </Link>
          {" / "}
          {year}
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-herald-blackletter)] text-6xl leading-none">{year}</h1>
        <p className="mt-3 text-lg text-ink-soft">
          {articles.length} {articles.length === 1 ? "dispatch" : "dispatches"} bound for the year.
        </p>
      </header>

      <nav className="flex justify-between text-xs font-semibold uppercase tracking-[0.16em]">
        {older ? (
          <Link href={`/archive/${older}`} className="hover:text-howler">
            {older}
          </Link>
        ) : (
          <span />
        )}
        {newer ? (
          <Link href={`/archive/${newer}`} className="hover:text-howler">
            {newer}
          </Link>
        ) : (
          <span />
        )}
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </div>
  );
}
