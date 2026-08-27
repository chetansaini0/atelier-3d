"use client";

import { useMemo } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import type { Opening, Wall } from "@/types/scene";
import { wallDirection, wallLength, wallNormal, wallPointAt, wallSegments } from "@/scene/geometry";
import { materialProps } from "@/scene/materials";
import type { MaterialDef } from "@/types/scene";

interface Props {
  wall: Wall;
  elevation?: number;
  materials: MaterialDef[];
  openDoorIds: Set<string>;
  onSelect: (id: string, kind: "wall" | "door" | "window", event: ThreeEvent<MouseEvent>) => void;
}

export function WallBuilder({ wall, elevation = 0, materials, openDoorIds, onSelect }: Props) {
  const length = wallLength(wall);
  const dir = wallDirection(wall);
  const normal = wallNormal(wall);
  const mid = wallPointAt(wall, length / 2);
  const angle = Math.atan2(dir.x, dir.z);
  const mat = materials.find((m) => m.id === wall.materialId);
  const props = materialProps(mat);
  const segments = useMemo(() => wallSegments(wall), [wall]);

  return (
    <group
      position={[mid.x, elevation + wall.height / 2, mid.z]}
      rotation={[0, angle, 0]}
      onClick={(e) => onSelect(wall.id, "wall", e)}
    >
      {segments.map((segment, i) => {
        const segLen = Math.max(0.02, segment.end - segment.start);
        const localZ = segment.start + segLen / 2 - length / 2;

        if (segment.kind === "solid") {
          return (
            <mesh
              key={`${wall.id}-s-${i}`}
              position={[0, 0, localZ]}
              castShadow
              receiveShadow
              userData={{ id: wall.id, kind: "wall" }}
            >
              <boxGeometry args={[wall.thickness, wall.height, segLen]} />
              <meshPhysicalMaterial {...props} />
            </mesh>
          );
        }

        const below = segment.sillHeight;
        const above = wall.height - (segment.sillHeight + segment.openingHeight);
        const pieces = [];

        if (below > 0.02) {
          pieces.push(
            <mesh
              key={`${wall.id}-below-${i}`}
              position={[0, -wall.height / 2 + below / 2, localZ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[wall.thickness, below, segLen]} />
              <meshPhysicalMaterial {...props} />
            </mesh>,
          );
        }
        if (above > 0.02) {
          pieces.push(
            <mesh
              key={`${wall.id}-above-${i}`}
              position={[0, wall.height / 2 - above / 2, localZ]}
              castShadow
              receiveShadow
            >
              <boxGeometry args={[wall.thickness, above, segLen]} />
              <meshPhysicalMaterial {...props} />
            </mesh>,
          );
        }

        const opening = wall.openings[segment.openingIndex ?? 0];
        if (opening) {
          pieces.push(
            <OpeningMesh
              key={opening.id}
              opening={opening}
              wall={wall}
              localZ={localZ}
              open={Boolean(opening.open) || openDoorIds.has(opening.id)}
              nx={normal.x}
              nz={normal.z}
              onSelect={onSelect}
            />,
          );
        }

        return pieces;
      })}
    </group>
  );
}

function OpeningMesh({
  opening,
  wall,
  localZ,
  open,
  onSelect,
}: {
  opening: Opening;
  wall: Wall;
  localZ: number;
  open: boolean;
  nx: number;
  nz: number;
  onSelect: Props["onSelect"];
}) {
  const y = -wall.height / 2 + opening.sillHeight + opening.height / 2;

  if (opening.type === "window") {
    return (
      <group position={[0, y, localZ]} onClick={(e) => onSelect(opening.id, "window", e)}>
        <mesh userData={{ id: opening.id, kind: "window" }}>
          <boxGeometry args={[0.06, opening.height, opening.width]} />
          <meshPhysicalMaterial color="#5c4030" roughness={0.45} />
        </mesh>
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[0.03, opening.height - 0.08, opening.width - 0.08]} />
          <meshPhysicalMaterial
            color="#cfe8f2"
            roughness={0.05}
            metalness={0.05}
            transparent
            opacity={0.28}
            transmission={0.7}
          />
        </mesh>
        <mesh position={[0, -opening.height / 2 - 0.04, 0]}>
          <boxGeometry args={[0.18, 0.06, opening.width + 0.08]} />
          <meshPhysicalMaterial color="#d8d2c6" roughness={0.5} />
        </mesh>
      </group>
    );
  }

  if (opening.type === "archway") {
    return null;
  }

  const swing = opening.hinge === "right" ? -1 : 1;
  const openAngle = open ? (opening.style === "sliding" ? 0 : swing * 1.45) : 0;
  const slide = opening.style === "sliding" && open ? opening.width * 0.85 : 0;

  return (
    <group
      position={[0, y, localZ]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(opening.id, "door", e);
      }}
    >
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[wall.thickness + 0.04, opening.height, opening.width]} />
        <meshPhysicalMaterial color="#5c4030" roughness={0.5} transparent opacity={0} />
      </mesh>
      <group position={[0, 0, -opening.width / 2 + (opening.hinge === "right" ? opening.width : 0)]} rotation={[0, openAngle, 0]}>
        <group position={[0, 0, (opening.hinge === "right" ? -1 : 1) * opening.width / 2 + (opening.style === "sliding" ? slide : 0)]}>
          <mesh userData={{ id: opening.id, kind: "door" }} castShadow>
            <boxGeometry args={[0.05, opening.height - 0.04, opening.width - 0.04]} />
            <meshPhysicalMaterial
              color={opening.style === "glass" ? "#cfe8f2" : "#6b4426"}
              roughness={opening.style === "glass" ? 0.1 : 0.45}
              transparent={opening.style === "glass"}
              opacity={opening.style === "glass" ? 0.35 : 1}
            />
          </mesh>
          <mesh position={[0.04, 0, opening.width * 0.32]}>
            <cylinderGeometry args={[0.015, 0.015, 0.12, 8]} />
            <meshPhysicalMaterial color="#c4a574" metalness={1} roughness={0.25} />
          </mesh>
        </group>
      </group>
    </group>
  );
}
