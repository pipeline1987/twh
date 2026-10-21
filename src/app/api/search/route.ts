import { connection } from "next/server";
import { parseSearchParams, searchArticles } from "@/lib/search";

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  const filters = parseSearchParams(Object.fromEntries(url.searchParams.entries()));
  const result = await searchArticles(filters);
  return Response.json(result);
}
