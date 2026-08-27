import type { SceneDocument, SceneObject, Room, Opening, Wall, CadSourceTrace } from "@/types/scene";

export interface ResolvedEntity {
  id: string;
  kind: "object" | "room" | "door" | "window" | "wall" | "light";
  name: string;
  type: string;
  dimensions?: { width: number; depth?: number; height: number; length?: number; area?: number };
  material?: string;
  estimatedCost?: number;
  manufacturer?: string;
  confidence?: { score: number; source: string; notes?: string };
  sourceReferenceId?: string;
  source?: CadSourceTrace;
  extras?: Record<string, string | number>;
}

export function findEntity(scene: SceneDocument, id: string | null): ResolvedEntity | null {
  if (!id) return null;

  for (const level of scene.levels) {
    for (const room of level.rooms) {
      if (room.id === id) {
        const xs = room.polygon.map((p) => p.x);
        const zs = room.polygon.map((p) => p.z);
        const width = Math.max(...xs) - Math.min(...xs);
        const length = Math.max(...zs) - Math.min(...zs);
        let area = 0;
        for (let i = 0; i < room.polygon.length; i += 1) {
          const a = room.polygon[i];
          const b = room.polygon[(i + 1) % room.polygon.length];
          area += a.x * b.z - b.x * a.z;
        }
        const floor = scene.materials.find((m) => m.id === room.floorMaterialId);
        const wallMat = scene.materials.find((m) => m.id === room.wallMaterialId);
        return {
          id: room.id,
          kind: "room",
          name: room.name,
          type: room.type,
          dimensions: { width, length, height: room.ceilingHeight, area: Math.abs(area) / 2 },
          material: floor?.name,
          confidence: room.confidence,
          source: room.source,
          extras: {
            Flooring: floor?.name ?? room.floorMaterialId,
            "Wall material": wallMat?.name ?? room.wallMaterialId,
            "Ceiling type": "Flat",
            Furniture: room.objects.length,
            Level: level.name,
          },
        };
      }
      const object = room.objects.find((o) => o.id === id);
      if (object) return fromObject(object, room);
      const light = room.lights.find((l) => l.id === id);
      if (light) {
        return {
          id: light.id,
          kind: "light",
          name: light.name,
          type: light.type,
          confidence: light.confidence,
        };
      }
    }
    for (const wall of level.walls) {
      if (wall.id === id) {
        const len = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
        return {
          id: wall.id,
          kind: "wall",
          name: wall.exterior ? "Exterior Wall" : "Interior Wall",
          type: wall.exterior ? "exterior-wall" : "interior-wall",
          dimensions: { width: wall.thickness, length: len, height: wall.height },
          confidence: wall.confidence,
          source: wall.source,
        };
      }
      const opening = wall.openings.find((o) => o.id === id);
      if (opening) return fromOpening(opening, wall);
    }
  }
  return null;
}

function fromObject(object: SceneObject, room: Room): ResolvedEntity {
  return {
    id: object.id,
    kind: "object",
    name: object.name,
    type: object.type,
    dimensions: object.dimensions,
    material: object.materialId,
    estimatedCost: object.estimatedCost,
    manufacturer: object.manufacturer,
    confidence: object.confidence,
    sourceReferenceId: object.sourceReferenceId,
    source: object.source,
    extras: { Room: room.name },
  };
}

function fromOpening(opening: Opening, wall: Wall): ResolvedEntity {
  return {
    id: opening.id,
    kind: opening.type === "window" ? "window" : "door",
    name: opening.name,
    type: opening.type,
    dimensions: { width: opening.width, height: opening.height, depth: wall.thickness },
    confidence: opening.confidence,
    source: opening.source,
  };
}

export function allRooms(scene: SceneDocument): { levelId: string; levelName: string; room: Room }[] {
  return scene.levels.flatMap((level) =>
    level.rooms.map((room) => ({ levelId: level.id, levelName: level.name, room })),
  );
}

export function roomSpawn(room: Room, elevation: number): { x: number; y: number; z: number } {
  let x = 0;
  let z = 0;
  for (const p of room.polygon) {
    x += p.x;
    z += p.z;
  }
  const n = room.polygon.length || 1;
  return { x: x / n, y: elevation + 1.7, z: z / n };
}
