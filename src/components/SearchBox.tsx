export function SearchBox({
  defaultQuery = "",
  compact = false,
}: {
  defaultQuery?: string;
  compact?: boolean;
}) {
  return (
    <form action="/search" method="get" className={compact ? "flex gap-2" : "grid gap-3"}>
      <label className="sr-only" htmlFor={compact ? "masthead-q" : "hero-q"}>
        Search the archive
      </label>
      <input
        id={compact ? "masthead-q" : "hero-q"}
        name="q"
        type="search"
        defaultValue={defaultQuery}
        placeholder="Ask in a sentence, or try Howgwarts…"
        className="w-full border border-ink bg-parchment px-3 py-2 text-sm tracking-wide text-ink placeholder:text-ink-soft/70 focus:outline-none focus:ring-2 focus:ring-howler"
      />
      {!compact ? (
        <button
          type="submit"
          className="border border-ink bg-howler px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-howler-deep"
        >
          Search the archive
        </button>
      ) : (
        <button
          type="submit"
          className="border border-ink bg-ink px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-parchment hover:bg-howler"
        >
          Search
        </button>
      )}
    </form>
  );
}
