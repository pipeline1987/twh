import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AUTHORS, TOPICS } from "@/data/catalog";
import { getSearchAnalytics, type AnalyticsEvent, type CountRow } from "@/lib/analytics";
import { searchHref } from "@/lib/search-url";
import { ensureTypesenseAnalytics, readTypesenseQueryStats } from "@/lib/typesense-analytics";

export const metadata: Metadata = {
  title: "Index desk",
  description: "Search analytics for The Wizarding Herald: popular shouts, silent queries, and clicked dispatches.",
};

function labelTopic(slug: string) {
  return TOPICS.find((topic) => topic.slug === slug)?.name ?? slug;
}

function labelAuthor(slug: string) {
  return AUTHORS.find((author) => author.slug === slug)?.name ?? slug;
}

function percent(part: number, whole: number) {
  if (whole === 0) return "0%";
  return `${Math.round((part / whole) * 100)}%`;
}

function formatWhen(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
}

function CountList({
  title,
  rows,
  hrefFor,
  labelFor,
}: {
  title: string;
  rows: CountRow[];
  hrefFor?: (row: CountRow) => string;
  labelFor?: (row: CountRow) => string;
}) {
  return (
    <section className="border border-ink bg-parchment-deep/40 p-4">
      <p className="border-b border-ink pb-1 text-[11px] font-semibold uppercase tracking-[0.2em]">{title}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-ink-soft">The desk is still waiting for a shout.</p>
      ) : (
        <ul className="mt-3 grid gap-2">
          {rows.map((row) => {
            const label = labelFor?.(row) ?? row.value;
            const href = hrefFor?.(row);
            return (
              <li key={`${row.slug ?? row.value}`} className="flex items-baseline justify-between gap-3 text-sm">
                {href ? (
                  <Link href={href} className="truncate hover:text-howler">
                    {label}
                  </Link>
                ) : (
                  <span className="truncate">{label}</span>
                )}
                <span className="text-xs tabular-nums text-ink-soft">{row.count}</span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function recentLine(event: AnalyticsEvent) {
  if (event.kind === "click") {
    return `Clicked “${event.title}”${event.q ? ` from “${event.q}”` : ""}`;
  }
  const filters = [event.topic, event.author, event.year].filter(Boolean).join(" · ");
  const query = event.q ? `“${event.q}”` : "faceted browse";
  return `${query}${filters ? ` · ${filters}` : ""} · ${event.found} hit${event.found === 1 ? "" : "s"}`;
}

export default function SearchDeskPage() {
  return (
    <Suspense fallback={<p className="text-ink-soft">The Howler desk is counting…</p>}>
      <SearchDesk />
    </Suspense>
  );
}

async function SearchDesk() {
  await connection();
  await ensureTypesenseAnalytics();
  const [ledger, typesense] = await Promise.all([getSearchAnalytics(), readTypesenseQueryStats()]);

  return (
    <div className="grid gap-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">Howler ledger</p>
        <h1 className="mt-2 font-[family-name:var(--font-herald-display)] text-5xl">The index desk</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          Every shout from the archive is counted here: queries, empty owl-posts, facets, and which
          headlines readers actually open. Typesense keeps its own popular-query rollup when the node
          is up.
        </p>
        <p className="mt-2 text-xs uppercase tracking-[0.16em]">
          <Link href="/search" className="hover:text-howler">
            Back to search
          </Link>
        </p>
      </header>

      <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Shouts", value: ledger.searches.toLocaleString("en-GB") },
          { label: "Silent shouts", value: `${ledger.zeros.toLocaleString("en-GB")} · ${percent(ledger.zeros, ledger.searches)}` },
          { label: "Opened dispatches", value: ledger.clicks.toLocaleString("en-GB") },
          {
            label: "Semantic / Typesense",
            value: `${percent(ledger.semantic, ledger.searches)} · ${percent(ledger.typesense, ledger.searches)}`,
          },
        ].map((stat) => (
          <div key={stat.label} className="border border-ink p-4">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.2em] text-howler">{stat.label}</dt>
            <dd className="mt-2 font-[family-name:var(--font-herald-display)] text-3xl">{stat.value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <CountList
          title="Loudest queries"
          rows={ledger.loudest}
          hrefFor={(row) => searchHref({ q: row.value })}
        />
        <CountList
          title="Silent shouts"
          rows={ledger.silent}
          hrefFor={(row) => (row.value === "(filters only)" ? "/search" : searchHref({ q: row.value }))}
        />
        <CountList
          title="Desks in demand"
          rows={ledger.topics}
          labelFor={(row) => labelTopic(row.value)}
          hrefFor={(row) => searchHref({ topic: row.value })}
        />
        <CountList
          title="Correspondents called for"
          rows={ledger.authors}
          labelFor={(row) => labelAuthor(row.value)}
          hrefFor={(row) => searchHref({ author: row.value })}
        />
        <CountList
          title="Years shouted"
          rows={ledger.years}
          hrefFor={(row) => searchHref({ year: row.value })}
        />
        <CountList
          title="Dispatches that left the index"
          rows={ledger.clicked}
          hrefFor={(row) => (row.slug ? `/article/${row.slug}` : "/search")}
        />
      </div>

      {typesense ? (
        <div className="grid gap-6 lg:grid-cols-2">
          <CountList
            title="Typesense popular queries"
            rows={typesense.popular}
            hrefFor={(row) => searchHref({ q: row.value })}
          />
          <CountList
            title="Typesense no-hit queries"
            rows={typesense.nohits}
            hrefFor={(row) => searchHref({ q: row.value })}
          />
        </div>
      ) : null}

      <section>
        <p className="border-b border-ink pb-1 text-[11px] font-semibold uppercase tracking-[0.2em]">
          Latest ledger lines
        </p>
        {ledger.recent.length === 0 ? (
          <p className="mt-4 text-ink-soft">No owls have shouted yet. Search the archive, then return.</p>
        ) : (
          <ol className="mt-4 divide-y divide-ink/20">
            {ledger.recent.map((event, index) => (
              <li key={`${event.at}-${index}`} className="flex flex-wrap gap-x-4 gap-y-1 py-3 text-sm">
                <span className="w-28 shrink-0 text-xs uppercase tracking-[0.14em] text-ink-soft">
                  {formatWhen(event.at)}
                </span>
                <span>{recentLine(event)}</span>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
