import { z } from "zod";
import type { SceneDocument } from "@/types/scene";

const confidenceSchema = z.object({
  score: z.number().min(0).max(1),
  source: z.enum(["reference", "estimated", "inferred", "user", "demo", "cad"]),
  notes: z.string().optional(),
});

const cadSourceSchema = z
  .object({
    type: z.literal("cad"),
    filename: z.string().optional(),
    layer: z.string().optional(),
    entityType: z.string().optional(),
    entityId: z.string().optional(),
    block: z.string().optional(),
    insertId: z.string().optional(),
    dimensionText: z.string().optional(),
  })
  .optional();

const vec2Schema = z.object({
  x: z.number(),
  z: z.number(),
});

const vec3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

const dimensionsSchema = z.object({
  width: z.number().positive(),
  depth: z.number().positive(),
  height: z.number().positive(),
});

export const materialSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum([
    "wood",
    "marble",
    "granite",
    "ceramic",
    "glass",
    "metal",
    "concrete",
    "brick",
    "paint",
    "fabric",
    "leather",
    "stone",
    "grass",
    "water",
  ]),
  color: z.string().min(1),
  roughness: z.number().min(0).max(1),
  metalness: z.number().min(0).max(1),
  opacity: z.number().min(0).max(1).optional(),
  transmission: z.number().min(0).max(1).optional(),
  confidence: confidenceSchema,
});

export const openingSchema = z.object({
  id: z.string(),
  type: z.enum(["door", "window", "archway"]),
  name: z.string(),
  offset: z.number().min(0),
  width: z.number().positive(),
  height: z.number().positive(),
  sillHeight: z.number().min(0),
  hinge: z.enum(["left", "right"]).optional(),
  open: z.boolean().optional(),
  style: z.enum(["single", "double", "sliding", "glass"]).optional(),
  interactive: z.boolean(),
  confidence: confidenceSchema,
  source: cadSourceSchema,
});

export const wallSchema = z.object({
  id: z.string(),
  start: vec2Schema,
  end: vec2Schema,
  height: z.number().positive(),
  thickness: z.number().positive(),
  materialId: z.string(),
  exterior: z.boolean(),
  openings: z.array(openingSchema),
  confidence: confidenceSchema,
  source: cadSourceSchema,
});

export const sceneObjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  position: vec3Schema,
  rotation: z.number(),
  dimensions: dimensionsSchema,
  color: z.string().optional(),
  materialId: z.string().optional(),
  interactive: z.boolean(),
  estimatedCost: z.number().optional(),
  manufacturer: z.string().optional(),
  metadata: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional(),
  sourceReferenceId: z.string().optional(),
  confidence: confidenceSchema,
  source: cadSourceSchema,
});

export const sceneLightSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["point", "spot", "rect", "ceiling"]),
  position: vec3Schema,
  color: z.string(),
  intensity: z.number(),
  distance: z.number(),
  target: vec3Schema.optional(),
  confidence: confidenceSchema,
});

export const roomSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.string(),
  polygon: z.array(vec2Schema).min(3),
  floorMaterialId: z.string(),
  wallMaterialId: z.string(),
  ceilingMaterialId: z.string(),
  ceilingHeight: z.number().positive(),
  objects: z.array(sceneObjectSchema),
  lights: z.array(sceneLightSchema),
  confidence: confidenceSchema,
  source: cadSourceSchema,
});

export const stairSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(["straight", "l-shaped", "u-shaped", "spiral"]),
  origin: vec3Schema,
  rotation: z.number(),
  width: z.number().positive(),
  run: z.number().positive(),
  rise: z.number().positive(),
  steps: z.number().int().positive(),
  confidence: confidenceSchema,
});

export const outdoorSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.enum(["terrain", "path", "grass", "water", "tree", "bench", "lamp", "parking"]),
  position: vec3Schema,
  rotation: z.number(),
  dimensions: dimensionsSchema,
  color: z.string().optional(),
  confidence: confidenceSchema,
});

export const levelSchema = z.object({
  id: z.string(),
  name: z.string(),
  elevation: z.number(),
  height: z.number().positive(),
  rooms: z.array(roomSchema),
  walls: z.array(wallSchema),
  stairs: z.array(stairSchema),
  outdoor: z.array(outdoorSchema),
});

export const sceneDocumentSchema = z.object({
  version: z.literal(1),
  project: z.object({
    name: z.string().min(1),
    units: z.literal("meters"),
    architectureType: z.string(),
    description: z.string().optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
  }),
  settings: z.object({
    units: z.enum(["metric", "imperial"]),
    scale: z.union([z.literal("auto"), z.number()]),
    architectureType: z.union([z.literal("auto"), z.string()]),
    detailLevel: z.enum(["standard", "high", "ultra"]),
    realism: z.enum(["standard", "photorealistic"]),
    detectFurniture: z.boolean(),
    lighting: z.union([z.literal("automatic"), z.enum(["day", "night", "sunset"])]),
    confidenceThreshold: z.number().min(0).max(1),
    knownMeasurement: z
      .object({
        label: z.string(),
        meters: z.number().positive(),
      })
      .optional(),
  }),
  references: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      mimeType: z.string(),
      role: z.enum(["floor-plan", "interior", "exterior", "material", "cad", "other"]),
      dataUrl: z.string().optional(),
      notes: z.string().optional(),
    }),
  ),
  materials: z.array(materialSchema),
  levels: z.array(levelSchema).min(1),
  cameras: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      position: vec3Schema,
      target: vec3Schema,
    }),
  ),
  spawn: vec3Schema,
  cad: z
    .object({
      source: z.object({
        type: z.enum(["DWG", "DXF", "SVG"]),
        filename: z.string(),
        units: z.string(),
        version: z.string().optional(),
        processedAt: z.string(),
        originalPreserved: z.boolean(),
      }),
      analysis: z.object({
        floors: z.number(),
        rooms: z.number(),
        doors: z.number(),
        windows: z.number(),
        furniture: z.number(),
        confidence: z.number(),
      }),
      conversion: z.object({
        cadUnits: z.string(),
        sceneUnits: z.literal("meters"),
        scaleToMeters: z.number(),
      }),
    })
    .optional(),
});

export function validateSceneDocument(input: unknown): SceneDocument {
  return sceneDocumentSchema.parse(input) as SceneDocument;
}

export function safeParseSceneDocument(input: unknown) {
  return sceneDocumentSchema.safeParse(input);
}
