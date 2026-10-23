import { AUTHORS, TOPICS } from "@/data/catalog";
import { getArticle, getArticles } from "@/lib/articles";
import { formatShortDate } from "@/lib/format";
import {
  type OwleryChatMessage,
  type OwleryCitation,
  type OwleryReply,
  type OwleryStep,
} from "@/lib/owlery-types";
import { searchArticles } from "@/lib/search";
import type { Article, SearchFilters } from "@/lib/types";

export type { OwleryChatMessage, OwleryCitation, OwleryReply, OwleryStep } from "@/lib/owlery-types";

const FOLLOW_UP = /^(and|what|who|when|where|why|how|that|those|this|it|the same|her|his|their)\b/i;

const WEAK_TOKENS = new Set([
  "what",
  "when",
  "where",
  "who",
  "why",
  "how",
  "happened",
  "about",
  "been",
  "being",
  "shouting",
  "covered",
  "covering",
  "same",
  "desks",
  "desk",
  "else",
  "ever",
  "print",
  "prints",
  "printed",
  "please",
  "story",
  "stories",
  "dispatch",
  "dispatches",
  "article",
  "articles",
  "that",
  "this",
  "those",
  "these",
  "from",
  "with",
  "have",
  "does",
  "did",
  "the",
  "and",
  "for",
  "was",
  "were",
  "has",
  "had",
  "not",
  "silent",
]);

function resolveTopic(value?: string) {
  if (!value) return undefined;
  const needle = value.toLowerCase().trim();
  return TOPICS.find(
    (topic) =>
      topic.slug === needle ||
      topic.name.toLowerCase() === needle ||
      topic.kicker.toLowerCase() === needle,
  )?.slug;
}

function resolveAuthor(value?: string) {
  if (!value) return undefined;
  const needle = value.toLowerCase().trim();
  return AUTHORS.find(
    (author) =>
      author.slug === needle ||
      author.name.toLowerCase() === needle ||
      author.name.toLowerCase().split(" ").includes(needle),
  )?.slug;
}

function citationFor(article: Article): OwleryCitation {
  return {
    slug: article.slug,
    title: article.title,
    author: article.author,
    year: article.year,
    dek: article.dek,
  };
}

function lastUserQuestion(messages: OwleryChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.content.trim() ?? "";
}

function previousUserQuestion(messages: OwleryChatMessage[]) {
  const users = messages.filter((message) => message.role === "user").map((message) => message.content.trim());
  return users.length > 1 ? users[users.length - 2] : undefined;
}

function searchQueryFrom(messages: OwleryChatMessage[]) {
  const current = lastUserQuestion(messages);
  const prior = previousUserQuestion(messages);
  if (prior && FOLLOW_UP.test(current)) {
    return `${prior} ${current}`;
  }
  return current;
}

function distinctiveTokens(q: string) {
  return q
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 3 && !WEAK_TOKENS.has(token));
}

