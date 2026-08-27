import type { ArchitecturalElements, CadDocument, CadLayerCategory, CadSegment, CadUnits } from "@/cad/types";
import { metersPerCadUnit } from "@/cad/units";
import { classifyBlockName, classifyRoomLabel, furnitureSize } from "@/cad/architecture/classify";
import { detectFloorFromLayer } from "@/cad/layers";
import { polygonArea, pointInPolygon } from "@/scene/geometry";

const WALL_CATS = new Set<CadLayerCategory>(["wall", "unknown"]);
const SKIP_CATS = new Set<CadLayerCategory>(["annotation", "dimension", "hatch", "electrical", "plumbing"]);

export function detectArchitecturalElements(doc: CadDocument, unitOverride?: CadDocument["units"]): ArchitecturalElements {
  const units = unitOverride ?? doc.units;
  const scale = metersPerCadUnit(units);
  const layerCat = new Map(doc.layers.map((l) => [l.name, l.category]));

  const scaled = doc.segments.map((s) => ({
    ...s,
    start: { x: s.start.x * scale, y: s.start.y * scale, z: s.start.z * scale },
    end: { x: s.end.x * scale, y: s.end.y * scale, z: s.end.z * scale },
    width: s.width * scale,
  }));

  const walls = detectWalls(scaled, layerCat);
  const rooms = detectRooms(doc, scale, layerCat);
  const doors: ArchitecturalElements["doors"] = [];
  const windows: ArchitecturalElements["windows"] = [];
  const furniture: ArchitecturalElements["furniture"] = [];
  const stairs: ArchitecturalElements["stairs"] = [];

  for (const insert of doc.inserts) {
    const kind = classifyBlockName(insert.block) ?? classifyBlockName(insert.layer);
    const floorHint = detectFloorFromLayer(insert.layer);
    const pos = {
      x: insert.position.x * scale,
      y: floorHint?.elevation ?? insert.position.z * scale,
      z: insert.position.y * scale,
    };
    if (kind === "door") {
      doors.push({
        position: { x: pos.x, z: pos.z },
        width: worldFromInsertScale(insert.scale.x, units, 0.9),
        height: 2.1,
        rotation: insert.rotation,
        hinge: insert.rotation >= 0 ? "left" : "right",
        style: /slid/i.test(insert.block) ? "sliding" : "single",
        layer: insert.layer,
        entityId: insert.id,
        block: insert.block,
      });
    } else if (kind === "window") {
      windows.push({
        position: { x: pos.x, z: pos.z },
        width: worldFromInsertScale(insert.scale.x, units, 1.2),
        height: 1.4,
        sill: 0.9,
        rotation: insert.rotation,
        layer: insert.layer,
        entityId: insert.id,
        block: insert.block,
      });
    } else if (kind === "stair") {
      stairs.push({
        origin: pos,
        rotation: insert.rotation,
        width: 1,
        run: 4.2,
        rise: 3.1,
        steps: 16,
        layer: insert.layer,
      });
    } else if (kind) {
      const dim = furnitureSize(kind);
      furniture.push({
        name: insert.block.replace(/[_-]+/g, " "),
        type: kind,
        position: pos,
        rotation: insert.rotation,
        dimensions: {
          width: worldFromInsertScale(insert.scale.x, units, dim.width),
          depth: worldFromInsertScale(insert.scale.y, units, dim.depth),
          height: dim.height,
        },
        layer: insert.layer,
        block: insert.block,
        insertId: insert.id,
      });
    }
  }

  const levels = detectLevels(doc, walls);

  return { walls, doors, windows, furniture, stairs, rooms, levels };
}

