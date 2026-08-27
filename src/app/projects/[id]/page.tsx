"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ViewerShell } from "@/components/viewer/ViewerShell";
import { useProjectStore } from "@/store/projectStore";
import type { SceneDocument } from "@/types/scene";

export default function ProjectViewerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const getProject = useProjectStore((s) => s.getProject);
  const updateScene = useProjectStore((s) => s.updateScene);
  const hydrateDemo = useProjectStore((s) => s.hydrateDemo);
  const [scene, setScene] = useState<SceneDocument | null>(null);

  useEffect(() => {
    const existing = getProject(params.id);
    if (existing) {
      setScene(existing.scene);
      return;
    }
    if (params.id === "demo-villa") {
      hydrateDemo();
      const demo = getProject("demo-villa");
      if (demo) setScene(demo.scene);
      return;
    }
    router.replace("/projects");
  }, [params.id, getProject, hydrateDemo, router]);

  if (!scene) return <div className="grid h-screen place-items-center text-sm text-[var(--muted)]">Loading environment…</div>;

  return (
    <ViewerShell
      projectId={params.id}
      scene={scene}
      onSceneChange={(next) => {
        setScene(next);
        updateScene(params.id, next);
      }}
    />
  );
}
