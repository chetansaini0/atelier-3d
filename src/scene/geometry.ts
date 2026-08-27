import type { Room, Stair, Vec2, Wall } from "@/types/scene";

export function distance2(a: Vec2, b: Vec2): number {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  return Math.hypot(dx, dz);
}

export function polygonArea(polygon: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const a = polygon[i];
    const b = polygon[(i + 1) % polygon.length];
    area += a.x * b.z - b.x * a.z;
  }
  return Math.abs(area) / 2;
}

export function polygonCentroid(polygon: Vec2[]): Vec2 {
  let x = 0;
  let z = 0;
  let a = 0;
  for (let i = 0; i < polygon.length; i += 1) {
    const p = polygon[i];
    const q = polygon[(i + 1) % polygon.length];
    const cross = p.x * q.z - q.x * p.z;
    x += (p.x + q.x) * cross;
    z += (p.z + q.z) * cross;
    a += cross;
  }
  const factor = a === 0 ? 1 : 1 / (3 * a);
  return { x: x * factor, z: z * factor };
}

export function pointInPolygon(point: Vec2, polygon: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const pi = polygon[i];
    const pj = polygon[j];
    const intersect =
      pi.z > point.z !== pj.z > point.z &&
      point.x < ((pj.x - pi.x) * (point.z - pi.z)) / (pj.z - pi.z + Number.EPSILON) + pi.x;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function roomBounds(room: Room): { min: Vec2; max: Vec2; width: number; depth: number } {
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const p of room.polygon) {
    minX = Math.min(minX, p.x);
    minZ = Math.min(minZ, p.z);
    maxX = Math.max(maxX, p.x);
    maxZ = Math.max(maxZ, p.z);
  }
  return {
    min: { x: minX, z: minZ },
    max: { x: maxX, z: maxZ },
    width: maxX - minX,
    depth: maxZ - minZ,
  };
}

export function wallLength(wall: Wall): number {
  return distance2(wall.start, wall.end);
}

export function wallDirection(wall: Wall): Vec2 {
  const len = wallLength(wall) || 1;
  return {
    x: (wall.end.x - wall.start.x) / len,
    z: (wall.end.z - wall.start.z) / len,
  };
}

export function wallNormal(wall: Wall): Vec2 {
  const d = wallDirection(wall);
  return { x: -d.z, z: d.x };
}

export function wallPointAt(wall: Wall, offset: number): Vec2 {
  const d = wallDirection(wall);
  return {
    x: wall.start.x + d.x * offset,
    z: wall.start.z + d.z * offset,
  };
}

export interface WallSegment {
  start: number;
  end: number;
  kind: "solid" | "door" | "window" | "archway";
  openingIndex?: number;
  sillHeight: number;
  openingHeight: number;
}

export function wallSegments(wall: Wall): WallSegment[] {
  const length = wallLength(wall);
  const openings = [...wall.openings].sort((a, b) => a.offset - b.offset);
  const segments: WallSegment[] = [];
  let cursor = 0;

  openings.forEach((opening, index) => {
    const start = Math.max(0, Math.min(length, opening.offset));
    const end = Math.max(0, Math.min(length, opening.offset + opening.width));
    if (start > cursor + 0.001) {
      segments.push({
        start: cursor,
        end: start,
        kind: "solid",
        sillHeight: 0,
        openingHeight: wall.height,
      });
    }
    segments.push({
      start,
      end,
      kind: opening.type,
      openingIndex: index,
      sillHeight: opening.sillHeight,
      openingHeight: opening.height,
    });
    cursor = end;
  });

  if (cursor < length - 0.001) {
    segments.push({
      start: cursor,
      end: length,
      kind: "solid",
      sillHeight: 0,
      openingHeight: wall.height,
    });
  }

  return segments;
}

export function closestPointOnSegment(point: Vec2, a: Vec2, b: Vec2): { point: Vec2; t: number; dist: number } {
  const dx = b.x - a.x;
  const dz = b.z - a.z;
  const lenSq = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.z - a.z) * dz) / lenSq));
  const px = a.x + dx * t;
  const pz = a.z + dz * t;
  return {
    point: { x: px, z: pz },
    t,
    dist: Math.hypot(point.x - px, point.z - pz),
  };
}

export function isWalkableOpening(
  wall: Wall,
  tAlong: number,
  openDoorIds: Set<string>,
): boolean {
  for (const opening of wall.openings) {
    if (tAlong < opening.offset || tAlong > opening.offset + opening.width) continue;
    if (opening.type === "archway") return true;
    if (opening.type === "door" && (opening.open || openDoorIds.has(opening.id))) return true;
  }
  return false;
}

export function collideWithWalls(
  position: Vec2,
  radius: number,
  walls: Wall[],
  openDoorIds: Set<string>,
): Vec2 {
  let x = position.x;
  let z = position.z;

  for (const wall of walls) {
    const hit = closestPointOnSegment({ x, z }, wall.start, wall.end);
    const clearance = radius + wall.thickness / 2;
    if (hit.dist >= clearance) continue;

    const along = hit.t * wallLength(wall);
    if (isWalkableOpening(wall, along, openDoorIds)) continue;

    const nx = (x - hit.point.x) / (hit.dist || 1);
    const nz = (z - hit.point.z) / (hit.dist || 1);
    const push = clearance - hit.dist;
    x += nx * push;
    z += nz * push;
  }

  return { x, z };
}

export function stairHeightAt(stair: Stair, localX: number, localZ: number): number | null {
  if (localX < -0.05 || localX > stair.width + 0.05) return null;
  if (localZ < -0.05 || localZ > stair.run + 0.05) return null;
  const t = Math.max(0, Math.min(1, localZ / stair.run));
  return stair.origin.y + t * stair.rise;
}

export function worldToStairLocal(stair: Stair, world: Vec2): Vec2 {
  const dx = world.x - stair.origin.x;
  const dz = world.z - stair.origin.z;
  const cos = Math.cos(-stair.rotation);
  const sin = Math.sin(-stair.rotation);
  return {
    x: dx * cos - dz * sin,
    z: dx * sin + dz * cos,
  };
}

export function groundHeightAt(
  x: number,
  z: number,
  rooms: Room[],
  stairs: Stair[],
  levelElevation: number,
): number {
  for (const stair of stairs) {
    const local = worldToStairLocal(stair, { x, z });
    const h = stairHeightAt(stair, local.x, local.z);
    if (h !== null) return h;
  }

  const inside = rooms.some((room) => pointInPolygon({ x, z }, room.polygon));
  return inside ? levelElevation : levelElevation - 0.02;
}

export function formatMeters(value: number, units: "metric" | "imperial" = "metric"): string {
  if (units === "imperial") {
    const feet = value * 3.28084;
    return `${feet.toFixed(2)} ft`;
  }
  return `${value.toFixed(2)} m`;
}

export function roomDimensions(room: Room): { width: number; length: number; height: number; area: number } {
  const bounds = roomBounds(room);
  return {
    width: Number(bounds.width.toFixed(2)),
    length: Number(bounds.depth.toFixed(2)),
    height: room.ceilingHeight,
    area: Number(polygonArea(room.polygon).toFixed(2)),
  };
}
