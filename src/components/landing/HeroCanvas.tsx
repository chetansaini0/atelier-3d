"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { createDemoVillaScene } from "@/data/demoVilla";
import { SceneBuilder } from "@/scene/SceneBuilder";

const scene = createDemoVillaScene();

export function HeroCanvas() {
  return (
    <Canvas shadows camera={{ position: [-8, 5.5, -9], fov: 38 }} gl={{ antialias: true }}>
      <color attach="background" args={["#0c0d0b"]} />
      <SceneBuilder scene={scene} onSelect={() => undefined} />
      <OrbitControls
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.45}
        target={[6, 1.2, 5]}
        minDistance={10}
        maxDistance={22}
        maxPolarAngle={Math.PI / 2.2}
      />
    </Canvas>
  );
}