async function toolSearch(input: { q?: string; topic?: string; author?: string; year?: string }) {
  const filters: SearchFilters = {
    q: input.q?.trim() ?? "",
    topic: resolveTopic(input.topic),
    author: resolveAuthor(input.author),
    year: input.year?.replace(/\D/g, "").slice(0, 4) || undefined,
    page: 1,
    perPage: 6,
    skipAnalytics: true,
  };
  const result = await searchArticles(filters);
  const tokens = distinctiveTokens(input.q ?? filters.q ?? "");
  const toHit = (article: Article) => ({
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    author: article.author,
    topic: article.topic,
    year: article.year,
    publishedAt: article.publishedAt,
  });
  const longest = [...tokens].sort((left, right) => right.length - left.length)[0];
  const rank = (articles: Article[]) => {
    const rows = articles.map((article) => {
      const titleDek = `${article.title} ${article.dek} ${article.author} ${article.topic}`.toLowerCase();
      const body = article.body.join(" ").toLowerCase();
      let score = 0;
      for (const token of tokens) {
        const weight = token.length >= 6 ? 3 : 1;
        if (titleDek.includes(token)) score += weight * 3;
        else if (body.includes(token)) score += weight;
      }
      const hasLongest = !longest || titleDek.includes(longest) || body.includes(longest);
      return { article, score, hasLongest };
    });
    return {
      strict: rows.filter((row) => row.score > 0 && row.hasLongest).sort((a, b) => b.score - a.score),
      loose: rows.filter((row) => row.score > 0).sort((a, b) => b.score - a.score),
    };
  };

  let chosen = tokens.length === 0 ? result.hits.map((hit) => hit.article) : rank(result.hits.map((hit) => hit.article)).strict.map((row) => row.article);
  if (chosen.length === 0 && tokens.length > 0) {
    chosen = rank(getArticles()).strict.map((row) => row.article).slice(0, 6);
  }
  if (chosen.length === 0 && tokens.length > 0) {
    chosen = rank(result.hits.map((hit) => hit.article)).loose.map((row) => row.article);
  }
  if (chosen.length === 0 && tokens.length > 0) {
    chosen = rank(getArticles()).loose.map((row) => row.article).slice(0, 6);
  }
  const hits = chosen.map(toHit);

  return {
    found: hits.length,
    engine: result.engine,
    mode: result.mode,
    understood: result.understood,
    hits,
  };
}

function toolRead(slug: string) {
  const article = getArticle(slug);
  if (!article) return { error: `No dispatch with slug ${slug}` };
  return {
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    author: article.author,
    topic: article.topic,
    year: article.year,
    publishedAt: article.publishedAt,
    body: article.body,
  };
}

function composeArchiveReply(
  question: string,
  search: Awaited<ReturnType<typeof toolSearch>>,
  articles: Article[],
  steps: OwleryStep[],
): OwleryReply {
  const citations = articles.map(citationFor);
  if (articles.length === 0) {
    return {
      reply:
        "The Owlery is silent on that. The bound archive has no dispatch that answers it. Try Howlers, Howgwarts, Quidditch, or a year the paper actually printed.",
      citations: [],
      steps,
      engine: "archive",
    };
  }

  const heard = [
    search.understood?.topic,
    search.understood?.author,
    search.understood?.year,
  ].filter(Boolean);
  const intro =
    heard.length > 0
      ? `The clerk heard “${question}” as ${heard.join(" · ")} and pulled ${search.found} dispatch${search.found === 1 ? "" : "es"}.`
      : `The index found ${search.found} dispatch${search.found === 1 ? "" : "es"} that speak to this.`;

  const grafs = articles.map((article) => {
    const lead = article.body[0] ?? article.dek;
    return `In “${article.title}” (${article.author}, ${formatShortDate(article.publishedAt)}), the ${article.kicker} desk wrote: ${article.dek} ${lead}`;
  });

  const more =
    search.found > articles.length
      ? `The rest of the parchment is still in the index if you want a narrower year, desk, or correspondent.`
      : "";

  return {
    reply: [intro, ...grafs, more].filter(Boolean).join("\n\n"),
    citations,
    steps,
    engine: "archive",
  };
}

async function answerFromArchive(messages: OwleryChatMessage[]): Promise<OwleryReply> {
  const question = lastUserQuestion(messages);
  const q = searchQueryFrom(messages);
  const steps: OwleryStep[] = [{ tool: "search_archive", detail: q }];
  const search = await toolSearch({ q });
  const slugs = search.hits.slice(0, 3).map((hit) => hit.slug);
  const articles: Article[] = [];
  for (const slug of slugs) {
    const article = getArticle(slug);
    if (!article) continue;
    steps.push({ tool: "read_dispatch", detail: article.title });
    articles.push(article);
  }
  return composeArchiveReply(question, search, articles, steps);
}

const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "search_archive",
      description:
        "Search The Wizarding Herald archive by meaning, keywords, topic, correspondent, or year. Use this before answering.",
      parameters: {
        type: "object",
        additionalProperties: false,
        properties: {
          q: { type: "string", description: "Natural-language or keyword query" },
          topic: { type: "string", description: "Desk name or slug such as quidditch or Hogwarts" },
          author: { type: "string", description: "Correspondent name or slug" },
          year: { type: "string", description: "Four-digit year from 2006 to 2026" },
        },
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "read_dispatch",
      description: "Read the full text of one Herald dispatch by slug returned from search_archive.",
      parameters: {
        type: "object",
        additionalProperties: false,
        required: ["slug"],
        properties: {
          slug: { type: "string" },
        },
      },
    },
  },
];

