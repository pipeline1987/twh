export function PageFallback({ label = "The staircase is moving…" }: { label?: string }) {
  return (
    <div className="border border-ink bg-parchment-deep/40 px-4 py-10 text-ink-soft">
      {label}
    </div>
  );
}
