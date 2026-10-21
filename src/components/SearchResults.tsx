import Link from "next/link";
import { SearchHitLink } from "@/components/SearchHitLink";
import { AUTHORS, TOPICS } from "@/data/catalog";
import { formatShortDate } from "@/lib/format";
import { searchHref } from "@/lib/search-url";
import type { SearchFilters, SearchResult } from "@/lib/types";

function understoodLabel(result: SearchResult) {
  if (!result.understood) return "";
  const parts = [
    result.understood.topic
      ? TOPICS.find((topic) => topic.slug === result.understood?.topic)?.name
      : undefined,
    result.understood.author
      ? AUTHORS.find((author) => author.slug === result.understood?.author)?.name
      : undefined,
    result.understood.year,
    result.understood.from || result.understood.to
      ? [result.understood.from, result.understood.to].filter(Boolean).join(" – ")
      : undefined,
  ].filter(Boolean);
  return parts.join(" · ");
}

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
            {result.mode === "semantic" ? " · semantic" : ""}
          </p>
          <h2 className="font-[family-name:var(--font-herald-display)] text-3xl">
            {result.found.toLocaleString("en-GB")}{" "}
            {result.found === 1 ? "dispatch" : "dispatches"}
          </h2>
          {understoodLabel(result) ? (
            <p className="mt-1 text-sm text-ink-soft">Heard as {understoodLabel(result)}</p>
          ) : null}
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
                <SearchHitLink
                  href={`/article/${hit.article.slug}`}
                  query={filters.q}
                  slug={hit.article.slug}
                  title={hit.article.title}
                  className="hover:text-howler"
                >
                  {hit.article.title}
                </SearchHitLink>
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
