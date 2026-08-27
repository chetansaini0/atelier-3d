"use client";

import { useMemo } from "react";
import type { SceneDocument } from "@/types/scene";
import { polygonCentroid } from "@/scene/geometry";
import { useViewerStore } from "@/store/viewerStore";

export function Minimap({ scene }: { scene: SceneDocument }) {
  const player = useViewerStore((s) => s.playerPosition);
  const yaw = useViewerStore((s) => s.playerYaw);
  const visibleLevelId = useViewerStore((s) => s.visibleLevelId);
  const level = scene.levels.find((l) => l.id === visibleLevelId) ?? scene.levels[0];

  const box = useMemo(() => {
    let minX = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxZ = -Infinity;
    for (const wall of level.walls) {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minZ = Math.min(minZ, wall.start.z, wall.end.z);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxZ = Math.max(maxZ, wall.start.z, wall.end.z);
    }
    return { minX, minZ, maxX, maxZ, w: maxX - minX || 1, d: maxZ - minZ || 1 };
  }, [level]);

  const size = 168;
  const mapX = (x: number) => ((x - box.minX) / box.w) * size;
  const mapZ = (z: number) => ((z - box.minZ) / box.d) * size;

  return (
    <div className="glass panel-shadow pointer-events-none h-[188px] w-[188px] rounded-2xl p-2">
      <svg width={size} height={size} className="overflow-visible">
        {level.rooms.map((room) => {
          const c = polygonCentroid(room.polygon);
          const points = room.polygon.map((p) => `${mapX(p.x)},${mapZ(p.z)}`).join(" ");
          return (
            <g key={room.id}>
              <polygon points={points} fill="rgba(196,165,116,0.12)" stroke="rgba(244,240,230,0.25)" strokeWidth="1" />
              <text x={mapX(c.x)} y={mapZ(c.z)} textAnchor="middle" fontSize="7" fill="#f4f0e6">
                {room.name}
              </text>
            </g>
          );
        })}
        {level.walls.map((wall) =>
          wall.openings
            .filter((o) => o.type === "door")
            .map((opening) => {
              const t = opening.offset + opening.width / 2;
              const len = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z) || 1;
              const x = wall.start.x + ((wall.end.x - wall.start.x) / len) * t;
              const z = wall.start.z + ((wall.end.z - wall.start.z) / len) * t;
              return <circle key={opening.id} cx={mapX(x)} cy={mapZ(z)} r="2.2" fill="#c4a574" />;
            }),
        )}
        <g transform={`translate(${mapX(player.x)}, ${mapZ(player.z)}) rotate(${(-yaw * 180) / Math.PI})`}>
          <polygon points="0,-7 5,6 -5,6" fill="#f4f0e6" />
        </g>
      </svg>
    </div>
  );
}
