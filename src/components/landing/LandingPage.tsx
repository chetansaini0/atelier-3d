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
        <div className="text-sm tracking-[0.28em] uppercase text-[var(--muted)]">Atelier</div>
        <nav className="flex items-center gap-6 text-sm text-[var(--muted)]">
          <Link href="/projects" className="hover:text-[var(--fg)]">
            Projects
          </Link>
          <Link href="/projects/new" className="hover:text-[var(--fg)]">
            Create
          </Link>
        </nav>
      </header>

      <section className="relative min-h-screen">
        <div className="absolute inset-0">
          <HeroCanvas />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,rgba(12,13,11,0.88)_0%,rgba(12,13,11,0.55)_48%,rgba(12,13,11,0.18)_100%)]" />
        </div>
        <div className="relative z-10 flex min-h-screen flex-col justify-center px-8 pb-20 pt-28 lg:px-16">
          <p className="mb-5 text-xs uppercase tracking-[0.32em] text-[var(--brass)]">Reference → Reconstruct → Walk</p>
          <h1 className="font-serif max-w-xl text-5xl leading-[1.05] md:text-6xl">Turn Any Space Into an Interactive 3D World.</h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[var(--muted)]">
            Upload a floor plan, DWG, DXF, photograph, or design reference and reconstruct it as an immersive 3D environment. CAD files become real walls and rooms — not a drawing on a plane.
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
          <dl className="mt-16 grid max-w-lg grid-cols-3 gap-4 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
            <div>
              <dt>Geometry</dt>
              <dd className="mt-1 text-[var(--fg)] normal-case tracking-normal">Real walls, doors, stairs</dd>
            </div>
            <div>
              <dt>Walkthrough</dt>
              <dd className="mt-1 text-[var(--fg)] normal-case tracking-normal">First-person collision</dd>
            </div>
            <div>
              <dt>Authority</dt>
              <dd className="mt-1 text-[var(--fg)] normal-case tracking-normal">Reference-first reconstruction</dd>
            </div>
          </dl>
        </div>
      </section>
    </div>
  );
}
