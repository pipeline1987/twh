import { connection } from "next/server";
import { askOwlery, owleryLlmEnabled, type OwleryChatMessage } from "@/lib/owlery";

export async function GET() {
  await connection();
  return Response.json({ llm: owleryLlmEnabled() });
}

export async function POST(request: Request) {
  await connection();
  let body: { messages?: OwleryChatMessage[] } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return Response.json({ error: "The owl could not read that parchment." }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  const result = await askOwlery(messages);
  return Response.json(result);
}
