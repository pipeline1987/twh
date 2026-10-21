import { getTypesenseClient, TYPESENSE_COLLECTION, typesenseAvailable } from "@/lib/typesense";
import type { CountRow } from "@/lib/analytics";

export const TYPESENSE_POPULAR_QUERIES = "herald_popular_queries";
export const TYPESENSE_NOHITS_QUERIES = "herald_nohits_queries";

const queryCollectionSchema = (name: string) => ({
  name,
  fields: [
    { name: "q", type: "string" as const },
    { name: "count", type: "int32" as const },
  ],
  default_sorting_field: "count",
});

export async function ensureTypesenseAnalytics() {
  if (!(await typesenseAvailable())) return false;
  try {
    const client = await getTypesenseClient();
    const existing = await client.collections().retrieve();
    for (const name of [TYPESENSE_POPULAR_QUERIES, TYPESENSE_NOHITS_QUERIES]) {
      if (!existing.some((collection) => collection.name === name)) {
        await client.collections().create(queryCollectionSchema(name));
      }
    }
    await client.analyticsV1.rules().upsert("herald_popular_queries", {
      type: "popular_queries",
      params: {
        source: { collections: [TYPESENSE_COLLECTION] },
        destination: { collection: TYPESENSE_POPULAR_QUERIES },
        limit: 500,
      },
    });
    await client.analyticsV1.rules().upsert("herald_nohits_queries", {
      type: "nohits_queries",
      params: {
        source: { collections: [TYPESENSE_COLLECTION] },
        destination: { collection: TYPESENSE_NOHITS_QUERIES },
        limit: 500,
      },
    });
    return true;
  } catch {
    return false;
  }
}

async function readQueryCollection(name: string): Promise<CountRow[]> {
  try {
    const client = await getTypesenseClient();
    const response = await client.collections(name).documents().search({
      q: "*",
      query_by: "q",
      sort_by: "count:desc",
      per_page: 8,
    });
    return (response.hits ?? [])
      .map((hit) => {
        const document = hit.document as { q?: string; count?: number };
        if (!document.q) return null;
        return { value: document.q, count: document.count ?? 0 };
      })
      .filter((row): row is CountRow => row !== null);
  } catch {
    return [];
  }
}

export async function readTypesenseQueryStats() {
  if (!(await typesenseAvailable())) return null;
  const [popular, nohits] = await Promise.all([
    readQueryCollection(TYPESENSE_POPULAR_QUERIES),
    readQueryCollection(TYPESENSE_NOHITS_QUERIES),
  ]);
  if (popular.length === 0 && nohits.length === 0) return null;
  return { popular, nohits };
}
