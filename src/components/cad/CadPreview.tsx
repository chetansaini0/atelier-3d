"use client";

import { useMemo } from "react";
import type { ArchitecturalElements, CadDocument, CadLayerCategory } from "@/cad/types";

const CATEGORY_COLORS: Record<string, string> = {
  wall: "#5c5346",
  door: "#8b5a3c",
  window: "#4a7d8c",
  furniture: "#6b4426",
  floor: "#c9b9a4",
  stair: "#9a5a42",
  annotation: "#888",
  dimension: "#b08d57",
};

export function CadPreview({
  document,
  elements,
  hiddenCategories,
}: {
  document: CadDocument;
  elements: ArchitecturalElements;
  hiddenCategories: Set<CadLayerCategory>;
}) {
  const layerCat = useMemo(() => new Map(document.layers.map((l) => [l.name, l.category])), [document.layers]);

  const { minX, minZ, maxX, maxZ } = useMemo(() => {
    let minX = Infinity;
    let minZ = Infinity;
    let maxX = -Infinity;
    let maxZ = -Infinity;
    for (const wall of elements.walls) {
      minX = Math.min(minX, wall.start.x, wall.end.x);
      minZ = Math.min(minZ, wall.start.z, wall.end.z);
      maxX = Math.max(maxX, wall.start.x, wall.end.x);
      maxZ = Math.max(maxZ, wall.start.z, wall.end.z);
    }
    if (!Number.isFinite(minX)) {
      minX = 0;
      minZ = 0;
      maxX = 10;
      maxZ = 10;
    }
    return { minX, minZ, maxX, maxZ };
  }, [elements.walls]);

  const pad = 1;
  const w = Math.max(320, (maxX - minX + pad * 2) * 36);
  const h = Math.max(240, (maxZ - minZ + pad * 2) * 36);
  const tx = (v: number) => (v - minX + pad) * 36;
  const tz = (v: number) => (v - minZ + pad) * 36;

  const show = (layer: string, fallback: CadLayerCategory) => {
    const cat = layerCat.get(layer) ?? fallback;
    return !hiddenCategories.has(cat);
  };

  return (
    <div className="glass overflow-auto rounded-2xl p-3">
      <p className="mb-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">CAD preview</p>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="max-w-full bg-[#f4f0e8]">
        {elements.rooms.map((room) =>
          show(room.labelSource ? "A-FLOR" : "A-FLOR", "floor") ? (
            <polygon
              key={room.id}
              points={room.polygon.map((p) => `${tx(p.x)},${tz(p.z)}`).join(" ")}
              fill="rgba(196,165,116,0.12)"
              stroke="none"
            />
          ) : null,
        )}
        {elements.walls.map((wall, i) =>
          show(wall.layer, "wall") ? (
            <line
              key={`${wall.entityId}-${i}`}
              x1={tx(wall.start.x)}
              y1={tz(wall.start.z)}
              x2={tx(wall.end.x)}
              y2={tz(wall.end.z)}
              stroke={wall.exterior ? "#1a1916" : CATEGORY_COLORS.wall}
              strokeWidth={wall.exterior ? 5 : 3}
            />
          ) : null,
        )}
        {elements.doors.map((door, i) =>
          show(door.layer, "door") ? (
            <circle key={`d-${i}`} cx={tx(door.position.x)} cy={tz(door.position.z)} r={7} fill={CATEGORY_COLORS.door} />
          ) : null,
        )}
        {elements.windows.map((win, i) =>
          show(win.layer, "window") ? (
            <rect
              key={`w-${i}`}
              x={tx(win.position.x) - 8}
              y={tz(win.position.z) - 4}
              width={16}
              height={8}
              fill={CATEGORY_COLORS.window}
            />
          ) : null,
        )}
        {elements.furniture.map((item) =>
          show(item.layer, "furniture") ? (
            <rect
              key={item.insertId}
              x={tx(item.position.x) - 6}
              y={tz(item.position.z) - 6}
              width={12}
              height={12}
              fill={CATEGORY_COLORS.furniture}
            />
          ) : null,
        )}
        {elements.rooms.map((room) => (
          <text
            key={`${room.id}-l`}
            x={tx(room.polygon.reduce((s, p) => s + p.x, 0) / room.polygon.length)}
            y={tz(room.polygon.reduce((s, p) => s + p.z, 0) / room.polygon.length)}
            fontSize={11}
            textAnchor="middle"
            fill="#3b342b"
          >
            {room.name}
          </text>
        ))}
      </svg>
    </div>
  );
}
