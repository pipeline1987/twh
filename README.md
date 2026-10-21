# The Wizarding Herald

Dummy Hogwarts news. Headlines delivered at maximum volume.

A fan newsroom with **353 original dispatches** spanning **2006–2026**. Readers can browse the bound archive by year, desk, or correspondent, and search by **topic**, **author**, and **date**.

## Tools

| Tool | Role |
| --- | --- |
| [Next.js](https://nextjs.org/) 16 (App Router, Turbopack) | Site, routes, and search API |
| [React](https://react.dev/) 19 | UI |
| [TypeScript](https://www.typescriptlang.org/) | Typed app and archive scripts |
| [Tailwind CSS](https://tailwindcss.com/) 4 | Newspaper layout and parchment theme |
| [Typesense](https://typesense.org/) 27 | Typo-tolerant search by topic, author, and date |
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

When a Typesense node is up, search uses typo-tolerant indexing and synonyms (`Howgwarts` ↔ `Hogwarts`). If the node is down, the same filters fall back to the local archive.

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
- `/search` — topic, author, and date filters
- `/topic/[slug]` / `/author/[slug]` — desks and bylines
- `/article/[slug]` — a full dispatch
- `/about` — masthead
