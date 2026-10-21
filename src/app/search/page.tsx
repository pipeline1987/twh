import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { SearchForm } from "@/components/SearchForm";
import { SearchResults } from "@/components/SearchResults";
import { getArchiveBounds } from "@/lib/articles";
import { parseSearchParams, searchArticles } from "@/lib/search";

export const metadata: Metadata = {
  title: "Search",
  description: "Search twenty years of Herald copy by topic, author, and date.",
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
          Filter by desk, correspondent, and date. Common misspellings are corrected before
          we shout at the index. Typesense handles the rest when Docker is up.
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
  const bounds = getArchiveBounds();

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
      <SearchForm filters={filters} bounds={bounds} />
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
