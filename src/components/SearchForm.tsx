import Link from "next/link";
import { AUTHORS, TOPICS } from "@/data/catalog";
import { hasActiveFilters, searchHref, toggleFilter } from "@/lib/search-url";
import type { FacetValue, SearchFilters, SearchResult } from "@/lib/types";

const DECADES = [
  { label: "2006–10", from: "2006-01-01", to: "2010-12-31" },
  { label: "2011–15", from: "2011-01-01", to: "2015-12-31" },
  { label: "2016–20", from: "2016-01-01", to: "2020-12-31" },
  { label: "2021–26", from: "2021-01-01", to: "2026-10-20" },
];

function FacetList({
  title,
  items,
  selected,
  hrefFor,
  labelFor,
}: {
  title: string;
  items: FacetValue[];
  selected?: string;
  hrefFor: (value: string) => string;
  labelFor: (value: string) => string;
}) {
  if (items.length === 0) return null;
  return (
    <section>
      <p className="border-b border-ink pb-1 text-[11px] font-semibold uppercase tracking-[0.2em]">{title}</p>
      <ul className="mt-2 grid gap-1">
        {items.map((item) => {
          const active = selected === item.value;
          return (
            <li key={item.value}>
              <Link
                href={hrefFor(item.value)}
                className={`flex items-center justify-between gap-3 px-1 py-0.5 text-sm hover:text-howler ${
                  active ? "bg-ink text-parchment hover:text-parchment" : ""
                }`}
              >
                <span>{labelFor(item.value)}</span>
                <span className={`text-xs tabular-nums ${active ? "text-parchment/80" : "text-ink-soft"}`}>
                  {item.count}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function SearchForm({
  filters,
  result,
  bounds,
}: {
  filters: SearchFilters;
  result: SearchResult;
  bounds: { from: string; to: string };
}) {
  const decadeActive = DECADES.find(
    (decade) => decade.from === filters.from && decade.to === filters.to,
  );

  return (
    <aside className="grid gap-6 border border-ink bg-parchment-deep/50 p-4">
      <form action="/search" method="get" className="grid gap-3">
        <div>
          <label htmlFor="q" className="text-[11px] font-semibold uppercase tracking-[0.2em]">
            Query
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={filters.q ?? ""}
            placeholder="Howlers, Quidditch, Howgwarts…"
            className="mt-1 w-full border border-ink bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-howler"
          />
        </div>
        {filters.topic ? <input type="hidden" name="topic" value={filters.topic} /> : null}
        {filters.author ? <input type="hidden" name="author" value={filters.author} /> : null}
        {filters.year ? <input type="hidden" name="year" value={filters.year} /> : null}
        {!filters.year && filters.from ? <input type="hidden" name="from" value={filters.from} /> : null}
        {!filters.year && filters.to ? <input type="hidden" name="to" value={filters.to} /> : null}
        <button
          type="submit"
          className="border border-ink bg-howler px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-howler-deep"
        >
          Shout this query
        </button>
      </form>

      {hasActiveFilters(filters) ? (
        <div className="flex flex-wrap gap-2">
          {filters.topic ? (
            <Link
              href={searchHref(filters, { topic: undefined })}
              className="border border-ink bg-ink px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-parchment"
            >
              {TOPICS.find((topic) => topic.slug === filters.topic)?.name ?? filters.topic} ×
            </Link>
          ) : null}
          {filters.author ? (
            <Link
              href={searchHref(filters, { author: undefined })}
              className="border border-ink bg-ink px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-parchment"
            >
              {AUTHORS.find((author) => author.slug === filters.author)?.name ?? filters.author} ×
            </Link>
          ) : null}
          {filters.year ? (
            <Link
              href={searchHref(filters, { year: undefined })}
              className="border border-ink bg-ink px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-parchment"
            >
              {filters.year} ×
            </Link>
          ) : null}
          {filters.from || filters.to ? (
            <Link
              href={searchHref(filters, { from: undefined, to: undefined })}
              className="border border-ink bg-ink px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-parchment"
            >
              {filters.from || "…"} – {filters.to || "…"} ×
            </Link>
          ) : null}
          <Link href={searchHref({ q: filters.q })} className="px-2 py-1 text-[11px] uppercase tracking-[0.14em] hover:text-howler">
            Clear filters
          </Link>
        </div>
      ) : null}

      <FacetList
        title="Category"
        items={result.topics}
        selected={filters.topic}
        hrefFor={(value) => toggleFilter(filters, "topic", value)}
        labelFor={(value) => {
          const topic = TOPICS.find((entry) => entry.slug === value);
          return topic ? `${topic.kicker} · ${topic.name}` : value;
        }}
      />

      <FacetList
        title="Correspondent"
        items={result.authors}
        selected={filters.author}
        hrefFor={(value) => toggleFilter(filters, "author", value)}
        labelFor={(value) => AUTHORS.find((entry) => entry.slug === value)?.name ?? value}
      />

      <section>
        <p className="border-b border-ink pb-1 text-[11px] font-semibold uppercase tracking-[0.2em]">Date</p>
        <div className="mt-2 flex flex-wrap gap-1">
          {DECADES.map((decade) => {
            const active = decadeActive?.label === decade.label;
            return (
              <Link
                key={decade.label}
                href={
                  active
                    ? searchHref(filters, { from: undefined, to: undefined })
                    : searchHref(filters, { from: decade.from, to: decade.to })
                }
                className={`border border-ink px-2 py-1 text-[11px] uppercase tracking-[0.12em] ${
                  active ? "bg-ink text-parchment" : "hover:bg-parchment"
                }`}
              >
                {decade.label}
              </Link>
            );
          })}
        </div>
        <ul className="mt-3 grid max-h-64 gap-1 overflow-y-auto">
          {result.years.map((item) => {
            const active = filters.year === item.value;
            return (
              <li key={item.value}>
                <Link
                  href={toggleFilter(filters, "year", item.value)}
                  className={`flex items-center justify-between gap-3 px-1 py-0.5 text-sm hover:text-howler ${
                    active ? "bg-ink text-parchment hover:text-parchment" : ""
                  }`}
                >
                  <span>{item.value}</span>
                  <span className={`text-xs tabular-nums ${active ? "text-parchment/80" : "text-ink-soft"}`}>
                    {item.count}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <form action="/search" method="get" className="mt-3 grid grid-cols-2 gap-2">
          {filters.q ? <input type="hidden" name="q" value={filters.q} /> : null}
          {filters.topic ? <input type="hidden" name="topic" value={filters.topic} /> : null}
          {filters.author ? <input type="hidden" name="author" value={filters.author} /> : null}
          <div>
            <label htmlFor="from" className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              From
            </label>
            <input
              id="from"
              name="from"
              type="date"
              min={bounds.from}
              max={bounds.to}
              defaultValue={filters.from ?? ""}
              className="mt-1 w-full border border-ink bg-parchment px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-howler"
            />
          </div>
          <div>
            <label htmlFor="to" className="text-[11px] font-semibold uppercase tracking-[0.16em]">
              To
            </label>
            <input
              id="to"
              name="to"
              type="date"
              min={bounds.from}
              max={bounds.to}
              defaultValue={filters.to ?? ""}
              className="mt-1 w-full border border-ink bg-parchment px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-howler"
            />
          </div>
          <button
            type="submit"
            className="col-span-2 border border-ink px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] hover:bg-parchment"
          >
            Apply dates
          </button>
        </form>
      </section>
    </aside>
  );
}
