"use client";

import { useMemo } from "react";
import type { FurnitureType, SceneObject } from "@/types/scene";

function Box({
  args,
  position,
  color,
  roughness = 0.6,
  metalness = 0,
  transparent,
  opacity,
}: {
  args: [number, number, number];
  position?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
  transparent?: boolean;
  opacity?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshPhysicalMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent={transparent}
        opacity={opacity}
      />
    </mesh>
  );
}

function Cyl({
  args,
  position,
  color,
  roughness = 0.5,
  metalness = 0,
}: {
  args: [number, number, number, number?];
  position?: [number, number, number];
  color: string;
  roughness?: number;
  metalness?: number;
}) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <cylinderGeometry args={args} />
      <meshPhysicalMaterial color={color} roughness={roughness} metalness={metalness} />
    </mesh>
  );
}

export function FurnitureMesh({ object }: { object: SceneObject }) {
  const { dimensions: d, color, type } = object;
  const c = color ?? defaultColor(type);

  const content = useMemo(() => renderFurniture(type, d, c), [type, d, c]);
  return <group>{content}</group>;
}

function defaultColor(type: FurnitureType): string {
  const map: Partial<Record<FurnitureType, string>> = {
    sofa: "#c9b9a4",
    armchair: "#8b5a3c",
    bed: "#d5c6b0",
    fridge: "#e8ecef",
    toilet: "#f7f7f4",
    plant: "#3f6b38",
    tree: "#3f6b38",
    tv: "#161616",
  };
  return map[type] ?? "#8a6a4a";
}

