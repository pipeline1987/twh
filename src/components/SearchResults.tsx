import Link from "next/link";
import { authorBySlug, topicBySlug } from "@/data/catalog";
import { formatShortDate } from "@/lib/format";
import type { SearchFilters, SearchResult } from "@/lib/types";

function hrefFor(filters: SearchFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.topic) params.set("topic", filters.topic);
  if (filters.author) params.set("author", filters.author);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
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
          The Owlery is empty. Try another desk, another correspondent, or a wider date.
          Howgwarts still counts as Hogwarts.
        </p>
      ) : (
        <ul className="divide-y divide-ink/20">
          {result.hits.map((hit) => (
            <li key={hit.article.id} className="py-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-howler">
                {hit.article.kicker} · {formatShortDate(hit.article.publishedAt)}
              </p>
              <h3 className="mt-1 font-[family-name:var(--font-herald-display)] text-2xl leading-tight">
                <Link href={`/article/${hit.article.slug}`} className="hover:text-howler">
                  {hit.article.title}
                </Link>
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{hit.snippet}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-ink-soft">
                <Link href={`/author/${hit.article.authorSlug}`} className="hover:text-howler">
                  {hit.article.author}
                </Link>
                {" · "}
                <Link href={`/topic/${hit.article.topicSlug}`} className="hover:text-howler">
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
            <Link href={hrefFor(filters, result.page - 1)} className="hover:text-howler">
              Previous page
            </Link>
          ) : (
            <span />
          )}
          <span>
            Page {result.page} of {pageCount}
          </span>
          {result.page < pageCount ? (
            <Link href={hrefFor(filters, result.page + 1)} className="hover:text-howler">
              Next page
            </Link>
          ) : (
            <span />
          )}
        </nav>
      ) : null}

      {result.topics.length > 0 || result.authors.length > 0 ? (
        <aside className="mt-10 grid gap-6 border-t border-ink pt-6 text-sm md:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">In this result</p>
            <ul className="mt-2">
              {result.topics.map((topic) => (
                <li key={topic.value}>
                  {topicBySlug(topic.value)?.name ?? topic.value} · {topic.count}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em]">Bylines</p>
            <ul className="mt-2">
              {result.authors.map((author) => (
                <li key={author.value}>
                  {authorBySlug(author.value)?.name ?? author.value} · {author.count}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
