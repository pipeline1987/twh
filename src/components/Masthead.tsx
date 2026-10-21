import Link from "next/link";
import { SITE, TOPICS } from "@/data/catalog";
import { SearchBox } from "@/components/SearchBox";
import { formatDate, issueNumber } from "@/lib/format";

export function Masthead({
  editionDate,
  articleCount,
}: {
  editionDate: string;
  articleCount: number;
}) {
  return (
    <header className="border-b-4 border-ink">
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] uppercase tracking-[0.22em] text-ink-soft">
        <p>Est. {SITE.founded} · {SITE.place}</p>
        <p>Price {SITE.price}</p>
      </div>
      <div className="paper-rule-double my-3" />
      <div className="text-center">
        <p className="text-[11px] uppercase tracking-[0.35em] text-gold">
          Independent parchment · Not the Daily Prophet
        </p>
        <Link href="/" className="block no-underline">
          <h1 className="font-[family-name:var(--font-herald-blackletter)] text-5xl leading-none text-ink sm:text-7xl md:text-8xl">
            {SITE.name}
          </h1>
        </Link>
        <p className="mt-2 font-[family-name:var(--font-herald-display)] text-lg italic text-howler sm:text-xl">
          {SITE.tagline}
        </p>
      </div>
      <div className="paper-rule-double my-3" />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-xs uppercase tracking-[0.18em] text-ink-soft">
          {formatDate(editionDate)} · Issue No. {issueNumber(articleCount)}
        </p>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-semibold uppercase tracking-[0.16em]">
          <Link href="/" className="hover:text-howler">
            Latest
          </Link>
          <Link href="/archive" className="hover:text-howler">
            Archive
          </Link>
          <Link href="/search" className="hover:text-howler">
            Search
          </Link>
          <Link href="/search/desk" className="hover:text-howler">
            Index desk
          </Link>
          <Link href="/about" className="hover:text-howler">
            Masthead
          </Link>
          {TOPICS.slice(0, 5).map((topic) => (
            <Link key={topic.slug} href={`/topic/${topic.slug}`} className="hidden hover:text-howler lg:inline">
              {topic.name}
            </Link>
          ))}
        </nav>
        <div className="w-full md:max-w-xs">
          <SearchBox compact defaultQuery="" />
        </div>
      </div>
    </header>
  );
}