function renderFurniture(
  type: FurnitureType,
  d: { width: number; depth: number; height: number },
  c: string,
) {
  switch (type) {
    case "sofa":
      return (
        <>
          <Box args={[d.width, d.height * 0.38, d.depth]} position={[0, d.height * 0.19, 0]} color={c} roughness={0.9} />
          <Box args={[d.width, d.height * 0.48, d.depth * 0.22]} position={[0, d.height * 0.62, -d.depth * 0.36]} color={c} roughness={0.9} />
          <Box args={[d.width * 0.12, d.height * 0.42, d.depth]} position={[-d.width * 0.44, d.height * 0.48, 0]} color={c} roughness={0.88} />
          <Box args={[d.width * 0.12, d.height * 0.42, d.depth]} position={[d.width * 0.44, d.height * 0.48, 0]} color={c} roughness={0.88} />
          <Box args={[d.width * 0.28, 0.12, d.depth * 0.5]} position={[-d.width * 0.22, d.height * 0.42, 0.05]} color="#d7cbb8" roughness={0.95} />
          <Box args={[d.width * 0.28, 0.12, d.depth * 0.5]} position={[d.width * 0.22, d.height * 0.42, 0.05]} color="#d7cbb8" roughness={0.95} />
        </>
      );
    case "armchair":
      return (
        <>
          <Box args={[d.width, d.height * 0.36, d.depth]} position={[0, d.height * 0.18, 0]} color={c} roughness={0.7} />
          <Box args={[d.width, d.height * 0.5, d.depth * 0.2]} position={[0, d.height * 0.6, -d.depth * 0.38]} color={c} roughness={0.7} />
          <Box args={[0.1, d.height * 0.4, d.depth * 0.9]} position={[-d.width * 0.42, d.height * 0.45, 0]} color={c} />
          <Box args={[0.1, d.height * 0.4, d.depth * 0.9]} position={[d.width * 0.42, d.height * 0.45, 0]} color={c} />
        </>
      );
    case "coffee-table":
      return (
        <>
          <Box args={[d.width, 0.05, d.depth]} position={[0, d.height, 0]} color={c} roughness={0.3} />
          <Cyl args={[0.04, 0.04, d.height, 8]} position={[-d.width * 0.4, d.height / 2, -d.depth * 0.35]} color="#3a2a1c" />
          <Cyl args={[0.04, 0.04, d.height, 8]} position={[d.width * 0.4, d.height / 2, -d.depth * 0.35]} color="#3a2a1c" />
          <Cyl args={[0.04, 0.04, d.height, 8]} position={[-d.width * 0.4, d.height / 2, d.depth * 0.35]} color="#3a2a1c" />
          <Cyl args={[0.04, 0.04, d.height, 8]} position={[d.width * 0.4, d.height / 2, d.depth * 0.35]} color="#3a2a1c" />
        </>
      );
    case "dining-table":
      return (
        <>
          <Box args={[d.width, 0.06, d.depth]} position={[0, d.height, 0]} color={c} roughness={0.35} />
          <Box args={[d.width * 0.12, d.height, d.depth * 0.12]} position={[-d.width * 0.38, d.height / 2, -d.depth * 0.35]} color="#4a3220" />
          <Box args={[d.width * 0.12, d.height, d.depth * 0.12]} position={[d.width * 0.38, d.height / 2, -d.depth * 0.35]} color="#4a3220" />
          <Box args={[d.width * 0.12, d.height, d.depth * 0.12]} position={[-d.width * 0.38, d.height / 2, d.depth * 0.35]} color="#4a3220" />
          <Box args={[d.width * 0.12, d.height, d.depth * 0.12]} position={[d.width * 0.38, d.height / 2, d.depth * 0.35]} color="#4a3220" />
        </>
      );
    case "dining-chair":
      return (
        <>
          <Box args={[d.width, 0.05, d.depth * 0.7]} position={[0, 0.45, 0]} color={c} />
          <Box args={[d.width, d.height - 0.45, 0.06]} position={[0, 0.45 + (d.height - 0.45) / 2, -d.depth * 0.28]} color={c} />
          <Cyl args={[0.025, 0.025, 0.45, 8]} position={[-d.width * 0.35, 0.225, -d.depth * 0.25]} color="#2c2118" />
          <Cyl args={[0.025, 0.025, 0.45, 8]} position={[d.width * 0.35, 0.225, -d.depth * 0.25]} color="#2c2118" />
          <Cyl args={[0.025, 0.025, 0.45, 8]} position={[-d.width * 0.35, 0.225, d.depth * 0.25]} color="#2c2118" />
          <Cyl args={[0.025, 0.025, 0.45, 8]} position={[d.width * 0.35, 0.225, d.depth * 0.25]} color="#2c2118" />
        </>
      );
    case "bed":
      return (
        <>
          <Box args={[d.width + 0.08, 0.22, d.depth + 0.08]} position={[0, 0.22, 0]} color="#6a4a32" roughness={0.45} />
          <Box args={[d.width, 0.28, d.depth]} position={[0, 0.48, 0]} color={c} roughness={0.92} />
          <Box args={[d.width + 0.08, d.height * 0.55, 0.08]} position={[0, d.height * 0.5, -d.depth / 2]} color="#5c3a24" />
          <Box args={[d.width * 0.32, 0.14, 0.28]} position={[-d.width * 0.22, 0.7, -d.depth * 0.32]} color="#f3ece3" roughness={0.95} />
          <Box args={[d.width * 0.32, 0.14, 0.28]} position={[d.width * 0.22, 0.7, -d.depth * 0.32]} color="#f3ece3" roughness={0.95} />
        </>
      );
    case "nightstand":
    case "console":
    case "dresser":
      return (
        <>
          <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color={c} roughness={0.4} />
          <Box args={[d.width * 0.86, 0.04, 0.02]} position={[0, d.height * 0.55, d.depth / 2 + 0.01]} color="#c4a574" metalness={0.8} roughness={0.3} />
        </>
      );
    case "wardrobe":
      return (
        <>
          <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color={c} roughness={0.42} />
          <Box args={[0.01, d.height * 0.9, 0.01]} position={[0, d.height / 2, d.depth / 2 + 0.01]} color="#1a1a1a" />
          <Cyl args={[0.015, 0.015, 0.12, 8]} position={[-d.width * 0.08, d.height * 0.5, d.depth / 2 + 0.04]} color="#c4a574" metalness={1} roughness={0.25} />
          <Cyl args={[0.015, 0.015, 0.12, 8]} position={[d.width * 0.08, d.height * 0.5, d.depth / 2 + 0.04]} color="#c4a574" metalness={1} roughness={0.25} />
        </>
      );
    case "tv-unit":
      return <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color={c} roughness={0.4} />;
    case "tv":
      return (
        <>
          <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color="#111" roughness={0.3} />
          <Box args={[d.width * 0.92, d.height * 0.82, 0.01]} position={[0, d.height / 2, d.depth / 2 + 0.005]} color="#1c242c" roughness={0.2} metalness={0.4} />
        </>
      );
    case "rug":
      return (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
          <planeGeometry args={[d.width, d.depth]} />
          <meshPhysicalMaterial color={c} roughness={0.95} />
        </mesh>
      );
    case "plant":
      return (
        <>
          <Cyl args={[d.width * 0.22, d.width * 0.18, 0.28, 12]} position={[0, 0.14, 0]} color="#6d5a4a" />
          <Cyl args={[0.03, 0.04, d.height * 0.45, 6]} position={[0, 0.45, 0]} color="#4a6b38" />
          <mesh position={[0, d.height * 0.62, 0]} castShadow>
            <sphereGeometry args={[d.width * 0.32, 10, 8]} />
            <meshPhysicalMaterial color="#3f6b38" roughness={0.9} />
          </mesh>
          <mesh position={[d.width * 0.12, d.height * 0.75, 0.05]} castShadow>
            <sphereGeometry args={[d.width * 0.2, 8, 6]} />
            <meshPhysicalMaterial color="#4f7d42" roughness={0.9} />
          </mesh>
        </>
      );
    case "floor-lamp":
      return (
        <>
          <Cyl args={[0.12, 0.12, 0.04, 16]} position={[0, 0.02, 0]} color="#2a2a28" metalness={0.7} roughness={0.3} />
          <Cyl args={[0.02, 0.02, d.height * 0.85, 8]} position={[0, d.height * 0.42, 0]} color="#c4a574" metalness={0.9} roughness={0.3} />
          <mesh position={[0, d.height * 0.88, 0]}>
            <coneGeometry args={[0.18, 0.22, 16, 1, true]} />
            <meshPhysicalMaterial color="#f0e6d4" roughness={0.7} side={2} />
          </mesh>
        </>
      );
    case "table-lamp":
      return (
        <>
          <Cyl args={[0.08, 0.1, 0.04, 12]} position={[0, 0.02, 0]} color="#c4a574" metalness={0.8} roughness={0.3} />
          <Cyl args={[0.015, 0.015, 0.28, 8]} position={[0, 0.18, 0]} color="#c4a574" metalness={0.8} roughness={0.3} />
          <mesh position={[0, 0.38, 0]}>
            <coneGeometry args={[0.12, 0.16, 12, 1, true]} />
            <meshPhysicalMaterial color="#f4eadc" roughness={0.75} side={2} />
          </mesh>
        </>
      );
    case "kitchen-counter":
    case "kitchen-island":
      return (
        <>
          <Box args={[d.width, d.height - 0.06, d.depth]} position={[0, (d.height - 0.06) / 2, 0]} color="#efe8dc" roughness={0.55} />
          <Box args={[d.width + 0.04, 0.06, d.depth + 0.04]} position={[0, d.height - 0.03, 0]} color="#d8d2c6" roughness={0.25} />
        </>
      );
    case "kitchen-cabinet":
      return <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color={c} roughness={0.5} />;
    case "fridge":
      return (
        <>
          <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color={c} metalness={0.35} roughness={0.25} />
          <Box args={[0.02, 0.28, 0.04]} position={[d.width * 0.38, d.height * 0.62, d.depth / 2 + 0.02]} color="#9aa3ab" metalness={1} roughness={0.2} />
        </>
      );
    case "stove":
      return (
        <>
          <Box args={[d.width, 0.05, d.depth]} position={[0, 0.03, 0]} color="#2a2c30" metalness={0.5} roughness={0.3} />
          <Cyl args={[0.08, 0.08, 0.02, 16]} position={[-d.width * 0.22, 0.06, -d.depth * 0.18]} color="#111" />
          <Cyl args={[0.08, 0.08, 0.02, 16]} position={[d.width * 0.22, 0.06, -d.depth * 0.18]} color="#111" />
          <Cyl args={[0.08, 0.08, 0.02, 16]} position={[-d.width * 0.22, 0.06, d.depth * 0.18]} color="#111" />
          <Cyl args={[0.08, 0.08, 0.02, 16]} position={[d.width * 0.22, 0.06, d.depth * 0.18]} color="#111" />
        </>
      );
    case "oven":
      return (
        <>
          <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color="#2c2e32" metalness={0.4} roughness={0.3} />
          <Box args={[d.width * 0.7, d.height * 0.35, 0.02]} position={[0, d.height * 0.45, d.depth / 2 + 0.01]} color="#111" />
        </>
      );
    case "sink":
      return (
        <>
          <Box args={[d.width, 0.06, d.depth]} position={[0, 0, 0]} color="#d0d5da" metalness={0.4} roughness={0.25} />
          <Box args={[d.width * 0.7, 0.1, d.depth * 0.6]} position={[0, -0.04, 0]} color="#b8c0c8" metalness={0.5} roughness={0.2} />
          <Cyl args={[0.015, 0.015, 0.22, 8]} position={[0, 0.16, -d.depth * 0.2]} color="#c4a574" metalness={1} roughness={0.2} />
        </>
      );
    case "microwave":
      return <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color="#d9dde2" metalness={0.3} roughness={0.3} />;
    case "toilet":
      return (
        <>
          <Box args={[d.width, 0.42, d.depth * 0.55]} position={[0, 0.21, d.depth * 0.1]} color="#f7f7f4" roughness={0.2} />
          <Cyl args={[d.width * 0.42, d.width * 0.36, 0.18, 16]} position={[0, 0.42, d.depth * 0.08]} color="#f7f7f4" roughness={0.18} />
          <Box args={[d.width * 0.9, 0.42, 0.18]} position={[0, 0.72, -d.depth * 0.32]} color="#f7f7f4" roughness={0.2} />
        </>
      );
    case "basin":
      return (
        <>
          <Box args={[d.width, 0.12, d.depth]} position={[0, 0.78, 0]} color="#f4f1ea" roughness={0.2} />
          <Box args={[d.width * 0.7, 0.08, d.depth * 0.55]} position={[0, 0.72, 0]} color="#e7e4dc" roughness={0.18} />
          <Box args={[0.08, 0.78, 0.08]} position={[-d.width * 0.35, 0.39, 0]} color="#d8d2c6" />
          <Box args={[0.08, 0.78, 0.08]} position={[d.width * 0.35, 0.39, 0]} color="#d8d2c6" />
          <Cyl args={[0.012, 0.012, 0.18, 8]} position={[0, 0.95, -d.depth * 0.15]} color="#c4a574" metalness={1} roughness={0.2} />
        </>
      );
    case "bathtub":
      return (
        <>
          <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color="#f4f1ea" roughness={0.22} />
          <Box args={[d.width * 0.82, 0.08, d.depth * 0.7]} position={[0, d.height * 0.72, 0]} color="#d5e4ee" roughness={0.1} transparent opacity={0.35} />
        </>
      );
    case "shower":
      return (
        <>
          <Box args={[d.width, 0.04, d.depth]} position={[0, 0.02, 0]} color="#cfc8bc" roughness={0.3} />
          <Box args={[0.03, d.height, d.depth]} position={[-d.width / 2, d.height / 2, 0]} color="#d7e7f2" roughness={0.05} transparent opacity={0.22} />
          <Box args={[0.03, d.height, d.depth]} position={[d.width / 2, d.height / 2, 0]} color="#d7e7f2" roughness={0.05} transparent opacity={0.22} />
          <Box args={[d.width, d.height, 0.03]} position={[0, d.height / 2, -d.depth / 2]} color="#d7e7f2" roughness={0.05} transparent opacity={0.22} />
          <Cyl args={[0.08, 0.08, 0.04, 16]} position={[0, d.height - 0.15, 0]} color="#c4a574" metalness={1} roughness={0.2} />
        </>
      );
    case "mirror":
      return (
        <>
          <Box args={[d.width, d.height, d.depth]} position={[0, 0, 0]} color="#c4a574" metalness={0.7} roughness={0.3} />
          <Box args={[d.width * 0.9, d.height * 0.88, 0.01]} position={[0, 0, d.depth / 2]} color="#c5d5e0" metalness={0.9} roughness={0.05} />
        </>
      );
    case "towel-rail":
      return <Cyl args={[0.015, 0.015, d.width, 8]} position={[0, 0, 0]} color="#c4a574" metalness={1} roughness={0.2} />;
    case "curtain":
      return (
        <>
          <Box args={[d.width, 0.05, 0.05]} position={[0, d.height, 0]} color="#4a3a2a" />
          <Box args={[d.width * 0.48, d.height, 0.06]} position={[-d.width * 0.25, d.height / 2, 0]} color={c} roughness={0.95} />
          <Box args={[d.width * 0.48, d.height, 0.06]} position={[d.width * 0.25, d.height / 2, 0]} color={c} roughness={0.95} />
        </>
      );
    case "railing":
      return (
        <>
          <Box args={[d.width, 0.04, d.depth]} position={[0, d.height, 0]} color="#c4a574" metalness={0.8} roughness={0.3} />
          {Array.from({ length: Math.max(4, Math.round(d.width / 0.18)) }).map((_, i, arr) => (
            <Cyl
              key={i}
              args={[0.012, 0.012, d.height, 6]}
              position={[ -d.width / 2 + (i * d.width) / (arr.length - 1), d.height / 2, 0]}
              color="#c4a574"
              metalness={0.8}
              roughness={0.3}
            />
          ))}
        </>
      );
    case "bench":
      return (
        <>
          <Box args={[d.width, 0.06, d.depth]} position={[0, d.height, 0]} color={c} />
          <Box args={[0.08, d.height, d.depth]} position={[-d.width * 0.4, d.height / 2, 0]} color="#4a3728" />
          <Box args={[0.08, d.height, d.depth]} position={[d.width * 0.4, d.height / 2, 0]} color="#4a3728" />
        </>
      );
    case "column":
      return <Cyl args={[d.width / 2, d.width / 2, d.height, 16]} position={[0, d.height / 2, 0]} color="#d8d2c6" />;
    case "shelf":
      return <Box args={[d.width, 0.04, d.depth]} position={[0, d.height / 2, 0]} color={c} />;
    default:
      return <Box args={[d.width, d.height, d.depth]} position={[0, d.height / 2, 0]} color={c} roughness={0.6} />;
  }
}
