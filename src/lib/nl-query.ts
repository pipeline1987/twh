import { AUTHORS, TOPICS } from "../data/catalog";
import { normalizeQuery, type ResolvedQuery } from "./query";

const FILLER = new Set([
  "show",
  "me",
  "us",
  "find",
  "get",
  "search",
  "look",
  "looking",
  "for",
  "articles",
  "article",
  "stories",
  "story",
  "dispatches",
  "dispatch",
  "news",
  "copy",
  "pieces",
  "piece",
  "written",
  "writing",
  "by",
  "about",
  "on",
  "covering",
  "regarding",
  "please",
  "the",
  "a",
  "an",
  "in",
  "during",
  "from",
  "to",
  "between",
  "and",
  "of",
  "with",
  "that",
  "this",
  "those",
  "these",
  "any",
  "some",
  "all",
  "what",
  "happened",
  "when",
  "where",
  "who",
  "did",
  "does",
  "like",
  "related",
  "mentioning",
]);

const INTENTS: { phrases: string[]; terms: string[] }[] = [
  {
    phrases: ["loud letter", "loud mail", "angry letter", "angry mail", "shouting mail", "screaming letter", "red envelope"],
    terms: ["howler"],
  },
  {
    phrases: ["broom race", "broom racing", "flying match", "house match", "snitch hunt"],
    terms: ["quidditch", "snitch", "bludger"],
  },
  {
    phrases: ["village shop", "weekend trip", "butterbeer", "honeydukes"],
    terms: ["hogsmeade"],
  },
  {
    phrases: ["ministry paperwork", "official notice", "decree"],
    terms: ["ministry", "decree"],
  },
  {
    phrases: ["magical creature", "forest beast", "care of creatures"],
    terms: ["creatures", "niffler", "thestral"],
  },
  {
    phrases: ["exam week", "biting book", "house cup"],
    terms: ["education", "owl"],
  },
];

export type NaturalQuery = {
  original: string;
  q: string;
  terms: string[];
  semanticQ: string;
  keywordQ: string;
  topic?: string;
  author?: string;
  year?: string;
  from?: string;
  to?: string;
  natural: boolean;
  intents: string[];
};

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function takeMatch(haystack: string, phrase: string) {
  const pattern = new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "i");
  if (!pattern.test(haystack)) return { next: haystack, hit: false };
  return { next: haystack.replace(pattern, " ").replace(/\s+/g, " ").trim(), hit: true };
}

function extractAuthor(haystack: string) {
  const names = AUTHORS.flatMap((author) => {
    const [first, ...rest] = author.name.toLowerCase().split(" ");
    const last = rest.join(" ");
    return [
      { slug: author.slug, phrase: author.name.toLowerCase() },
      ...(last ? [{ slug: author.slug, phrase: last }] : []),
      ...(first ? [{ slug: author.slug, phrase: first }] : []),
    ];
  }).sort((a, b) => b.phrase.length - a.phrase.length);

  for (const name of names) {
    const attempt = takeMatch(haystack, name.phrase);
    if (attempt.hit) return { author: name.slug, next: attempt.next };
  }
  return { next: haystack };
}

function extractTopic(haystack: string) {
  const labels = TOPICS.flatMap((topic) => [
    { slug: topic.slug, phrase: topic.name.toLowerCase() },
    { slug: topic.slug, phrase: topic.kicker.toLowerCase() },
    { slug: topic.slug, phrase: topic.slug },
  ]).sort((a, b) => b.phrase.length - a.phrase.length);

  for (const label of labels) {
    const attempt = takeMatch(haystack, label.phrase);
    if (attempt.hit) return { topic: label.slug, next: attempt.next };
  }
  return { next: haystack };
}

