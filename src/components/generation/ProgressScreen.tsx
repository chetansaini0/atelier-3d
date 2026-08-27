"use client";

const STAGES = [
  "Analyzing reference",
  "Detecting architecture",
  "Understanding rooms",
  "Generating walls",
  "Generating furniture",
  "Applying materials",
  "Preparing lighting",
  "Optimizing scene",
];

export function ProgressScreen({ percent, stage }: { percent: number; stage: string }) {
  const current = STAGES.findIndex((s) => stage.toLowerCase().includes(s.split(" ")[0].toLowerCase()));
  return (
    <div className="mx-auto max-w-lg py-16">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--brass)]">Generating environment</p>
      <h2 className="font-serif mt-3 text-4xl">Reconstructing space</h2>
      <ul className="mt-10 space-y-3">
        {STAGES.map((item, i) => {
          const done = percent >= ((i + 1) / STAGES.length) * 100 || i < current;
          const active = item === stage || i === current;
          return (
            <li key={item} className="flex items-center justify-between text-sm">
              <span className={done || active ? "text-[var(--fg)]" : "text-[var(--muted)]"}>{item}</span>
              <span className="text-[var(--brass)]">{done ? "✓" : active ? `${percent}%` : ""}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-8 h-[2px] w-full bg-white/10">
        <div className="h-full bg-[var(--brass)] transition-all" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
