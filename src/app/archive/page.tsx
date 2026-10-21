import type { Metadata } from "next";
import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { getArchiveBounds, getArticles, getArticlesByYear, getYears } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Archive",
  description: "Twenty years of Wizarding Herald dispatches, bound by year.",
};

export default function ArchivePage() {
  const years = getYears();
  const bounds = getArchiveBounds();
  const latestYear = years[0];
  const preview = latestYear ? getArticlesByYear(latestYear).slice(0, 4) : [];

  return (
    <div className="grid gap-10">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">Bound volumes</p>
        <h1 className="mt-2 font-[family-name:var(--font-herald-display)] text-5xl">The archive</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          {bounds.count} dummy dispatches from {bounds.from.slice(0, 4)} to {bounds.to.slice(0, 4)}.
          Pick a year, or search by topic, author, and date.
        </p>
      </header>

      <ol className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {years.map((year) => {
          const count = getArticles().filter((article) => article.year === year).length;
          const featured = getArticlesByYear(year).find((article) => article.featured);
          return (
            <li key={year}>
              <Link
                href={`/archive/${year}`}
                className="block h-full border border-ink bg-parchment-deep/30 p-4 hover:bg-parchment-deep"
              >
                <p className="font-[family-name:var(--font-herald-blackletter)] text-4xl leading-none">{year}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                  {count} {count === 1 ? "dispatch" : "dispatches"}
                </p>
                {featured ? (
                  <p className="mt-3 text-sm leading-snug text-ink-soft">{featured.title}</p>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>

      {preview.length > 0 && latestYear ? (
        <section>
          <div className="mb-4 flex items-end justify-between border-b-2 border-ink pb-2">
            <h2 className="font-[family-name:var(--font-herald-display)] text-3xl">From {latestYear}</h2>
            <Link
              href={`/archive/${latestYear}`}
              className="text-xs font-semibold uppercase tracking-[0.18em] hover:text-howler"
            >
              The full year
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {preview.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
