"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useProjectStore } from "@/store/projectStore";

export default function DemoRedirectPage() {
  const router = useRouter();
  const hydrateDemo = useProjectStore((s) => s.hydrateDemo);

  useEffect(() => {
    const id = hydrateDemo();
    router.replace(`/projects/${id}`);
  }, [hydrateDemo, router]);

  return <div className="grid h-screen place-items-center text-sm text-[var(--muted)]">Opening demonstration villa…</div>;
}
