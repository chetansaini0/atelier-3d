"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { ThreeEvent } from "@react-three/fiber";
import type { MaterialDef, Room } from "@/types/scene";
import { polygonCentroid } from "@/scene/geometry";
import { materialProps } from "@/scene/materials";
import { FurnitureMesh } from "@/scene/FurnitureCatalog";

interface Props {
  room: Room;
  elevation: number;
  materials: MaterialDef[];
  highlightedIds: Set<string>;
  selectedId: string | null;
  onSelect: (id: string, kind: "room" | "object" | "light", event: ThreeEvent<MouseEvent>) => void;
}

export function RoomBuilder({ room, elevation, materials, highlightedIds, selectedId, onSelect }: Props) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    room.polygon.forEach((p, i) => {
      if (i === 0) s.moveTo(p.x, p.z);
      else s.lineTo(p.x, p.z);
    });
    s.closePath();
    return s;
  }, [room.polygon]);

  const floor = materialProps(materials.find((m) => m.id === room.floorMaterialId));
  const ceil = materialProps(materials.find((m) => m.id === room.ceilingMaterialId), "#f7f4ee");
  const centroid = polygonCentroid(room.polygon);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, elevation, 0]}
        receiveShadow
        onClick={(e) => onSelect(room.id, "room", e)}
        userData={{ id: room.id, kind: "room" }}
      >
        <shapeGeometry args={[shape]} />
        <meshPhysicalMaterial {...floor} />
      </mesh>
      <mesh
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, elevation + room.ceilingHeight - 0.02, 0]}
        userData={{ id: room.id, kind: "room" }}
      >
        <shapeGeometry args={[shape]} />
        <meshPhysicalMaterial {...ceil} />
      </mesh>
      {room.objects.map((object) => {
        const selected = selectedId === object.id || highlightedIds.has(object.id);
        return (
          <group
            key={object.id}
            position={[object.position.x, object.position.y, object.position.z]}
            rotation={[0, object.rotation, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(object.id, "object", e);
            }}
            userData={{ id: object.id, kind: "object" }}
          >
            <FurnitureMesh object={object} />
            {selected ? (
              <mesh position={[0, object.dimensions.height / 2, 0]}>
                <boxGeometry
                  args={[
                    object.dimensions.width + 0.08,
                    object.dimensions.height + 0.08,
                    object.dimensions.depth + 0.08,
                  ]}
                />
                <meshBasicMaterial color="#c4a574" wireframe transparent opacity={0.85} />
              </mesh>
            ) : null}
          </group>
        );
      })}
      <mesh position={[centroid.x, elevation + 0.03, centroid.z]} visible={false} userData={{ id: room.id, kind: "room" }}>
        <boxGeometry args={[0.2, 0.05, 0.2]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
