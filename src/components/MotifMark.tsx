import type { Motif } from "@/lib/types";

export function MotifMark({
  motif,
  className = "h-16 w-16",
}: {
  motif: Motif;
  className?: string;
}) {
  const icons: Record<Motif, string> = {
    quidditch: "Q",
    castle: "H",
    forest: "F",
    ministry: "M",
    owl: "O",
    potion: "P",
    star: "S",
    howler: "!",
    crest: "W",
  };

  return (
    <span
      aria-hidden
      className={`inline-flex items-center justify-center rounded-full border-2 border-ink bg-parchment-deep font-[family-name:var(--font-herald-blackletter)] text-howler ${className}`}
    >
      {icons[motif]}
    </span>
  );
}
