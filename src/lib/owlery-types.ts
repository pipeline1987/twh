export type OwleryChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type OwleryCitation = {
  slug: string;
  title: string;
  author: string;
  year: number;
  dek: string;
};

export type OwleryStep = {
  tool: "search_archive" | "read_dispatch";
  detail: string;
};

export type OwleryReply = {
  reply: string;
  citations: OwleryCitation[];
  steps: OwleryStep[];
  engine: "llm" | "archive";
};
