"use client";

import type { LightingMode, SceneDocument } from "@/types/scene";

export function LightingRig({ scene, mode }: { scene: SceneDocument; mode: LightingMode }) {
  const sun = mode === "day" ? 1.6 : mode === "sunset" ? 1.05 : 0.12;
  const ambient = mode === "night" ? 0.12 : mode === "sunset" ? 0.28 : 0.45;
  const sunColor = mode === "sunset" ? "#ffb070" : mode === "night" ? "#8aa0c8" : "#fff6e8";
  const sunPos: [number, number, number] =
    mode === "sunset" ? [12, 8, -18] : mode === "night" ? [-8, 16, 6] : [18, 22, 10];
  const bg = mode === "night" ? "#0b1020" : mode === "sunset" ? "#c4845a" : "#87a8c8";

  return (
    <>
      <color attach="background" args={[bg]} />
      <ambientLight intensity={ambient} color={mode === "night" ? "#9bb0d0" : "#fff8ee"} />
      <hemisphereLight
        args={[mode === "night" ? "#1b2433" : "#e8f0ff", mode === "night" ? "#0d0c0a" : "#8a7a62", mode === "night" ? 0.2 : 0.55]}
      />
      <directionalLight
        castShadow
        position={sunPos}
        intensity={sun}
        color={sunColor}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={0.5}
        shadow-camera-far={80}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
      />
      {scene.levels.flatMap((level) =>
        level.rooms.flatMap((room) =>
          room.lights.map((light) => {
            const nightBoost = mode === "night" ? 1 : mode === "sunset" ? 0.45 : 0.25;
            return (
              <pointLight
                key={light.id}
                position={[light.position.x, light.position.y, light.position.z]}
                color={light.color}
                intensity={light.intensity * nightBoost}
                distance={light.distance}
              />
            );
          }),
        ),
      )}
    </>
  );
}
