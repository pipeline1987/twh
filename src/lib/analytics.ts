import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { after } from "next/server";
import type { SearchFilters, SearchResult } from "@/lib/types";

const LEDGER_PATH = join(process.cwd(), "analytics-data", "ledger.json");
const MAX_EVENTS = 2500;

export type SearchEvent = {
  kind: "search";
  at: string;
  q: string;
  topic?: string;
  author?: string;
  year?: string;
  from?: string;
  to?: string;
  found: number;
  engine: SearchResult["engine"];
  mode: SearchResult["mode"];
};

export type ClickEvent = {
  kind: "click";
  at: string;
  q: string;
  slug: string;
  title: string;
};

export type AnalyticsEvent = SearchEvent | ClickEvent;

type Ledger = { events: AnalyticsEvent[] };

export type CountRow = { value: string; count: number; slug?: string };

let writeChain = Promise.resolve();

async function readLedger(): Promise<Ledger> {
  try {
    const parsed = JSON.parse(await readFile(LEDGER_PATH, "utf8")) as Ledger;
    return { events: Array.isArray(parsed.events) ? parsed.events : [] };
  } catch {
    return { events: [] };
  }
}

async function writeLedger(ledger: Ledger) {
  await mkdir(dirname(LEDGER_PATH), { recursive: true });
  await writeFile(LEDGER_PATH, `${JSON.stringify({ events: ledger.events.slice(-MAX_EVENTS) }, null, 2)}\n`);
}

function enqueue(work: () => Promise<void>) {
  writeChain = writeChain.then(work).catch(() => undefined);
  return writeChain;
}

function topCounts(values: string[], limit = 8): CountRow[] {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    .slice(0, limit);
}

export function shouldRecordSearch(filters: SearchFilters) {
  if ((filters.page ?? 1) > 1) return false;
  return Boolean(
    filters.q?.trim() || filters.topic || filters.author || filters.year || filters.from || filters.to,
  );
}

export function recordSearch(filters: SearchFilters, result: SearchResult) {
  if (!shouldRecordSearch(filters)) return;
  return enqueue(async () => {
    const ledger = await readLedger();
    ledger.events.push({
      kind: "search",
      at: new Date().toISOString(),
      q: filters.q?.trim() ?? "",
      topic: filters.topic,
      author: filters.author,
      year: filters.year,
      from: filters.from,
      to: filters.to,
      found: result.found,
      engine: result.engine,
      mode: result.mode,
    });
    await writeLedger(ledger);
  });
}

export function recordClick(input: { q?: string; slug: string; title: string }) {
  const slug = input.slug.trim();
  const title = input.title.trim();
  if (!slug || !title) return;
  return enqueue(async () => {
    const ledger = await readLedger();
    ledger.events.push({
      kind: "click",
      at: new Date().toISOString(),
      q: input.q?.trim() ?? "",
      slug,
      title,
    });
    await writeLedger(ledger);
  });
}

export function scheduleSearchRecord(filters: SearchFilters, result: SearchResult) {
  after(() => {
    void recordSearch(filters, result);
  });
}

export async function getSearchAnalytics() {
  const { events } = await readLedger();
  const searches = events.filter((event): event is SearchEvent => event.kind === "search");
  const clicks = events.filter((event): event is ClickEvent => event.kind === "click");
  const queries = searches.filter((event) => event.q);
  const zeros = searches.filter((event) => event.found === 0);
  const clickedBySlug = new Map<string, { title: string; count: number }>();
  for (const click of clicks) {
    const current = clickedBySlug.get(click.slug);
    clickedBySlug.set(click.slug, {
      title: click.title,
      count: (current?.count ?? 0) + 1,
    });
  }

  return {
    searches: searches.length,
    queries: queries.length,
    zeros: zeros.length,
    clicks: clicks.length,
    semantic: searches.filter((event) => event.mode === "semantic").length,
    typesense: searches.filter((event) => event.engine === "typesense").length,
    loudest: topCounts(queries.map((event) => event.q)),
    silent: topCounts(zeros.map((event) => event.q || "(filters only)")),
    topics: topCounts(searches.map((event) => event.topic ?? "")),
    authors: topCounts(searches.map((event) => event.author ?? "")),
    years: topCounts(searches.map((event) => event.year ?? "")),
    clicked: [...clickedBySlug.entries()]
      .map(([slug, row]) => ({ value: row.title, count: row.count, slug }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    recent: [...events].reverse().slice(0, 16),
  };
}
