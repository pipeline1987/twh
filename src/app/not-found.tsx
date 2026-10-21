import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">404</p>
      <h1 className="mt-3 font-[family-name:var(--font-herald-display)] text-4xl">
        This owl could not find the landing
      </h1>
      <p className="mt-4 text-ink-soft">
        The dispatch is missing, or a staircase moved it. Try the archive, or shout a search.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link
          href="/"
          className="border border-ink bg-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-howler"
        >
          Front page
        </Link>
        <Link
          href="/search"
          className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-parchment-deep"
        >
          Search
        </Link>
      </div>
    </div>
  );
}
