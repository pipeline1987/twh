import { AUTHORS, TOPICS } from "../data/catalog";

const ALIASES: Record<string, string> = {
  howgwarts: "hogwarts",
  howarts: "hogwarts",
  hogwart: "hogwarts",
  hogworts: "hogwarts",
  hogwarst: "hogwarts",
  hogswarts: "hogwarts",
  quiditch: "quidditch",
  quiddich: "quidditch",
  quidich: "quidditch",
  quiddichh: "quidditch",
  hogsmead: "hogsmeade",
  hogsmaid: "hogsmeade",
  hogsmede: "hogsmeade",
  gryfindor: "gryffindor",
  griffindor: "gryffindor",
  gryffindoor: "gryffindor",
  slitherin: "slytherin",
  slythrin: "slytherin",
  ravenclow: "ravenclaw",
  ravenclau: "ravenclaw",
  hufflepuf: "hufflepuff",
  huffelpuff: "hufflepuff",
  skeater: "skeeter",
  nifler: "niffler",
  bludgr: "bludger",
  bludgar: "bludger",
  snich: "snitch",
  howlers: "howler",
};

const EXTRA_VOCAB = [
  "hogwarts",
  "quidditch",
  "hogsmeade",
  "gryffindor",
  "slytherin",
  "ravenclaw",
  "hufflepuff",
  "howler",
  "bludger",
  "snitch",
  "niffler",
  "thestral",
  "centaur",
  "ministry",
  "broom",
  "owl",
  "owls",
  "feast",
  "staircase",
  "skeeter",
];

const VOCAB = new Set<string>([
  ...Object.values(ALIASES),
  ...Object.keys(ALIASES),
  ...EXTRA_VOCAB,
  ...TOPICS.flatMap((topic) => topic.name.toLowerCase().split(/\s+/)),
  ...AUTHORS.flatMap((author) => author.name.toLowerCase().split(/\s+/)),
]);

function levenshtein(a: string, b: string) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const grid = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i += 1) grid[i]![0] = i;
  for (let j = 0; j < cols; j += 1) grid[0]![j] = j;
  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      grid[i]![j] = Math.min(
        grid[i - 1]![j]! + 1,
        grid[i]![j - 1]! + 1,
        grid[i - 1]![j - 1]! + cost,
      );
    }
  }
  return grid[a.length]![b.length]!;
}

export function normalizeQuery(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function allowedDistance(term: string) {
  if (term.length >= 8) return 2;
  if (term.length >= 5) return 1;
  return 0;
}

function closestVocab(term: string) {
  const max = allowedDistance(term);
  if (max === 0) return term;
  let best = term;
  let bestDistance = max + 1;
  let ties = 0;
  for (const word of VOCAB) {
    if (Math.abs(word.length - term.length) > max) continue;
    const distance = levenshtein(term, word);
    if (distance < bestDistance) {
      best = word;
      bestDistance = distance;
      ties = 1;
    } else if (distance === bestDistance && word !== best) {
      ties += 1;
    }
  }
  if (bestDistance <= max && ties === 1) return ALIASES[best] ?? best;
  return term;
}

export function correctTerm(term: string) {
  const alias = ALIASES[term];
  if (alias) return alias;
  if (VOCAB.has(term)) return term;
  return closestVocab(term);
}

export type ResolvedQuery = {
  original: string;
  q: string;
  terms: string[];
  corrected: boolean;
};

export function resolveSearchQuery(raw: string): ResolvedQuery {
  const original = raw.trim();
  const terms = normalizeQuery(original).split(" ").filter(Boolean);
  const resolved = terms.map(correctTerm);
  const q = resolved.join(" ");
  return {
    original,
    q,
    terms: resolved,
    corrected: q.length > 0 && q !== normalizeQuery(original),
  };
}

export const TYPESENSE_SYNONYMS = [
  { id: "hogwarts", root: "hogwarts", synonyms: ["howarts", "hogwart", "hogworts"] },
  { id: "quidditch", root: "quidditch", synonyms: ["quiditch", "quiddich", "quidich"] },
  { id: "hogsmeade", root: "hogsmeade", synonyms: ["hogsmead", "hogsmaid"] },
  { id: "gryffindor", root: "gryffindor", synonyms: ["gryfindor", "griffindor"] },
  { id: "slytherin", root: "slytherin", synonyms: ["slitherin"] },
  { id: "howler", synonyms: ["howler", "howlers"] },
  { id: "skeeter", root: "skeeter", synonyms: ["skeater"] },
  { id: "niffler", root: "niffler", synonyms: ["nifler"] },
  { id: "bludger", root: "bludger", synonyms: ["bludgr"] },
];
