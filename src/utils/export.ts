"use client";

import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { downloadJson, downloadText, sceneToSvg } from "@/utils/files";
import type { SceneDocument } from "@/types/scene";

export async function exportScreenshot(renderer: THREE.WebGLRenderer, filename = "environment.png") {
  renderer.domElement.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, "image/png");
}

export function exportSceneJson(scene: SceneDocument, filename = "scene.json") {
  downloadJson(filename, scene);
}

export function exportFloorPlanSvg(scene: SceneDocument, levelId?: string) {
  downloadText(`${scene.project.name}-floorplan.svg`, sceneToSvg(scene, levelId), "image/svg+xml");
}

export function exportFloorPlanPng(scene: SceneDocument, levelId?: string) {
  const svg = sceneToSvg(scene, levelId);
  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#f6f1e8";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((png) => {
      if (!png) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(png);
      a.download = `${scene.project.name}-floorplan.png`;
      a.click();
    }, "image/png");
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

export function exportGlb(root: THREE.Object3D, filename = "environment.glb") {
  const exporter = new GLTFExporter();
  exporter.parse(
    root,
    (result) => {
      const blob =
        result instanceof ArrayBuffer
          ? new Blob([result], { type: "model/gltf-binary" })
          : new Blob([JSON.stringify(result)], { type: "model/gltf+json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = result instanceof ArrayBuffer ? filename : filename.replace(/glb$/, "gltf");
      a.click();
    },
    (error) => {
      console.error("GLB export failed", error);
    },
    { binary: true },
  );
}
