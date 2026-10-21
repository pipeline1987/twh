import Link from "next/link";
import { ArticleCard } from "@/components/ArticleCard";
import { FeaturedStory } from "@/components/FeaturedStory";
import { TOPICS } from "@/data/catalog";
import {
  getArchiveBounds,
  getArticles,
  getArticlesByTopic,
  getFeatured,
  getLatest,
} from "@/lib/articles";

export default function HomePage() {
  const featured = getFeatured();
  const latest = getLatest(7).filter((article) => article.slug !== featured.slug).slice(0, 6);
  const bounds = getArchiveBounds();
  const decades = [2006, 2011, 2016, 2021];
  const fromTheVault = decades
    .map((year) => getArticles().find((article) => article.year === year && article.featured))
    .filter((article): article is NonNullable<typeof article> => Boolean(article));

  return (
    <div className="grid gap-10">
      <FeaturedStory article={featured} />

      <section>
        <div className="mb-5 flex items-end justify-between border-b-2 border-ink pb-2">
          <h2 className="font-[family-name:var(--font-herald-display)] text-3xl">The rest of the owl post</h2>
          <Link href="/archive" className="text-xs font-semibold uppercase tracking-[0.18em] hover:text-howler">
            Open the archive
          </Link>
        </div>
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {latest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>

      <section className="grid gap-8 border-y-2 border-ink py-8 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-howler">Twenty years bound</p>
          <h2 className="mt-2 font-[family-name:var(--font-herald-display)] text-4xl">
            {bounds.count} stories, {bounds.years} years, one very loud cupboard
          </h2>
          <p className="mt-4 max-w-xl text-ink-soft">
            The Herald has been shouting since {bounds.from.slice(0, 4)}. Search by desk, byline, or date —
            Typesense when the index is running, the bound archive when it is not.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/search"
              className="border border-ink bg-howler px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-howler-deep"
            >
              Search the archive
            </Link>
            <Link
              href="/archive"
              className="border border-ink px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] hover:bg-parchment-deep"
            >
              Browse by year
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {fromTheVault.map((article) => (
            <Link
              key={article.id}
              href={`/article/${article.slug}`}
              className="border border-ink bg-parchment-deep/40 p-4 hover:bg-parchment-deep"
            >
              <p className="text-[11px] uppercase tracking-[0.18em] text-howler">{article.year}</p>
              <p className="mt-2 font-[family-name:var(--font-herald-display)] text-lg leading-tight">
                {article.title}
              </p>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-10">
        {TOPICS.slice(0, 4).map((topic) => {
          const stories = getArticlesByTopic(topic.slug).slice(0, 3);
          return (
            <div key={topic.slug}>
              <div className="mb-4 flex items-end justify-between border-b border-ink pb-2">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-howler">
                    {topic.kicker}
                  </p>
                  <h2 className="font-[family-name:var(--font-herald-display)] text-3xl">{topic.name}</h2>
                </div>
                <Link
                  href={`/topic/${topic.slug}`}
                  className="text-xs font-semibold uppercase tracking-[0.18em] hover:text-howler"
                >
                  All {topic.name}
                </Link>
              </div>
              <div className="grid gap-6 md:grid-cols-3">
                {stories.map((article) => (
                  <ArticleCard key={article.id} article={article} eyebrow={false} />
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
