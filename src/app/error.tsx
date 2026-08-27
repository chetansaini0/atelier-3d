"use client";

export default function ErrorBoundary({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.28em] text-[var(--brass)]">Something went wrong</p>
        <h1 className="font-serif mt-3 text-4xl">Could not load this view.</h1>
        <p className="mt-3 text-sm text-[var(--muted)]">{error.message}</p>
        <button className="mt-6 rounded-full bg-[var(--brass)] px-4 py-2 text-sm text-[#1a1916]" onClick={reset}>
          Try again
        </button>
      </div>
    </div>
  );
}
