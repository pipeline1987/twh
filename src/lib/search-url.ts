import type { SearchFilters } from "@/lib/types";

export function searchHref(filters: SearchFilters, overrides: Partial<SearchFilters> = {}) {
  const next: SearchFilters = {
    ...filters,
    ...overrides,
    page: overrides.page ?? 1,
  };

  if ("year" in overrides && overrides.year) {
    next.from = undefined;
    next.to = undefined;
  }
  if (("from" in overrides || "to" in overrides) && (overrides.from || overrides.to)) {
    next.year = undefined;
  }

  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.topic) params.set("topic", next.topic);
  if (next.author) params.set("author", next.author);
  if (next.year) params.set("year", next.year);
  if (!next.year && next.from) params.set("from", next.from);
  if (!next.year && next.to) params.set("to", next.to);
  if (next.page && next.page > 1) params.set("page", String(next.page));
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function toggleFilter(
  filters: SearchFilters,
  key: "topic" | "author" | "year",
  value: string,
) {
  const current = filters[key];
  return searchHref(filters, { [key]: current === value ? undefined : value });
}

export function hasActiveFilters(filters: SearchFilters) {
  return Boolean(filters.topic || filters.author || filters.year || filters.from || filters.to);
}
