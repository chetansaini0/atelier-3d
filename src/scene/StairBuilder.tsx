"use client";

import type { Stair } from "@/types/scene";

export function StairBuilder({ stair }: { stair: Stair }) {
  const stepRun = stair.run / stair.steps;
  const stepRise = stair.rise / stair.steps;

  return (
    <group position={[stair.origin.x, stair.origin.y, stair.origin.z]} rotation={[0, stair.rotation, 0]}>
      {Array.from({ length: stair.steps }).map((_, i) => {
        const y = stepRise * i + stepRise / 2;
        const z = stepRun * i + stepRun / 2;
        return (
          <mesh key={i} position={[stair.width / 2, y, z]} castShadow receiveShadow>
            <boxGeometry args={[stair.width, stepRise, stepRun]} />
            <meshPhysicalMaterial color="#d8d2c6" roughness={0.55} />
          </mesh>
        );
      })}
      <mesh position={[-0.03, stair.rise / 2, stair.run / 2]} castShadow>
        <boxGeometry args={[0.05, stair.rise, stair.run]} />
        <meshPhysicalMaterial color="#6b4426" roughness={0.45} />
      </mesh>
      <mesh position={[stair.width + 0.03, stair.rise / 2, stair.run / 2]} castShadow>
        <boxGeometry args={[0.05, stair.rise, stair.run]} />
        <meshPhysicalMaterial color="#6b4426" roughness={0.45} />
      </mesh>
    </group>
  );
}
