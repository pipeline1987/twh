# The Wizarding Herald

Dummy Hogwarts news. Headlines delivered at maximum volume.

A fan newsroom with **353 original dispatches** spanning **2006–2026**. Readers can browse the bound archive by year, desk, or correspondent, search by **topic**, **author**, **date**, or a **plain-English sentence**, and **ask the Owlery** questions the paper actually printed.

## Tools

| Tool | Role |
| --- | --- |
| [Next.js](https://nextjs.org/) 16 (App Router, Turbopack) | Site, routes, and search API |
| [React](https://react.dev/) 19 | UI |
| [TypeScript](https://www.typescriptlang.org/) | Typed app and archive scripts |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Newspaper layout and parchment theme |
| [Typesense](https://typesense.org/) 27 | Typo-tolerant keyword search, facets, MiniLM embeddings, and query analytics |
| [typesense](https://github.com/typesense/typesense-js) JS client | Indexing and querying the `herald_articles` collection |
| [Docker Compose](https://docs.docker.com/compose/) | Local Typesense node |
| [tsx](https://tsx.is/) | Run `archive:generate` and `search:index` |
| [ESLint](https://eslint.org/) + `eslint-config-next` | Lint |

Search works without Typesense. The bound archive in `src/data/articles.json` is the fallback index.

## Run the paper

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Search works immediately against the bound archive.

## Typesense (optional, recommended)

When a Typesense node is up, search uses typo-tolerant indexing, synonyms (`Howgwarts` ↔ `Hogwarts`), and hybrid semantic search (`ts/all-MiniLM-L12-v2`). Sentences such as “loud letters from the owlery” match Howler copy even when those words never appear. If the node is down, the same filters and a smaller intent lexicon fall back to the local archive.

The first `search:index` downloads the MiniLM model into `typesense-data` and embeds every dispatch. Later indexes reuse the model. Search shouts are written to `analytics-data/ledger.json` (gitignored) and shown on `/search/desk`. Typesense also aggregates popular and no-hit queries when analytics is enabled on the node.

`/ask` is a clerk over the same index. It searches, opens the matching dispatches, and answers only from that parchment. Without `OPENAI_API_KEY` it quotes the archive. With a key it can draft after the same tool calls.

```bash
npm run search:up
npm run search:index
```

Defaults (override with env vars if you like):

| Variable | Default |
| --- | --- |
| `TYPESENSE_HOST` | `localhost` |
| `TYPESENSE_PORT` | `8108` |
| `TYPESENSE_PROTOCOL` | `http` |
| `TYPESENSE_API_KEY` | `wizardherald-dev` |

Stop the node with `npm run search:down`.

## Regenerating copy

```bash
npm run archive:generate
npm run search:index
```

The generator writes `src/data/articles.json`. All stories are original dummy journalism, not book text.

## Routes

- `/` — latest edition
- `/archive` and `/archive/[year]` — twenty-year bound volumes
- `/search` — natural-language search plus topic, author, and date facets
- `/search/desk` — search analytics: loudest queries, silent shouts, and clicks
- `/ask` — Ask the Owlery: an archive clerk that searches, reads, and answers from Herald copy
- `/topic/[slug]` / `/author/[slug]` — desks and bylines
- `/article/[slug]` — a full dispatch
- `/about` — masthead
