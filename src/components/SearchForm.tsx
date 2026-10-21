import { AUTHORS, TOPICS } from "@/data/catalog";
import type { SearchFilters } from "@/lib/types";

export function SearchForm({
  filters,
  bounds,
}: {
  filters: SearchFilters;
  bounds: { from: string; to: string };
}) {
  return (
    <form action="/search" method="get" className="grid gap-4 border border-ink bg-parchment-deep/50 p-4">
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
      <div>
        <label htmlFor="topic" className="text-[11px] font-semibold uppercase tracking-[0.2em]">
          Topic
        </label>
        <select
          id="topic"
          name="topic"
          defaultValue={filters.topic ?? ""}
          className="mt-1 w-full border border-ink bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-howler"
        >
          <option value="">All desks</option>
          {TOPICS.map((topic) => (
            <option key={topic.slug} value={topic.slug}>
              {topic.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="author" className="text-[11px] font-semibold uppercase tracking-[0.2em]">
          Author
        </label>
        <select
          id="author"
          name="author"
          defaultValue={filters.author ?? ""}
          className="mt-1 w-full border border-ink bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-howler"
        >
          <option value="">All correspondents</option>
          {AUTHORS.map((author) => (
            <option key={author.slug} value={author.slug}>
              {author.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="from" className="text-[11px] font-semibold uppercase tracking-[0.2em]">
            From
          </label>
          <input
            id="from"
            name="from"
            type="date"
            min={bounds.from}
            max={bounds.to}
            defaultValue={filters.from ?? ""}
            className="mt-1 w-full border border-ink bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-howler"
          />
        </div>
        <div>
          <label htmlFor="to" className="text-[11px] font-semibold uppercase tracking-[0.2em]">
            To
          </label>
          <input
            id="to"
            name="to"
            type="date"
            min={bounds.from}
            max={bounds.to}
            defaultValue={filters.to ?? ""}
            className="mt-1 w-full border border-ink bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-howler"
          />
        </div>
      </div>
      <button
        type="submit"
        className="border border-ink bg-howler px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-howler-deep"
      >
        Shout this query
      </button>
    </form>
  );
}
