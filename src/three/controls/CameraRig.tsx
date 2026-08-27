"use client";

import { useEffect } from "react";
import { OrbitControls, OrthographicCamera } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { SceneDocument } from "@/types/scene";
import { useViewerStore } from "@/store/viewerStore";
import { FirstPersonController } from "@/three/controls/FirstPersonController";

export function CameraRig({ scene }: { scene: SceneDocument }) {
  const mode = useViewerStore((s) => s.cameraMode);
  const { camera } = useThree();

  useEffect(() => {
    if (mode === "orbit") {
      camera.position.set(-8, 6, -9);
      camera.lookAt(6, 1.2, 5);
    }
    if (mode === "top") {
      camera.position.set(6.3, 22, 5.7);
      camera.lookAt(6.3, 0, 5.7);
    }
    if (mode === "presentation") {
      camera.position.set(-3.2, 2.2, -4);
      camera.lookAt(4, 1.2, 4.5);
    }
    if (mode === "first-person") {
      camera.position.set(scene.spawn.x, scene.spawn.y, scene.spawn.z);
    }
    camera.updateProjectionMatrix();
  }, [mode, camera, scene.spawn]);

  return (
    <>
      {mode === "top" ? (
        <OrthographicCamera makeDefault position={[6.3, 22, 5.7]} zoom={28} near={0.1} far={80} />
      ) : null}
      {mode === "first-person" ? <FirstPersonController scene={scene} /> : null}
      {mode === "orbit" || mode === "presentation" || mode === "top" ? (
        <OrbitControls
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={mode === "top" ? 0.15 : Math.PI / 2.05}
          minDistance={2}
          maxDistance={40}
          target={[6, 1.2, 5]}
        />
      ) : null}
    </>
  );
}
