export type Motif =
  | "quidditch"
  | "castle"
  | "forest"
  | "ministry"
  | "owl"
  | "potion"
  | "star"
  | "howler"
  | "crest";

export type Article = {
  id: string;
  slug: string;
  title: string;
  dek: string;
  kicker: string;
  body: string[];
  author: string;
  authorSlug: string;
  topic: string;
  topicSlug: string;
  publishedAt: string;
  year: number;
  featured: boolean;
  motif: Motif;
};

export type Author = {
  name: string;
  slug: string;
  title: string;
  bio: string;
};

export type Topic = {
  name: string;
  slug: string;
  kicker: string;
  motif: Motif;
  blurb: string;
};

export type SearchFilters = {
  q?: string;
  topic?: string;
  author?: string;
  from?: string;
  to?: string;
  page?: number;
  perPage?: number;
};

export type SearchHit = {
  article: Article;
  snippet: string;
};

export type SearchResult = {
  hits: SearchHit[];
  found: number;
  page: number;
  perPage: number;
  engine: "typesense" | "archive";
  topics: { value: string; count: number }[];
  authors: { value: string; count: number }[];
};