const SYSTEM_PROMPT = `You are the Owlery clerk at The Wizarding Herald, a dummy fan newsroom about Hogwarts. Headlines are delivered at maximum volume.

Answer only from search_archive and read_dispatch results. Those tools return original dummy journalism, not book text. Do not invent plot, spells, or people that the dispatches do not mention. If the tools find nothing, say the archive is silent.

When you use a dispatch, name its title. Keep the voice dry, specific, and newspaper-like. Howgwarts is an in-joke misspelling the paper prints on purpose. Prefer two or three citations over a long speech.`;

type ToolCall = { id: string; function: { name: string; arguments: string } };

async function runTool(name: string, raw: string, steps: OwleryStep[], citations: Map<string, OwleryCitation>) {
  let args: Record<string, string> = {};
  try {
    args = JSON.parse(raw || "{}") as Record<string, string>;
  } catch {
    args = {};
  }
  if (name === "search_archive") {
    const detail = [args.q, args.topic, args.author, args.year].filter(Boolean).join(" · ") || "(empty)";
    steps.push({ tool: "search_archive", detail });
    const search = await toolSearch(args);
    for (const hit of search.hits) {
      const article = getArticle(hit.slug);
      if (article) citations.set(article.slug, citationFor(article));
    }
    return search;
  }
  if (name === "read_dispatch") {
    const read = toolRead(args.slug ?? "");
    if ("title" in read) {
      steps.push({ tool: "read_dispatch", detail: read.title });
      const article = getArticle(read.slug);
      if (article) citations.set(article.slug, citationFor(article));
    } else {
      steps.push({ tool: "read_dispatch", detail: args.slug ?? "unknown" });
    }
    return read;
  }
  return { error: `Unknown tool ${name}` };
}

async function answerWithLlm(messages: OwleryChatMessage[]): Promise<OwleryReply | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  const base = (process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/$/, "");
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
  const steps: OwleryStep[] = [];
  const citations = new Map<string, OwleryCitation>();

  const thread: Array<Record<string, unknown>> = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((message) => ({ role: message.role, content: message.content })),
  ];

  for (let turn = 0; turn < 4; turn += 1) {
    const response = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: thread,
        tools: TOOLS,
        tool_choice: turn === 0 ? "required" : "auto",
      }),
    });
    if (!response.ok) return null;
    const payload = (await response.json()) as {
      choices?: { message?: { content?: string; tool_calls?: ToolCall[] } }[];
    };
    const message = payload.choices?.[0]?.message;
    if (!message) return null;

    if (message.tool_calls?.length) {
      thread.push(message);
      for (const call of message.tool_calls) {
        const result = await runTool(call.function.name, call.function.arguments, steps, citations);
        thread.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }
      continue;
    }

    const reply = message.content?.trim();
    if (!reply) return null;
    return {
      reply,
      citations: [...citations.values()],
      steps,
      engine: "llm",
    };
  }

  return null;
}

export function owleryLlmEnabled() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function askOwlery(messages: OwleryChatMessage[]): Promise<OwleryReply> {
  const trimmed = messages
    .filter((message) => (message.role === "user" || message.role === "assistant") && message.content.trim())
    .slice(-12)
    .map((message) => ({ role: message.role, content: message.content.trim().slice(0, 2000) }));
  if (trimmed.length === 0 || trimmed.every((message) => message.role !== "user")) {
    return {
      reply: "Ask a question the archive can shout about.",
      citations: [],
      steps: [],
      engine: "archive",
    };
  }
  try {
    const llm = await answerWithLlm(trimmed);
    if (llm) return llm;
  } catch {
    // Fall back to the extractive clerk.
  }
  return answerFromArchive(trimmed);
}