export function detectWalls(
  segments: CadSegment[],
  layerCat: Map<string, CadLayerCategory>,
): ArchitecturalElements["walls"] {
  const candidates = segments.filter((s) => {
    const cat = layerCat.get(s.layer) ?? "unknown";
    if (SKIP_CATS.has(cat)) return false;
    const len = Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y);
    return len >= 0.35 && (WALL_CATS.has(cat) || cat === "wall" || s.width >= 0.08);
  });

  const groups = new Map<string, CadSegment[]>();
  for (const segment of candidates) {
    const key = detectFloorFromLayer(segment.layer)?.name ?? "Ground Floor";
    const list = groups.get(key) ?? [];
    list.push(segment);
    groups.set(key, list);
  }

  const walls: ArchitecturalElements["walls"] = [];
  for (const [floorName, group] of groups) {
    walls.push(...pairWallsInGroup(group.slice(0, 4000), layerCat, floorName));
  }
  markExterior(walls);
  return walls;
}

function pairWallsInGroup(
  candidates: CadSegment[],
  layerCat: Map<string, CadLayerCategory>,
  floorName: string,
): ArchitecturalElements["walls"] {
  const used = new Set<string>();
  const walls: ArchitecturalElements["walls"] = [];
  const floorElev = detectFloorFromLayer(floorName === "Ground Floor" ? "ground" : floorName)?.elevation ?? 0;

  for (let i = 0; i < candidates.length; i += 1) {
    const a = candidates[i];
    if (used.has(a.id)) continue;
    const da = dir(a);
    let partner: CadSegment | null = null;
    let bestDist = Infinity;
    for (let j = i + 1; j < candidates.length; j += 1) {
      const b = candidates[j];
      if (used.has(b.id)) continue;
      const db = dir(b);
      const parallel = Math.abs(da.x * db.x + da.z * db.z) > 0.97;
      if (!parallel) continue;
      const dist = lineDistance(a, b);
      if (dist < 0.08 || dist > 0.55) continue;
      const overlap = projectedOverlap(a, b);
      if (overlap < 0.45) continue;
      if (dist < bestDist) {
        bestDist = dist;
        partner = b;
      }
    }
    if (partner) {
      used.add(a.id);
      used.add(partner.id);
      const mid = midpointWall(a, partner);
      walls.push({
        start: mid.start,
        end: mid.end,
        thickness: bestDist,
        height: 3,
        elevation: floorElev || Math.min(a.start.z, partner.start.z),
        layer: a.layer,
        entityId: a.id,
        exterior: false,
      });
    }
  }

  for (const a of candidates) {
    if (used.has(a.id)) continue;
    const cat = layerCat.get(a.layer);
    const len = Math.hypot(a.end.x - a.start.x, a.end.y - a.start.y);
    if (cat !== "wall" && a.width < 0.08) continue;
    if (len < 1) continue;
    used.add(a.id);
    walls.push({
      start: { x: a.start.x, z: a.start.y },
      end: { x: a.end.x, z: a.end.y },
      thickness: a.width > 0.08 ? a.width : 0.15,
      height: 3,
      elevation: floorElev || a.start.z,
      layer: a.layer,
      entityId: a.id,
      exterior: false,
    });
  }
  return walls;
}

export function detectRooms(doc: CadDocument, scale: number, layerCat: Map<string, CadLayerCategory>): ArchitecturalElements["rooms"] {
  const rooms: ArchitecturalElements["rooms"] = [];
  for (const poly of doc.polylines) {
    const cat = layerCat.get(poly.layer) ?? "unknown";
    if (SKIP_CATS.has(cat)) continue;
    if (!poly.closed || poly.points.length < 3) continue;
    const polygon = poly.points.map((p) => ({ x: p.x * scale, z: p.y * scale }));
    const area = polygonArea(polygon);
    if (area < 1.2 || area > 400) continue;
    const label = nearestLabel(doc, polygon, scale, poly.layer);
    const floorHint = detectFloorFromLayer(poly.layer);
    rooms.push({
      id: poly.id,
      name: label?.name ?? "Room",
      type: label?.type ?? "room",
      polygon,
      elevation: floorHint?.elevation ?? poly.elevation * scale,
      labelSource: label?.source,
    });
  }
  return rooms;
}

