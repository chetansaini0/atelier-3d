import { detectFloorFromLayer } from "@/cad/layers";
import { metersPerCadUnit } from "@/cad/units";
import type { ArchitecturalElements, CadDocument, CadRoomCandidate } from "@/cad/types";
import { defaultSettings } from "@/ai/SceneInterpreter";
import { createId } from "@/utils/ids";
import { pointInPolygon } from "@/scene/geometry";
import type {
  CadSourceTrace,
  Confidence,
  FurnitureType,
  GenerationSettings,
  Level,
  MaterialDef,
  Opening,
  ReferenceImage,
  Room,
  SceneDocument,
  SceneObject,
  Wall,
} from "@/types/scene";

const cadConf = (notes?: string): Confidence => ({ score: 0.92, source: "cad", notes });

const MATERIALS: MaterialDef[] = [
  { id: "paint-warm", name: "Warm Ivory Paint", type: "paint", color: "#e8dcc8", roughness: 0.86, metalness: 0, confidence: cadConf("Default interior finish") },
  { id: "paint-stone", name: "Stone Grey Paint", type: "paint", color: "#d5d1cb", roughness: 0.84, metalness: 0, confidence: cadConf() },
  { id: "wood-oak", name: "Oak Flooring", type: "wood", color: "#8a6842", roughness: 0.42, metalness: 0, confidence: cadConf() },
  { id: "ceramic-white", name: "White Ceramic Tile", type: "ceramic", color: "#f4f1ea", roughness: 0.28, metalness: 0, confidence: cadConf() },
  { id: "ceiling-white", name: "Ceiling White", type: "paint", color: "#f7f4ee", roughness: 0.92, metalness: 0, confidence: cadConf() },
  { id: "glass-clear", name: "Clear Glass", type: "glass", color: "#cfe8f2", roughness: 0.05, metalness: 0.05, opacity: 0.22, transmission: 0.9, confidence: cadConf() },
];

export function cadDocumentToScene(
  doc: CadDocument,
  elements: ArchitecturalElements,
  options: {
    settings?: GenerationSettings;
    references?: ReferenceImage[];
    description?: string;
    confidence?: number;
  } = {},
): SceneDocument {
  const now = new Date().toISOString();
  const settings = options.settings ?? defaultSettings();
  const levels = buildLevels(doc, elements);
  const spawnRoom = levels[0]?.rooms[0];
  const spawn = spawnRoom
    ? {
        x: spawnRoom.polygon.reduce((s, p) => s + p.x, 0) / spawnRoom.polygon.length,
        y: levels[0].elevation + 1.7,
        z: spawnRoom.polygon.reduce((s, p) => s + p.z, 0) / spawnRoom.polygon.length,
      }
    : { x: 1.6, y: 1.7, z: 1.2 };

  return {
    version: 1,
    project: {
      name: doc.filename.replace(/\.[^.]+$/, "") || "CAD Project",
      units: "meters",
      architectureType: "cad",
      description: options.description,
      createdAt: now,
      updatedAt: now,
    },
    settings,
    references: [
      { id: createId("ref"), name: doc.filename, mimeType: doc.format === "DWG" ? "application/acad" : "application/dxf", role: "cad" },
      ...(options.references ?? []).filter((r) => r.role !== "cad"),
    ],
    materials: MATERIALS,
    levels,
    cameras: [{ id: "cam-orbit", name: "Orbit", position: { x: 8, y: 12, z: 14 }, target: { x: spawn.x, y: 1, z: spawn.z } }],
    spawn,
    cad: {
      source: {
        type: doc.format,
        filename: doc.filename,
        units: doc.units,
        version: doc.version,
        processedAt: now,
        originalPreserved: true,
      },
      analysis: {
        floors: elements.levels.length,
        rooms: elements.rooms.length,
        doors: elements.doors.length,
        windows: elements.windows.length,
        furniture: elements.furniture.length,
        confidence: options.confidence ?? 0.9,
      },
      conversion: {
        cadUnits: doc.units,
        sceneUnits: "meters",
        scaleToMeters: metersPerCadUnit(doc.units),
      },
    },
  };
}

