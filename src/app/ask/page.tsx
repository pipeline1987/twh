import type { Metadata } from "next";
import { OwleryChat } from "@/components/OwleryChat";

export const metadata: Metadata = {
  title: "Ask the Owlery",
  description: "Ask questions of twenty years of Herald copy. The clerk searches, reads, and answers from the archive.",
};

export default function AskPage() {
  return (
    <div className="grid gap-8">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-howler">Consulting owl</p>
        <h1 className="mt-2 font-[family-name:var(--font-herald-display)] text-5xl">Ask the Owlery</h1>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">
          A clerk for the bound archive. It searches the index, opens the dispatches, and answers
          only from parchment we actually printed.
        </p>
      </header>
      <OwleryChat />
    </div>
  );
}
