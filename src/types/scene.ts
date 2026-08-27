export type Units = "metric" | "imperial";
export type DetailLevel = "standard" | "high" | "ultra";
export type Realism = "standard" | "photorealistic";
export type LightingMode = "day" | "night" | "sunset";
export type CameraMode = "first-person" | "orbit" | "top" | "presentation";
export type EditorTool =
  | "select"
  | "move"
  | "rotate"
  | "scale"
  | "wall"
  | "door"
  | "window"
  | "furniture"
  | "measure"
  | "room"
  | "light";

export type ConfidenceSource = "reference" | "estimated" | "inferred" | "user" | "demo" | "cad";

export interface CadSourceTrace {
  type: "cad";
  filename?: string;
  layer?: string;
  entityType?: string;
  entityId?: string;
  block?: string;
  insertId?: string;
  dimensionText?: string;
}

export interface Confidence {
  score: number;
  source: ConfidenceSource;
  notes?: string;
}

export interface Vec2 {
  x: number;
  z: number;
}

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export type MaterialType =
  | "wood"
  | "marble"
  | "granite"
  | "ceramic"
  | "glass"
  | "metal"
  | "concrete"
  | "brick"
  | "paint"
  | "fabric"
  | "leather"
  | "stone"
  | "grass"
  | "water";

export interface MaterialDef {
  id: string;
  name: string;
  type: MaterialType;
  color: string;
  roughness: number;
  metalness: number;
  opacity?: number;
  transmission?: number;
  confidence: Confidence;
}

export type OpeningType = "door" | "window" | "archway";

export interface Opening {
  id: string;
  type: OpeningType;
  name: string;
  offset: number;
  width: number;
  height: number;
  sillHeight: number;
  hinge?: "left" | "right";
  open?: boolean;
  style?: "single" | "double" | "sliding" | "glass";
  interactive: boolean;
  confidence: Confidence;
  source?: CadSourceTrace;
}

export interface Wall {
  id: string;
  start: Vec2;
  end: Vec2;
  height: number;
  thickness: number;
  materialId: string;
  exterior: boolean;
  openings: Opening[];
  confidence: Confidence;
  source?: CadSourceTrace;
}

export type FurnitureType =
  | "sofa"
  | "armchair"
  | "coffee-table"
  | "dining-table"
  | "dining-chair"
  | "bed"
  | "nightstand"
  | "wardrobe"
  | "dresser"
  | "tv-unit"
  | "rug"
  | "plant"
  | "floor-lamp"
  | "table-lamp"
  | "ceiling-fan"
  | "kitchen-counter"
  | "kitchen-cabinet"
  | "kitchen-island"
  | "fridge"
  | "stove"
  | "oven"
  | "sink"
  | "microwave"
  | "dishwasher"
  | "toilet"
  | "basin"
  | "bathtub"
  | "shower"
  | "mirror"
  | "towel-rail"
  | "curtain"
  | "shelf"
  | "console"
  | "bench"
  | "tree"
  | "lamp-post"
  | "fountain"
  | "railing"
  | "column"
  | "beam"
  | "decorative"
  | "tv"
  | "washing-machine"
  | "info";

export interface SceneObject {
  id: string;
  name: string;
  type: FurnitureType;
  position: Vec3;
  rotation: number;
  dimensions: { width: number; depth: number; height: number };
  color?: string;
  materialId?: string;
  interactive: boolean;
  estimatedCost?: number;
  manufacturer?: string;
  metadata?: Record<string, string | number | boolean>;
  sourceReferenceId?: string;
  confidence: Confidence;
  source?: CadSourceTrace;
}

export type LightKind = "point" | "spot" | "rect" | "ceiling";

export interface SceneLight {
  id: string;
  name: string;
  type: LightKind;
  position: Vec3;
  color: string;
  intensity: number;
  distance: number;
  target?: Vec3;
  confidence: Confidence;
}

export interface Room {
  id: string;
  name: string;
  type: string;
  polygon: Vec2[];
  floorMaterialId: string;
  wallMaterialId: string;
  ceilingMaterialId: string;
  ceilingHeight: number;
  objects: SceneObject[];
  lights: SceneLight[];
  confidence: Confidence;
  source?: CadSourceTrace;
}

export type StairType = "straight" | "l-shaped" | "u-shaped" | "spiral";

export interface Stair {
  id: string;
  name: string;
  type: StairType;
  origin: Vec3;
  rotation: number;
  width: number;
  run: number;
  rise: number;
  steps: number;
  confidence: Confidence;
}

export type OutdoorKind =
  | "terrain"
  | "path"
  | "grass"
  | "water"
  | "tree"
  | "bench"
  | "lamp"
  | "parking";

export interface OutdoorElement {
  id: string;
  name: string;
  kind: OutdoorKind;
  position: Vec3;
  rotation: number;
  dimensions: { width: number; depth: number; height: number };
  color?: string;
  confidence: Confidence;
}

export interface Level {
  id: string;
  name: string;
  elevation: number;
  height: number;
  rooms: Room[];
  walls: Wall[];
  stairs: Stair[];
  outdoor: OutdoorElement[];
}

export interface SavedCamera {
  id: string;
  name: string;
  position: Vec3;
  target: Vec3;
}

export interface ReferenceImage {
  id: string;
  name: string;
  mimeType: string;
  role: "floor-plan" | "interior" | "exterior" | "material" | "cad" | "other";
  dataUrl?: string;
  notes?: string;
}

export interface GenerationSettings {
  units: Units;
  scale: "auto" | number;
  architectureType: "auto" | string;
  detailLevel: DetailLevel;
  realism: Realism;
  detectFurniture: boolean;
  lighting: "automatic" | LightingMode;
  confidenceThreshold: number;
  knownMeasurement?: { label: string; meters: number };
}

export interface SceneProjectMeta {
  name: string;
  units: "meters";
  architectureType: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SceneDocument {
  version: 1;
  project: SceneProjectMeta;
  settings: GenerationSettings;
  references: ReferenceImage[];
  materials: MaterialDef[];
  levels: Level[];
  cameras: SavedCamera[];
  spawn: Vec3;
  cad?: CadProjectMetadata;
}

export interface CadProjectMetadata {
  source: {
    type: "DWG" | "DXF" | "SVG";
    filename: string;
    units: string;
    version?: string;
    processedAt: string;
    originalPreserved: boolean;
  };
  analysis: {
    floors: number;
    rooms: number;
    doors: number;
    windows: number;
    furniture: number;
    confidence: number;
  };
  conversion: {
    cadUnits: string;
    sceneUnits: "meters";
    scaleToMeters: number;
  };
}

export interface StoredProject {
  id: string;
  name: string;
  thumbnail: string | null;
  scene: SceneDocument;
  createdAt: string;
  updatedAt: string;
}
