import type { Room, SceneDocument, SceneObject } from "@/types/scene";
import { pointInPolygon } from "@/scene/geometry";

/**
 * CAD wins measurements and geometry. Vision may add furniture and material tints
 * that CAD cannot describe. Door widths, wall positions, and room polygons stay CAD.
 */
export function mergeCadWithVision(cadScene: SceneDocument, visionScene: SceneDocument | null | undefined): SceneDocument {
  if (!visionScene) return cadScene;

  const materials = cadScene.materials.map((mat) => {
    const match = visionScene.materials.find((m) => m.type === mat.type);
    if (!match) return mat;
    return {
      ...mat,
      color: match.color,
      roughness: match.roughness,
      name: match.name,
      confidence: {
        score: match.confidence.score,
        source: "inferred" as const,
        notes: "Visual appearance from reference images. Geometry remains CAD.",
      },
    };
  });

  return {
    ...cadScene,
    materials,
    levels: cadScene.levels.map((level) => ({
      ...level,
      rooms: level.rooms.map((room) => mergeRoom(room, visionScene)),
    })),
    references: [
      ...cadScene.references,
      ...visionScene.references.filter((r) => r.role !== "cad" && !cadScene.references.some((c) => c.name === r.name)),
    ],
  };
}

function mergeRoom(room: Room, vision: SceneDocument): Room {
  const visionRoom = vision.levels
    .flatMap((l) => l.rooms)
    .find((r) => r.type === room.type || namesClose(r.name, room.name));
  if (!visionRoom || room.objects.length || !visionRoom.objects.length) return room;

  const extras: SceneObject[] = visionRoom.objects.map((object) => ({
    ...object,
    id: `ai-${object.id}`,
    confidence: {
      score: object.confidence.score,
      source: "inferred",
      notes: "AI Vision · CAD measurements take priority",
    },
    metadata: { ...(object.metadata ?? {}), sourceKind: "ai-vision" },
  }));

  return {
    ...room,
    objects: extras.filter((o) => pointInPolygon({ x: o.position.x, z: o.position.z }, room.polygon)),
  };
}

function namesClose(a: string, b: string) {
  return a.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(a.toLowerCase());
}
