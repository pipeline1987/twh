import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Typesense from "typesense";
import type { Article } from "../src/lib/types.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const COLLECTION = "herald_articles";

const client = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST ?? "localhost",
      port: Number(process.env.TYPESENSE_PORT ?? 8108),
      protocol: process.env.TYPESENSE_PROTOCOL ?? "http",
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY ?? "wizardherald-dev",
  connectionTimeoutSeconds: 5,
});

const schema = {
  name: COLLECTION,
  fields: [
    { name: "id", type: "string" },
    { name: "slug", type: "string" },
    { name: "title", type: "string" },
    { name: "dek", type: "string" },
    { name: "body", type: "string" },
    { name: "author", type: "string", facet: true },
    { name: "authorSlug", type: "string", facet: true },
    { name: "topic", type: "string", facet: true },
    { name: "topicSlug", type: "string", facet: true },
    { name: "publishedAt", type: "string", facet: true },
    { name: "publishedAtTs", type: "int64" },
    { name: "year", type: "int32", facet: true },
    { name: "kicker", type: "string", facet: true },
  ],
  default_sorting_field: "publishedAtTs",
  token_separators: ["'", "-"],
  symbols_to_index: [],
};

async function waitForTypesense(attempts = 20) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const health = await client.health.retrieve();
      if (health.ok) return;
    } catch {
      // Node is still coming up.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error("Typesense did not become ready on localhost:8108");
}

async function main() {
  await waitForTypesense();
  const articles = JSON.parse(
    readFileSync(join(__dirname, "../src/data/articles.json"), "utf8"),
  ) as Article[];

  const existing = await client.collections().retrieve();
  if (existing.some((collection) => collection.name === COLLECTION)) {
    await client.collections(COLLECTION).delete();
  }

  await client.collections().create(schema as Parameters<typeof client.collections.create>[0]);

  const documents = articles.map((article) => ({
    id: article.id,
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    body: article.body.join("\n\n"),
    author: article.author,
    authorSlug: article.authorSlug,
    topic: article.topic,
    topicSlug: article.topicSlug,
    publishedAt: article.publishedAt,
    publishedAtTs: Date.parse(`${article.publishedAt}T00:00:00.000Z`),
    year: article.year,
    kicker: article.kicker,
  }));

  const result = await client.collections(COLLECTION).documents().import(documents, {
    action: "upsert",
  });
  const failed = result.filter((row) => !row.success);
  if (failed.length) {
    throw new Error(`Typesense import failed for ${failed.length} documents`);
  }

  const synonyms = [
    { id: "howler", synonyms: ["howler", "howlers", "loud letter"] },
    { id: "quidditch", synonyms: ["quidditch", "broom sport"] },
  ];
  for (const synonym of synonyms) {
    await client.collections(COLLECTION).synonyms().upsert(synonym.id, {
      synonyms: synonym.synonyms,
    });
  }

  console.log(`Indexed ${documents.length} articles into ${COLLECTION}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
