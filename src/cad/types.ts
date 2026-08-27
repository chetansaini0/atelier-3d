export type CadUnits =
  | "unitless"
  | "millimeters"
  | "centimeters"
  | "meters"
  | "inches"
  | "feet"
  | "yards";

export type CadLayerCategory =
  | "wall"
  | "door"
  | "window"
  | "furniture"
  | "floor"
  | "ceiling"
  | "column"
  | "beam"
  | "stair"
  | "railing"
  | "annotation"
  | "dimension"
  | "electrical"
  | "plumbing"
  | "landscape"
  | "hatch"
  | "unknown";

export const LAYER_CATEGORIES: CadLayerCategory[] = [
  "wall",
  "door",
  "window",
  "furniture",
  "floor",
  "ceiling",
  "column",
  "beam",
  "stair",
  "railing",
  "annotation",
  "dimension",
  "electrical",
  "plumbing",
  "landscape",
  "hatch",
  "unknown",
];

export interface CadLayer {
  name: string;
  category: CadLayerCategory;
  color: string;
  lineType: string;
  visible: boolean;
}

export type CadEntityType =
  | "LINE"
  | "POLYLINE"
  | "LWPOLYLINE"
  | "ARC"
  | "CIRCLE"
  | "ELLIPSE"
  | "SPLINE"
  | "INSERT"
  | "TEXT"
  | "MTEXT"
  | "DIMENSION"
  | "3DFACE"
  | "SOLID"
  | "MESH";

export interface CadPoint {
  x: number;
  y: number;
  z: number;
}

export interface CadSegment {
  id: string;
  layer: string;
  start: CadPoint;
  end: CadPoint;
  width: number;
  entityType: CadEntityType;
}

export interface CadPolyline {
  id: string;
  layer: string;
  points: CadPoint[];
  closed: boolean;
  elevation: number;
  entityType: CadEntityType;
}

export interface CadInsert {
  id: string;
  layer: string;
  block: string;
  position: CadPoint;
  rotation: number;
  scale: CadPoint;
}

export interface CadText {
  id: string;
  layer: string;
  value: string;
  position: CadPoint;
  height: number;
}

export interface CadDimension {
  id: string;
  layer: string;
  text: string;
  measurement?: number;
  start?: CadPoint;
  end?: CadPoint;
}

export interface CadBlock {
  name: string;
  segments: CadSegment[];
  polylines: CadPolyline[];
}

export interface CadDocument {
  filename: string;
  format: "DXF" | "DWG";
  version?: string;
  units: CadUnits;
  unitsSource: "header" | "inferred" | "user";
  layers: CadLayer[];
  segments: CadSegment[];
  polylines: CadPolyline[];
  inserts: CadInsert[];
  texts: CadText[];
  dimensions: CadDimension[];
  blocks: CadBlock[];
  extents: { min: CadPoint; max: CadPoint };
}

export interface CadRoomCandidate {
  id: string;
  name: string;
  type: string;
  polygon: { x: number; z: number }[];
  elevation: number;
  labelSource?: string;
}

export interface ArchitecturalElements {
  walls: {
    start: { x: number; z: number };
    end: { x: number; z: number };
    thickness: number;
    height: number;
    elevation: number;
    layer: string;
    entityId: string;
    exterior: boolean;
  }[];
  doors: {
    position: { x: number; z: number };
    width: number;
    height: number;
    rotation: number;
    hinge: "left" | "right";
    style: "single" | "sliding";
    layer: string;
    entityId: string;
    block?: string;
  }[];
  windows: {
    position: { x: number; z: number };
    width: number;
    height: number;
    sill: number;
    rotation: number;
    layer: string;
    entityId: string;
    block?: string;
  }[];
  furniture: {
    name: string;
    type: string;
    position: { x: number; y: number; z: number };
    rotation: number;
    dimensions: { width: number; depth: number; height: number };
    layer: string;
    block: string;
    insertId: string;
  }[];
  stairs: {
    origin: { x: number; y: number; z: number };
    rotation: number;
    width: number;
    run: number;
    rise: number;
    steps: number;
    layer: string;
  }[];
  rooms: CadRoomCandidate[];
  levels: { name: string; elevation: number }[];
}

export interface CadWarning {
  code: "open-wall" | "no-entrance" | "unclassified-block" | "scale" | "units" | "overlap" | "floating" | "dxf-required" | "binary-dxf";
  message: string;
}

export interface CadAnalysisReport {
  rooms: number;
  doors: number;
  windows: number;
  furniture: number;
  floors: number;
  walls: number;
  units: CadUnits;
  scaleToMeters: number;
  confidence: number;
  warnings: CadWarning[];
  checks: string[];
}

export interface ScaleWarning {
  unusual: boolean;
  samples: { label: string; meters: number }[];
  message: string;
}

export interface CadProcessResult {
  status: "ok" | "dxf-required" | "error";
  message: string;
  document?: CadDocument;
  elements?: ArchitecturalElements;
  report?: CadAnalysisReport;
  scaleWarning?: ScaleWarning;
  sceneReady: boolean;
}
