"use client";

import { Canvas, type ThreeEvent } from "@react-three/fiber";
import { useRef } from "react";
import type * as THREE from "three";
import type { SceneDocument } from "@/types/scene";
import { SceneBuilder } from "@/scene/SceneBuilder";
import { CameraRig } from "@/three/controls/CameraRig";
import { CinematicEffects } from "@/three/post/CinematicEffects";
import { useViewerStore } from "@/store/viewerStore";
import { Line } from "@react-three/drei";

export function WorldCanvas({ scene, onBindRenderer }: { scene: SceneDocument; onBindRenderer?: (r: THREE.WebGLRenderer, root: THREE.Object3D) => void }) {
  return (
    <Canvas
      shadows
      className="h-full w-full"
      camera={{ position: [-8, 6, -9], fov: 50, near: 0.08, far: 120 }}
      gl={{ antialias: true, preserveDrawingBuffer: true, alpha: false }}
      onCreated={({ gl, scene: threeScene }) => {
        gl.setClearColor("#8fb4d4", 1);
        onBindRenderer?.(gl, threeScene);
      }}
    >
      <color attach="background" args={["#87a8c8"]} />
      <ambientLight intensity={0.7} />
      <directionalLight position={[-8, 12, -6]} intensity={1.4} />
      <CameraRig scene={scene} />
      <World scene={scene} />
      <CinematicEffects />
    </Canvas>
  );
}

function World({ scene }: { scene: SceneDocument }) {
  const root = useRef<THREE.Group>(null);
  const tool = useViewerStore((s) => s.editorTool);
  const measurePoints = useViewerStore((s) => s.measurePoints);

  const onSelect = (id: string, kind: "wall" | "door" | "window" | "room" | "object" | "light", event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    const store = useViewerStore.getState();
    if (store.editorTool === "measure") {
      store.addMeasurePoint({ x: event.point.x, y: event.point.y, z: event.point.z });
      return;
    }
    if (kind === "door") store.toggleDoor(id);
    store.select(id, kind);
  };

  return (
    <group ref={root}>
      <SceneBuilder scene={scene} onSelect={onSelect} />
      {measurePoints.length === 2 ? (
        <Line
          points={[
            [measurePoints[0].x, measurePoints[0].y + 0.05, measurePoints[0].z],
            [measurePoints[1].x, measurePoints[1].y + 0.05, measurePoints[1].z],
          ]}
          color="#c4a574"
          lineWidth={2}
        />
      ) : null}
      {tool === "measure" ? <mesh visible={false} /> : null}
    </group>
  );
}
