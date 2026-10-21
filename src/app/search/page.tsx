import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { SearchForm } from "@/components/SearchForm";
import { SearchResults } from "@/components/SearchResults";
import { getSearchAnalytics, scheduleSearchRecord } from "@/lib/analytics";
import { getArchiveBounds } from "@/lib/articles";
import { parseSearchParams, searchArticles } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search twenty years of Herald copy in plain English, or by topic, author, and date.",
};

export default function SearchPage(props: PageProps<"/search">) {
  return (
    <div className="grid gap-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">
          Owl index
        </p>
        <h1 className="mt-2 font-[family-name:var(--font-herald-display)] text-5xl">Search the archive</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Ask in plain English — loud letters from the owlery, Rita&apos;s 2018 Quidditch copy —
          or click the facets. Typesense matches meaning as well as spelling.{" "}
          <Link href="/search/desk" className="text-howler hover:text-ink">
            The index desk
          </Link>{" "}
          keeps the shout ledger.
        </p>
      </header>
      <Suspense fallback={<SearchFallback />}>
        <SearchPanel searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchPanel({
  searchParams,
}: {
  searchParams: PageProps<"/search">["searchParams"];
}) {
  await connection();
  const params = await searchParams;
  const filters = parseSearchParams(params);
  const result = await searchArticles(filters);
  scheduleSearchRecord(filters, result);
  const analytics = await getSearchAnalytics();
  const bounds = getArchiveBounds();

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <SearchForm filters={filters} result={result} bounds={bounds} loudest={analytics.loudest.slice(0, 5)} />
      <SearchResults result={result} filters={filters} />
    </div>
  );
}

function SearchFallback() {
  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <div className="h-80 border border-ink bg-parchment-deep/40" />
      <p className="text-ink-soft">The index is clearing its throat…</p>
    </div>
  );
}
