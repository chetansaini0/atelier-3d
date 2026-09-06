"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const HeroCanvas = dynamic(() => import("@/components/landing/HeroCanvas").then((m) => m.HeroCanvas), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[var(--bg-soft)]" />,
});

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-hidden">
      <header className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-8 py-6">
        <div className="text-[11px] tracking-[0.32em] uppercase text-[var(--muted)]">3D Reconstruction</div>
        <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
          <Link href="/projects" className="transition-colors hover:text-[var(--fg)]">
            Projects
          </Link>
          <Link href="/projects/new" className="transition-colors hover:text-[var(--fg)]">
            Create
          </Link>
        </nav>
      </header>

      <section className="relative min-h-screen">
        <div className="absolute inset-0">
          <HeroCanvas />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(10,11,9,0.92)_0%,rgba(10,11,9,0.62)_42%,rgba(10,11,9,0.22)_72%,rgba(10,11,9,0.08)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(to_top,rgba(10,11,9,0.75),transparent)]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col justify-center px-8 pb-24 pt-28 lg:px-16">
          <p className="font-serif text-[clamp(3.5rem,10vw,7.5rem)] leading-[0.9] tracking-[-0.02em] text-[var(--fg)]">
            Atelier
          </p>
          <h1 className="mt-6 max-w-md text-xl font-medium leading-snug tracking-tight text-[var(--fg)] md:text-2xl">
            Turn any space into an interactive 3D world.
          </h1>
          <p className="mt-4 max-w-md text-[15px] leading-relaxed text-[var(--muted)]">
            Floor plans, DWG, DXF, and design references reconstruct as real walls and rooms — not a drawing on a plane.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/projects/new">
              <Button>
                Create 3D Environment <ArrowRight size={16} />
              </Button>
            </Link>
            <Link href="/demo">
              <Button variant="line">View Demo</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
