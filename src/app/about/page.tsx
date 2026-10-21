import type { Metadata } from "next";
import Link from "next/link";
import { AUTHORS, SITE } from "@/data/catalog";
import { getArchiveBounds } from "@/lib/articles";

export const metadata: Metadata = {
  title: "Masthead",
  description: "Who shouts, and how the archive is indexed.",
};

export default function AboutPage() {
  const bounds = getArchiveBounds();

  return (
    <div className="grid max-w-3xl gap-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">Staff box</p>
        <h1 className="mt-2 font-[family-name:var(--font-herald-display)] text-5xl">The masthead</h1>
      </header>
      <p className="text-lg leading-8 text-ink-soft">
        {SITE.name} is a dummy fan newsroom about Hogwarts. The copy is invented, the dates run from{" "}
        {bounds.from} to {bounds.to}, and the search desk prefers Typesense when a node is listening
        on port 8108. If it is not, the bound archive still answers by topic, author, and date.
      </p>
      <p className="text-lg leading-8 text-ink-soft">
        The tagline is a Howler joke. Headlines are supposed to arrive at maximum volume. Complaints
        may be sent the same way.
      </p>
      <ul className="grid gap-4">
        {AUTHORS.map((author) => (
          <li key={author.slug} className="border-b border-ink/20 pb-3">
            <Link href={`/author/${author.slug}`} className="font-[family-name:var(--font-herald-display)] text-2xl hover:text-howler">
              {author.name}
            </Link>
            <p className="text-xs uppercase tracking-[0.16em] text-howler">{author.title}</p>
            <p className="mt-1 text-sm text-ink-soft">{author.bio}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
