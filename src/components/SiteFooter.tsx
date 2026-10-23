import Link from "next/link";
import { AUTHORS, SITE, TOPICS } from "@/data/catalog";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t-4 border-ink pt-8">
      <div className="grid gap-8 md:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-herald-blackletter)] text-3xl leading-none">{SITE.name}</p>
          <p className="mt-2 text-sm italic text-howler">{SITE.tagline}</p>
          <p className="mt-3 max-w-sm text-sm text-ink-soft">
            Dummy Hogwarts news for a fan newsroom. Twenty years of archived parchment,
            searchable by topic, author, and date.{" "}
            <Link href="/ask" className="hover:text-howler">
              Ask the Owlery
            </Link>{" "}
            if you want a clerk to read it aloud.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Desks</p>
          <ul className="mt-3 columns-2 text-sm">
            {TOPICS.map((topic) => (
              <li key={topic.slug} className="mb-1">
                <Link href={`/topic/${topic.slug}`} className="hover:text-howler">
                  {topic.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em]">Correspondents</p>
          <ul className="mt-3 text-sm">
            {AUTHORS.slice(0, 6).map((author) => (
              <li key={author.slug} className="mb-1">
                <Link href={`/author/${author.slug}`} className="hover:text-howler">
                  {author.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="paper-rule my-6" />
      <p className="text-center text-[11px] uppercase tracking-[0.18em] text-ink-soft">
        Fan work · Original dummy copy · Hogwarts is a trademark of its owners · Howgwarts is ours
      </p>
    </footer>
  );
}
