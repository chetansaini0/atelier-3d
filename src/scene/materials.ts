"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { MaterialDef } from "@/types/scene";

export function createPhysicalMaterial(def: MaterialDef, overrides?: { color?: string }): THREE.MeshPhysicalMaterial {
  const color = new THREE.Color(overrides?.color ?? def.color);
  const isGlass = def.type === "glass" || (def.transmission ?? 0) > 0;
  const isWater = def.type === "water";

  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: def.roughness,
    metalness: def.metalness,
    opacity: def.opacity ?? 1,
    transparent: (def.opacity ?? 1) < 0.99 || isGlass || isWater,
    transmission: def.transmission ?? (isGlass ? 0.85 : 0),
    ior: isGlass || isWater ? 1.45 : 1.5,
    thickness: isGlass ? 0.04 : 0,
    envMapIntensity: 1.1,
    sheen: def.type === "fabric" ? 0.4 : 0,
    sheenColor: def.type === "fabric" ? color : new THREE.Color("#000000"),
    clearcoat: def.type === "marble" || def.type === "ceramic" ? 0.35 : 0,
    clearcoatRoughness: 0.2,
  });
}

export function useMaterialMap(defs: MaterialDef[]): Map<string, THREE.MeshPhysicalMaterial> {
  return useMemo(() => {
    const map = new Map<string, THREE.MeshPhysicalMaterial>();
    for (const def of defs) {
      map.set(def.id, createPhysicalMaterial(def));
    }
    return map;
  }, [defs]);
}

export function materialProps(def: MaterialDef | undefined, fallbackColor = "#cfc8bc") {
  const color = def?.color ?? fallbackColor;
  const type = def?.type ?? "paint";
  const isGlass = type === "glass" || (def?.transmission ?? 0) > 0;
  const isWater = type === "water";
  return {
    color,
    roughness: def?.roughness ?? 0.7,
    metalness: def?.metalness ?? 0,
    opacity: def?.opacity ?? 1,
    transparent: (def?.opacity ?? 1) < 0.99 || isGlass || isWater,
    transmission: def?.transmission ?? (isGlass ? 0.85 : 0),
    ior: isGlass || isWater ? 1.45 : 1.5,
    thickness: isGlass ? 0.04 : 0,
    envMapIntensity: 1.1,
    sheen: type === "fabric" ? 0.4 : 0,
    sheenColor: type === "fabric" ? color : "#000000",
    clearcoat: type === "marble" || type === "ceramic" ? 0.35 : 0,
    clearcoatRoughness: 0.2,
  };
}