function nearestLabel(doc: CadDocument, polygon: { x: number; z: number }[], scale: number, polyLayer: string) {
  const polyFloor = detectFloorFromLayer(polyLayer)?.name ?? "Ground Floor";
  let best: { name: string; type: string; source: string; dist: number } | null = null;
  for (const text of doc.texts) {
    const textFloor = detectFloorFromLayer(text.layer)?.name ?? "Ground Floor";
    if (textFloor !== polyFloor) continue;
    const classified = classifyRoomLabel(text.value);
    if (!classified) continue;
    const p = { x: text.position.x * scale, z: text.position.y * scale };
    if (!pointInPolygon(p, polygon)) continue;
    const dist = 0;
    if (!best || dist < best.dist) best = { ...classified, source: text.value, dist };
  }
  return best;
}

function detectLevels(doc: CadDocument, walls: ArchitecturalElements["walls"]) {
  const levels: { name: string; elevation: number }[] = [{ name: "Ground Floor", elevation: 0 }];
  for (const layer of doc.layers) {
    const named = detectFloorFromLayer(layer.name);
    if (named && !levels.some((l) => l.name === named.name)) levels.push(named);
  }
  const zs = [...new Set(walls.map((w) => Math.round(w.elevation * 10) / 10))].sort((a, b) => a - b);
  for (const z of zs) {
    if (z < 0.4) continue;
    if (levels.some((l) => Math.abs(l.elevation - z) < 0.4)) continue;
    levels.push({ name: `Level ${levels.length}`, elevation: z });
  }
  return levels;
}

export function worldFromInsertScale(scaleX: number, units: CadUnits, fallback: number): number {
  const meters = Math.abs(scaleX) * metersPerCadUnit(units);
  if (meters >= 0.35 && meters <= 3) return meters;
  if (Math.abs(scaleX - 1) < 0.2) return fallback;
  return fallback;
}

function dir(s: CadSegment) {
  const len = Math.hypot(s.end.x - s.start.x, s.end.y - s.start.y) || 1;
  return { x: (s.end.x - s.start.x) / len, z: (s.end.y - s.start.y) / len };
}

function lineDistance(a: CadSegment, b: CadSegment) {
  const d = dir(a);
  const n = { x: -d.z, z: d.x };
  const mid = { x: (b.start.x + b.end.x) / 2, z: (b.start.y + b.end.y) / 2 };
  return Math.abs((mid.x - a.start.x) * n.x + (mid.z - a.start.y) * n.z);
}

function projectedOverlap(a: CadSegment, b: CadSegment) {
  const d = dir(a);
  const a0 = a.start.x * d.x + a.start.y * d.z;
  const a1 = a.end.x * d.x + a.end.y * d.z;
  const b0 = b.start.x * d.x + b.start.y * d.z;
  const b1 = b.end.x * d.x + b.end.y * d.z;
  const minA = Math.min(a0, a1);
  const maxA = Math.max(a0, a1);
  const minB = Math.min(b0, b1);
  const maxB = Math.max(b0, b1);
  return Math.max(0, Math.min(maxA, maxB) - Math.max(minA, minB));
}

function midpointWall(a: CadSegment, b: CadSegment) {
  return {
    start: { x: (a.start.x + b.start.x) / 2, z: (a.start.y + b.start.y) / 2 },
    end: { x: (a.end.x + b.end.x) / 2, z: (a.end.y + b.end.y) / 2 },
  };
}

function markExterior(walls: ArchitecturalElements["walls"]) {
  if (!walls.length) return;
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const w of walls) {
    minX = Math.min(minX, w.start.x, w.end.x);
    minZ = Math.min(minZ, w.start.z, w.end.z);
    maxX = Math.max(maxX, w.start.x, w.end.x);
    maxZ = Math.max(maxZ, w.start.z, w.end.z);
  }
  for (const w of walls) {
    const mx = (w.start.x + w.end.x) / 2;
    const mz = (w.start.z + w.end.z) / 2;
    w.exterior = mx < minX + 0.4 || mx > maxX - 0.4 || mz < minZ + 0.4 || mz > maxZ - 0.4;
  }
}