function extractDates(haystack: string) {
  let next = haystack;
  let year: string | undefined;
  let from: string | undefined;
  let to: string | undefined;

  const range = next.match(
    /\b(?:from|between)\s+(20\d{2})\s+(?:to|and)\s+(20\d{2})\b|\b(20\d{2})\s*[-–—]\s*(20\d{2})\b/,
  );
  if (range) {
    const start = Number(range[1] ?? range[3]);
    const end = Number(range[2] ?? range[4]);
    if (start >= 2006 && end <= 2026 && start <= end) {
      from = `${start}-01-01`;
      to = `${end}-12-31`;
      next = next.replace(range[0], " ");
    }
  }

  const decade = next.match(/\b(20\d{2})s\b/);
  if (!from && decade) {
    const start = Number(decade[1]);
    if (start >= 2000 && start <= 2020) {
      from = `${Math.max(start, 2006)}-01-01`;
      to = `${Math.min(start + 9, 2026)}-12-31`;
      next = next.replace(decade[0], " ");
    }
  }

  const yearMatch = next.match(/\b(20\d{2})\b/);
  if (!from && yearMatch) {
    const value = Number(yearMatch[1]);
    if (value >= 2006 && value <= 2026) {
      year = String(value);
      next = next.replace(yearMatch[0], " ");
    }
  }

  return { year, from, to, next: next.replace(/\s+/g, " ").trim() };
}

function stripFiller(haystack: string) {
  const kept = haystack.split(" ").filter((term) => term && !FILLER.has(term));
  return { text: kept.join(" "), stripped: kept.length !== haystack.split(" ").filter(Boolean).length };
}

function intentTerms(haystack: string) {
  const extra: string[] = [];
  for (const intent of INTENTS) {
    if (intent.phrases.some((phrase) => haystack.includes(phrase))) {
      extra.push(...intent.terms);
    }
  }
  return [...new Set(extra)];
}

export function parseNaturalQuery(resolved: ResolvedQuery): NaturalQuery {
  const corrected = resolved.q;
  let working = corrected;

  const authorHit = extractAuthor(working);
  working = authorHit.next;
  const topicHit = extractTopic(working);
  working = topicHit.next;
  const dates = extractDates(working);
  working = dates.next;

  const filler = stripFiller(working);
  const remaining = filler.text;
  const intents = intentTerms(corrected);
  const extracted = Boolean(authorHit.author || topicHit.topic || dates.year || dates.from);
  const natural =
    resolved.terms.length >= 4 ||
    filler.stripped ||
    (extracted && resolved.terms.length >= 2);

  const keywordTerms = remaining.split(" ").filter(Boolean);
  const keywordQ = keywordTerms.length > 0 ? remaining : natural && extracted ? "" : corrected;

  return {
    original: resolved.original,
    q: corrected,
    terms: keywordTerms.length > 0 ? keywordTerms : resolved.terms,
    semanticQ: corrected || resolved.original,
    keywordQ,
    topic: natural ? topicHit.topic : undefined,
    author: natural ? authorHit.author : undefined,
    year: natural ? dates.year : undefined,
    from: natural ? dates.from : undefined,
    to: natural ? dates.to : undefined,
    natural,
    intents,
  };
}

export function applyNaturalFilters(filters: import("./types").SearchFilters, parsed: NaturalQuery) {
  if (!parsed.natural) return filters;
  const year = filters.year ?? parsed.year;
  const from = filters.year || filters.from ? filters.from : parsed.from;
  const to = filters.year || filters.to ? filters.to : parsed.to;
  return {
    ...filters,
    topic: filters.topic ?? parsed.topic,
    author: filters.author ?? parsed.author,
    year,
    from: year ? undefined : from,
    to: year ? undefined : to,
  };
}

export function understoodFrom(parsed: NaturalQuery) {
  if (!parsed.natural) return undefined;
  const understood = {
    topic: parsed.topic,
    author: parsed.author,
    year: parsed.year,
    from: parsed.from,
    to: parsed.to,
  };
  return understood.topic || understood.author || understood.year || understood.from || understood.to
    ? understood
    : undefined;
}

export function expandArchiveTerms(parsed: NaturalQuery) {
  return [...new Set([...parsed.terms, ...parsed.intents].map(normalizeQuery).filter(Boolean))];
}
