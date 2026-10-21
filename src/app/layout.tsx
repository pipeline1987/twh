import type { Metadata } from "next";
import { Newsreader, Source_Serif_4, UnifrakturCook } from "next/font/google";
import { Masthead } from "@/components/Masthead";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE } from "@/data/catalog";
import { getArchiveBounds, getArticles } from "@/lib/articles";
import "./globals.css";

const masthead = UnifrakturCook({
  weight: "700",
  subsets: ["latin"],
  variable: "--font-herald-blackletter",
});

const display = Newsreader({
  subsets: ["latin"],
  variable: "--font-herald-display",
});

const body = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-herald-body",
});

export const metadata: Metadata = {
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: `${SITE.tagline} Dummy Hogwarts news with a twenty-year searchable archive.`,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const bounds = getArchiveBounds();
  const editionDate = getArticles()[0]?.publishedAt ?? bounds.to;

  return (
    <html
      lang="en"
      className={`${masthead.variable} ${display.variable} ${body.variable} h-full antialiased`}
    >
      <body className={`${body.className} min-h-full`}>
        <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
          <Masthead editionDate={editionDate} articleCount={bounds.count} />
          <main className="flex-1 pt-8">{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
