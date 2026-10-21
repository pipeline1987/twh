import { connection } from "next/server";
import { recordClick } from "@/lib/analytics";

export async function POST(request: Request) {
  await connection();
  let body: { q?: string; slug?: string; title?: string } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (!body.slug || !body.title) {
    return Response.json({ ok: false }, { status: 400 });
  }
  await recordClick({ q: body.q, slug: body.slug, title: body.title });
  return Response.json({ ok: true });
}
