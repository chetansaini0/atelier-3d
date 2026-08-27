"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useProjectStore } from "@/store/projectStore";
import { Button } from "@/components/ui/Button";

export default function ProjectsPage() {
  const projects = useProjectStore((s) => s.projects);
  const hydrateDemo = useProjectStore((s) => s.hydrateDemo);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (!useProjectStore.getState().projects.find((p) => p.id === "demo-villa")) {
      hydrateDemo();
    }
  }, [hydrateDemo]);

  if (!ready) return <div className="min-h-screen bg-[var(--bg)]" />;

  return (
    <div className="min-h-screen px-8 py-12">
      <header className="mb-12 flex items-end justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">Library</p>
          <h1 className="font-serif text-5xl">My Projects</h1>
        </div>
        <Link href="/projects/new">
          <Button>+ New Project</Button>
        </Link>
      </header>
      <h2 className="mb-4 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Recent projects</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {projects.map((project) => (
          <article key={project.id} className="glass overflow-hidden rounded-3xl">
            <div className="flex h-36 items-end bg-[linear-gradient(160deg,#1c1d18,var(--brass-dim))] p-4">
              <p className="font-serif text-2xl">{project.name}</p>
            </div>
            <div className="flex items-center justify-between p-4 text-sm">
              <Link href={`/projects/${project.id}`} className="text-[var(--brass)]">
                Open
              </Link>
              {project.id !== "demo-villa" ? (
                <button className="text-[var(--muted)]" onClick={() => deleteProject(project.id)}>
                  Delete
                </button>
              ) : (
                <span className="text-xs text-[var(--muted)]">Demo</span>
              )}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
