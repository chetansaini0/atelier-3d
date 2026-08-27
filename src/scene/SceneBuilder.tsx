"use client";

import type { ThreeEvent } from "@react-three/fiber";
import type { SceneDocument } from "@/types/scene";
import { WallBuilder } from "@/scene/WallBuilder";
import { RoomBuilder } from "@/scene/RoomBuilder";
import { StairBuilder } from "@/scene/StairBuilder";
import { EnvironmentBuilder } from "@/scene/EnvironmentBuilder";
import { LightingRig } from "@/scene/LightingRig";
import { useViewerStore } from "@/store/viewerStore";

interface Props {
  scene: SceneDocument;
  onSelect: (id: string, kind: "wall" | "door" | "window" | "room" | "object" | "light", event: ThreeEvent<MouseEvent>) => void;
}

export function SceneBuilder({ scene, onSelect }: Props) {
  const lightingMode = useViewerStore((s) => s.lightingMode);
  const visibleLevelId = useViewerStore((s) => s.visibleLevelId);
  const ghostOtherFloors = useViewerStore((s) => s.ghostOtherFloors);
  const openDoorIds = useViewerStore((s) => s.openDoorIds);
  const highlightedIds = useViewerStore((s) => s.highlightedIds);
  const selectedId = useViewerStore((s) => s.selectedId);

  return (
    <group>
      <LightingRig scene={scene} mode={lightingMode} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[6, -0.06, 4]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshPhysicalMaterial color="#5c7348" roughness={1} />
      </mesh>
      {scene.levels.map((level) => {
        const active = !visibleLevelId || visibleLevelId === level.id;
        const opacity = active ? 1 : ghostOtherFloors ? 0.18 : 0;
        if (opacity === 0) return null;
        return (
          <group key={level.id} visible={active || ghostOtherFloors}>
            {level.rooms.map((room) => (
              <RoomBuilder
                key={room.id}
                room={room}
                elevation={level.elevation}
                materials={scene.materials}
                highlightedIds={highlightedIds}
                selectedId={selectedId}
                onSelect={onSelect}
              />
            ))}
            {level.walls.map((wall) => (
              <WallBuilder
                key={wall.id}
                wall={wall}
                elevation={level.elevation}
                materials={scene.materials}
                openDoorIds={openDoorIds}
                onSelect={onSelect}
              />
            ))}
            {level.stairs.map((stair) => (
              <StairBuilder key={stair.id} stair={stair} />
            ))}
            <EnvironmentBuilder elements={level.outdoor} />
          </group>
        );
      })}
    </group>
  );
}
