import Link from "next/link";
import { formatShortDate } from "@/lib/format";
import { searchHref } from "@/lib/search-url";
import type { SearchFilters, SearchResult } from "@/lib/types";

export function SearchResults({
  result,
  filters,
}: {
  result: SearchResult;
  filters: SearchFilters;
}) {
  const pageCount = Math.max(1, Math.ceil(result.found / result.perPage));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-ink pb-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-howler">
            {result.engine === "typesense" ? "Typesense index" : "Bound archive index"}
          </p>
          <h2 className="font-[family-name:var(--font-herald-display)] text-3xl">
            {result.found.toLocaleString("en-GB")}{" "}
            {result.found === 1 ? "dispatch" : "dispatches"}
          </h2>
        </div>
        {filters.q ? (
          <p className="text-sm italic text-ink-soft">
            {result.didYouMean ? (
              <>
                for “{result.didYouMean}”
                <span className="not-italic text-ink-soft/80"> (from “{filters.q}”)</span>
              </>
            ) : (
              <>for “{filters.q}”</>
            )}
          </p>
        ) : null}
      </div>

      {result.found === 0 ? (
        <p className="mt-8 max-w-xl text-lg text-ink-soft">
          The Owlery is empty. Clear a facet, widen the dates, or try another spelling.
          Howgwarts still counts as Hogwarts.
        </p>
      ) : (
        <ul className="divide-y divide-ink/20">
          {result.hits.map((hit) => (
            <li key={hit.article.id} className="py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-howler">
                <Link href={searchHref(filters, { topic: hit.article.topicSlug })} className="hover:text-ink">
                  {hit.article.kicker}
                </Link>
                {" · "}
                <Link href={searchHref(filters, { year: String(hit.article.year) })} className="hover:text-ink">
                  {formatShortDate(hit.article.publishedAt)}
                </Link>
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-herald-display)] text-2xl leading-tight">
                <Link href={`/article/${hit.article.slug}`} className="hover:text-howler">
                  {hit.article.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{hit.snippet}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                <Link href={searchHref(filters, { author: hit.article.authorSlug })} className="hover:text-howler">
                  {hit.article.author}
                </Link>
                {" · "}
                <Link href={searchHref(filters, { topic: hit.article.topicSlug })} className="hover:text-howler">
                  {hit.article.topic}
                </Link>
              </p>
            </li>
          ))}
        </ul>
      )}

      {pageCount > 1 ? (
        <nav className="mt-8 flex items-center justify-between text-xs font-semibold uppercase tracking-[0.16em]">
          {result.page > 1 ? (
            <Link href={searchHref(filters, { page: result.page - 1 })} className="hover:text-howler">
              Previous page
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {result.page} of {pageCount}
          </span>
          {result.page < pageCount ? (
            <Link href={searchHref(filters, { page: result.page + 1 })} className="hover:text-howler">
              Next page
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}
    </div>
  );
}
