"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { OwleryChatMessage, OwleryCitation, OwleryReply, OwleryStep } from "@/lib/owlery-types";

const STARTERS = [
  "What happened when Howlers overflowed the Owlery?",
  "Who covered broom racing in 2019?",
  "Did the Ministry ever print Howgwarts?",
  "What has Rita Skeeter been shouting about?",
];

type Turn = {
  question: string;
  answer?: OwleryReply;
  error?: string;
};

function StepList({ steps }: { steps: OwleryStep[] }) {
  if (steps.length === 0) return null;
  return (
    <p className="text-[11px] uppercase tracking-[0.16em] text-ink-soft">
      {steps.map((step) => `${step.tool === "search_archive" ? "Searched" : "Read"} ${step.detail}`).join(" · ")}
    </p>
  );
}

function CitationList({ citations }: { citations: OwleryCitation[] }) {
  if (citations.length === 0) return null;
  return (
    <ul className="mt-3 grid gap-2">
      {citations.map((citation) => (
        <li key={citation.slug} className="border border-ink/30 px-3 py-2">
          <Link href={`/article/${citation.slug}`} className="font-[family-name:var(--font-herald-display)] hover:text-howler">
            {citation.title}
          </Link>
          <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">
            {citation.author} · {citation.year}
          </p>
          <p className="mt-1 text-sm text-ink-soft">{citation.dek}</p>
        </li>
      ))}
    </ul>
  );
}

export function OwleryChat() {
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [llm, setLlm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/ask")
      .then((response) => response.json() as Promise<{ llm?: boolean }>)
      .then((payload) => {
        if (!cancelled) setLlm(Boolean(payload.llm));
      })
      .catch(() => {
        if (!cancelled) setLlm(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function ask(nextQuestion: string) {
    const text = nextQuestion.trim();
    if (!text || pending) return;
    const history: OwleryChatMessage[] = turns.flatMap((turn) => {
      const rows: OwleryChatMessage[] = [{ role: "user", content: turn.question }];
      if (turn.answer) rows.push({ role: "assistant", content: turn.answer.reply });
      return rows;
    });
    history.push({ role: "user", content: text });
    setQuestion("");
    setPending(true);
    setTurns((current) => [...current, { question: text }]);
    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!response.ok) throw new Error("The owl dropped the parchment.");
      const answer = (await response.json()) as OwleryReply;
      setTurns((current) => {
        const next = [...current];
        next[next.length - 1] = { question: text, answer };
        return next;
      });
    } catch {
      setTurns((current) => {
        const next = [...current];
        next[next.length - 1] = {
          question: text,
          error: "The owl did not return. Try the question again, or search the archive directly.",
        };
        return next;
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-6">
      <p className="text-sm text-ink-soft">
        {llm
          ? "The clerk searches the index, reads the dispatches, then drafts an answer from that parchment."
          : "The clerk searches the index and reads the dispatches aloud. No outside quill is configured, so the answer is quoted from the archive itself."}
      </p>

      {turns.length === 0 ? (
        <div className="flex flex-wrap gap-2">
          {STARTERS.map((starter) => (
            <button
              key={starter}
              type="button"
              onClick={() => void ask(starter)}
              className="border border-ink px-3 py-1.5 text-left text-sm hover:bg-parchment-deep"
            >
              {starter}
            </button>
          ))}
        </div>
      ) : null}

      <ol className="grid gap-6">
        {turns.map((turn, index) => (
          <li key={`${turn.question}-${index}`} className="grid gap-3">
            <div className="border border-ink bg-parchment-deep/40 px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-howler">You shouted</p>
              <p className="mt-1">{turn.question}</p>
            </div>
            <div className="border border-ink px-4 py-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-howler">The Owlery</p>
              {turn.answer ? (
                <>
                  <StepList steps={turn.answer.steps} />
                  <div className="mt-2 grid gap-3 whitespace-pre-wrap leading-relaxed">{turn.answer.reply}</div>
                  <CitationList citations={turn.answer.citations} />
                </>
              ) : turn.error ? (
                <p className="mt-2 text-howler">{turn.error}</p>
              ) : (
                <p className="mt-2 italic text-ink-soft">The owl is in the stacks…</p>
              )}
            </div>
          </li>
        ))}
      </ol>

      <form
        className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          void ask(question);
        }}
      >
        <label className="sr-only" htmlFor="owlery-q">
          Ask the archive
        </label>
        <input
          id="owlery-q"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask the bound archive a question..."
          suppressHydrationWarning
          className="border border-ink bg-parchment px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-howler"
        />
        <button
          type="submit"
          disabled={pending}
          className="border border-ink bg-howler px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-parchment hover:bg-howler-deep disabled:opacity-60"
        >
          {pending ? "Consulting…" : "Ask the owl"}
        </button>
      </form>
    </div>
  );
}
