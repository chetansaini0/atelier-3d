"use client";

import type { SceneDocument } from "@/types/scene";
import { polygonCentroid, roomDimensions } from "@/scene/geometry";
import { roomSpawn } from "@/scene/lookup";
import { useViewerStore } from "@/store/viewerStore";

export function NavigationTree({ scene }: { scene: SceneDocument }) {
  const setVisibleLevel = useViewerStore((s) => s.setVisibleLevel);
  const select = useViewerStore((s) => s.select);
  const setCameraMode = useViewerStore((s) => s.setCameraMode);
  const setPlayer = useViewerStore((s) => s.setPlayer);
  const visibleLevelId = useViewerStore((s) => s.visibleLevelId);

  return (
    <aside className="glass panel-shadow w-64 rounded-2xl p-4">
      <p className="mb-3 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Building</p>
      <div className="space-y-3">
        {scene.levels.map((level) => (
          <div key={level.id}>
            <button
              className={`mb-1 text-left text-sm ${visibleLevelId === level.id ? "text-[var(--brass)]" : "text-[var(--fg)]"}`}
              onClick={() => setVisibleLevel(level.id)}
            >
              {level.name}
            </button>
            <ul className="space-y-1 border-l border-[var(--line)] pl-3">
              {level.rooms.map((room) => {
                const dim = roomDimensions(room);
                return (
                  <li key={room.id}>
                    <button
                      className="w-full text-left text-sm text-[var(--muted)] hover:text-[var(--fg)]"
                      onClick={() => {
                        setVisibleLevel(level.id);
                        select(room.id, "room");
                        const spawn = roomSpawn(room, level.elevation);
                        setPlayer(spawn, 0);
                        setCameraMode("first-person");
                      }}
                    >
                      {room.name}
                      <span className="ml-2 text-[10px] uppercase tracking-wider">
                        {dim.width}×{dim.length}m
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function FloorPlanView({ scene }: { scene: SceneDocument }) {
  const visibleLevelId = useViewerStore((s) => s.visibleLevelId);
  const select = useViewerStore((s) => s.select);
  const setCameraMode = useViewerStore((s) => s.setCameraMode);
  const setPlayer = useViewerStore((s) => s.setPlayer);
  const player = useViewerStore((s) => s.playerPosition);
  const level = scene.levels.find((l) => l.id === visibleLevelId) ?? scene.levels[0];
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
  const pad = 0.8;
  const w = 520;
  const h = 420;
  const sx = w / (maxX - minX + pad * 2);
  const sz = h / (maxZ - minZ + pad * 2);
  const s = Math.min(sx, sz);
  const tx = (x: number) => (x - minX + pad) * s;
  const tz = (z: number) => (z - minZ + pad) * s;

  return (
    <div className="glass panel-shadow rounded-2xl p-4">
      <p className="mb-2 text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Floor plan · {level.name}</p>
      <svg width={w} height={h} className="max-w-full">
        {level.rooms.map((room) => {
          const c = polygonCentroid(room.polygon);
          const dim = roomDimensions(room);
          return (
            <g
              key={room.id}
              className="cursor-pointer"
              onClick={() => {
                select(room.id, "room");
                const spawn = roomSpawn(room, level.elevation);
                setPlayer(spawn, 0);
                setCameraMode("first-person");
              }}
            >
              <polygon
                points={room.polygon.map((p) => `${tx(p.x)},${tz(p.z)}`).join(" ")}
                fill="rgba(196,165,116,0.08)"
                stroke="rgba(196,165,116,0.35)"
              />
              <text x={tx(c.x)} y={tz(c.z)} textAnchor="middle" fill="#f4f0e6" fontSize="11">
                {room.name}
              </text>
              <text x={tx(c.x)} y={tz(c.z) + 14} textAnchor="middle" fill="#9a9486" fontSize="9">
                {dim.width} × {dim.length} m
              </text>
            </g>
          );
        })}
        {level.walls.map((wall) => (
          <line
            key={wall.id}
            x1={tx(wall.start.x)}
            y1={tz(wall.start.z)}
            x2={tx(wall.end.x)}
            y2={tz(wall.end.z)}
            stroke={wall.exterior ? "#f4f0e6" : "#9a9486"}
            strokeWidth={wall.exterior ? 3 : 1.5}
          />
        ))}
        {level.rooms.flatMap((room) =>
          room.objects.map((object) => (
            <rect
              key={object.id}
              x={tx(object.position.x) - 4}
              y={tz(object.position.z) - 3}
              width="8"
              height="6"
              fill="rgba(196,165,116,0.7)"
            />
          )),
        )}
        <circle cx={tx(player.x)} cy={tz(player.z)} r="5" fill="#c4a574" />
      </svg>
      <p className="mt-2 text-xs text-[var(--muted)]">Click a room to enter first-person view.</p>
    </div>
  );
}
