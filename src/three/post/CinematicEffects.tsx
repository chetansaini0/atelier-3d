"use client";

import { EffectComposer, Bloom, SMAA, Vignette, DepthOfField } from "@react-three/postprocessing";
import { useViewerStore } from "@/store/viewerStore";

export function CinematicEffects() {
  const cinematic = useViewerStore((s) => s.cinematic);
  const reduced = useViewerStore((s) => s.reducedMotion);
  if (reduced || !cinematic) return null;

  return (
    <EffectComposer enableNormalPass={false} multisampling={0}>
      <SMAA />
      <Bloom intensity={0.35} luminanceThreshold={0.85} mipmapBlur />
      <DepthOfField focusDistance={0.02} focalLength={0.04} bokehScale={1.6} />
      <Vignette offset={0.3} darkness={0.45} />
    </EffectComposer>
  );
}