function buildLevels(doc: CadDocument, elements: ArchitecturalElements): Level[] {
  const buckets = elements.levels.map((level, index) => ({
    id: index === 0 ? "ground" : slug(level.name),
    name: level.name,
    elevation: level.elevation,
    height: 3,
    rooms: [] as Room[],
    walls: [] as Wall[],
    stairs: [] as Level["stairs"],
    outdoor: [] as Level["outdoor"],
  }));

  const pickLevel = (layer: string, elevation: number) => {
    const named = detectFloorFromLayer(layer);
    if (named) {
      const match = buckets.find((b) => b.name === named.name);
      if (match) return match;
    }
    return buckets.reduce((best, b) => (Math.abs(b.elevation - elevation) < Math.abs(best.elevation - elevation) ? b : best), buckets[0]);
  };

  const sceneWalls: { wall: Wall; level: Level }[] = [];
  for (const cadWall of elements.walls) {
    const level = pickLevel(cadWall.layer, cadWall.elevation);
    const source: CadSourceTrace = {
      type: "cad",
      filename: doc.filename,
      layer: cadWall.layer,
      entityType: "LINE",
      entityId: cadWall.entityId,
    };
    const wall: Wall = {
      id: createId("wall"),
      start: cadWall.start,
      end: cadWall.end,
      height: cadWall.height,
      thickness: cadWall.thickness,
      materialId: cadWall.exterior ? "paint-stone" : "paint-warm",
      exterior: cadWall.exterior,
      openings: [],
      confidence: cadConf("Source: CAD geometry"),
      source,
    };
    level.walls.push(wall);
    sceneWalls.push({ wall, level });
  }

  for (const door of elements.doors) {
    const hit = nearestWall(sceneWalls, door.position, door.layer);
    if (!hit) continue;
    const opening: Opening = {
      id: createId("door"),
      type: "door",
      name: door.block ? door.block.replace(/[_-]+/g, " ") : "Door",
      offset: openingOffset(hit.wall, door.position, door.width),
      width: door.width,
      height: door.height,
      sillHeight: 0,
      hinge: door.hinge,
      style: door.style,
      interactive: true,
      confidence: cadConf("Source: CAD Dimension"),
      source: {
        type: "cad",
        filename: doc.filename,
        layer: door.layer,
        entityType: "INSERT",
        entityId: door.entityId,
        block: door.block,
      },
    };
    hit.wall.openings.push(opening);
  }

  for (const window of elements.windows) {
    const hit = nearestWall(sceneWalls, window.position, window.layer);
    if (!hit) continue;
    hit.wall.openings.push({
      id: createId("win"),
      type: "window",
      name: window.block ? window.block.replace(/[_-]+/g, " ") : "Window",
      offset: openingOffset(hit.wall, window.position, window.width),
      width: window.width,
      height: window.height,
      sillHeight: window.sill,
      interactive: false,
      confidence: cadConf("Source: CAD geometry"),
      source: {
        type: "cad",
        filename: doc.filename,
        layer: window.layer,
        entityType: "INSERT",
        entityId: window.entityId,
        block: window.block,
      },
    });
  }

  const rooms: CadRoomCandidate[] = elements.rooms.length ? elements.rooms : fallbackRoom(elements);
  for (const cadRoom of rooms) {
    const level = pickLevel("", cadRoom.elevation);
    const wet = /bath|kitchen/.test(cadRoom.type);
    const objects: SceneObject[] = [];
    const room: Room = {
      id: cadRoom.id || createId("room"),
      name: cadRoom.name,
      type: cadRoom.type,
      polygon: cadRoom.polygon,
      floorMaterialId: wet ? "ceramic-white" : "wood-oak",
      wallMaterialId: "paint-warm",
      ceilingMaterialId: "ceiling-white",
      ceilingHeight: 3,
      objects,
      lights: [
        {
          id: createId("light"),
          name: `${cadRoom.name} Ceiling`,
          type: "ceiling",
          position: {
            x: cadRoom.polygon.reduce((s, p) => s + p.x, 0) / cadRoom.polygon.length,
            y: level.elevation + 2.55,
            z: cadRoom.polygon.reduce((s, p) => s + p.z, 0) / cadRoom.polygon.length,
          },
          color: "#fff4e0",
          intensity: 10,
          distance: 8,
          confidence: { score: 0.55, source: "inferred", notes: "Estimated / Inferred" },
        },
      ],
      confidence: cadConf(cadRoom.labelSource ? `CAD Text: ${cadRoom.labelSource}` : "Closed CAD boundary"),
      source: {
        type: "cad",
        filename: doc.filename,
        entityType: "LWPOLYLINE",
        entityId: cadRoom.id,
      },
    };
    level.rooms.push(room);
  }

  for (const item of elements.furniture) {
    const level = pickLevel(item.layer, item.position.y);
    const room = level.rooms.find((r) => pointInPolygon({ x: item.position.x, z: item.position.z }, r.polygon)) ?? level.rooms[0];
    if (!room) continue;
    room.objects.push({
      id: createId("obj"),
      name: item.name,
      type: item.type as FurnitureType,
      position: { x: item.position.x, y: level.elevation, z: item.position.z },
      rotation: item.rotation,
      dimensions: item.dimensions,
      interactive: true,
      confidence: cadConf(`Source: DWG Block · ${item.block}`),
      source: {
        type: "cad",
        filename: doc.filename,
        layer: item.layer,
        entityType: "INSERT",
        block: item.block,
        insertId: item.insertId,
      },
    });
  }

  for (const stair of elements.stairs) {
    const level = pickLevel(stair.layer, stair.origin.y);
    level.stairs.push({
      id: createId("stair"),
      name: "Stair",
      type: "straight",
      origin: { x: stair.origin.x, y: level.elevation, z: stair.origin.z },
      rotation: stair.rotation,
      width: stair.width,
      run: stair.run,
      rise: stair.rise,
      steps: stair.steps,
      confidence: cadConf("Source: CAD Block"),
    });
  }

  const usable = buckets.filter((b) => b.walls.length || b.rooms.length);
  return usable.length ? usable : buckets.slice(0, 1);
}

function fallbackRoom(elements: ArchitecturalElements): CadRoomCandidate[] {
  if (!elements.walls.length) {
    return [{ id: createId("room"), name: "Room", type: "room", polygon: [{ x: 0, z: 0 }, { x: 6, z: 0 }, { x: 6, z: 5 }, { x: 0, z: 5 }], elevation: 0 }];
  }
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
  return [
    {
      id: createId("room"),
      name: "Interior",
      type: "room",
      polygon: [
        { x: minX, z: minZ },
        { x: maxX, z: minZ },
        { x: maxX, z: maxZ },
        { x: minX, z: maxZ },
      ],
      elevation: 0,
    },
  ];
}

function nearestWall(walls: { wall: Wall; level: Level }[], pos: { x: number; z: number }, layer: string) {
  let best: { wall: Wall; level: Level; dist: number } | null = null;
  for (const item of walls) {
    const dist = pointToSegment(pos, item.wall.start, item.wall.end);
    const layerBonus = item.wall.source?.layer === layer ? -0.05 : 0;
    const score = dist + layerBonus;
    if (!best || score < best.dist) best = { ...item, dist: score };
  }
  if (!best || best.dist > 1.2) return null;
  return best;
}

function openingOffset(wall: Wall, pos: { x: number; z: number }, width: number) {
  const len = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z) || 1;
  const dx = (wall.end.x - wall.start.x) / len;
  const dz = (wall.end.z - wall.start.z) / len;
  const t = (pos.x - wall.start.x) * dx + (pos.z - wall.start.z) * dz;
  return Math.max(0.05, Math.min(len - width - 0.05, t - width / 2));
}

function pointToSegment(p: { x: number; z: number }, a: { x: number; z: number }, b: { x: number; z: number }) {
  const abx = b.x - a.x;
  const abz = b.z - a.z;
  const len2 = abx * abx + abz * abz || 1;
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.z - a.z) * abz) / len2));
  return Math.hypot(p.x - (a.x + abx * t), p.z - (a.z + abz * t));
}

function slug(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "level";
}
