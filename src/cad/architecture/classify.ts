import type { FurnitureType } from "@/types/scene";

const ROOM_LABELS: { type: string; name: string; pattern: RegExp }[] = [
  { type: "bedroom", name: "Bedroom", pattern: /\b(bed\s*room|master|br\d*)\b/i },
  { type: "kitchen", name: "Kitchen", pattern: /\b(kitchen|kit)\b/i },
  { type: "bathroom", name: "Bathroom", pattern: /\b(bath|toilet|wc|restroom|lavatory)\b/i },
  { type: "living", name: "Living Room", pattern: /\b(living|lounge|family)\b/i },
  { type: "dining", name: "Dining Room", pattern: /\b(dining|dinning)\b/i },
  { type: "office", name: "Office", pattern: /\b(office|study)\b/i },
  { type: "store", name: "Store Room", pattern: /\b(store|storage|pantry)\b/i },
  { type: "lobby", name: "Lobby", pattern: /\b(lobby|foyer|entrance|entry)\b/i },
  { type: "corridor", name: "Corridor", pattern: /\b(corridor|hall|passage)\b/i },
  { type: "balcony", name: "Balcony", pattern: /\b(balcony)\b/i },
  { type: "terrace", name: "Terrace", pattern: /\b(terrace|roof)\b/i },
  { type: "garage", name: "Garage", pattern: /\b(garage|parking)\b/i },
];

const BLOCK_TYPES: { type: FurnitureType | "door" | "window" | "stair" | "tree"; pattern: RegExp }[] = [
  { type: "door", pattern: /\b(door|dr_|porte)\b/i },
  { type: "window", pattern: /\b(win|window|wnd)\b/i },
  { type: "toilet", pattern: /\b(wc|toilet|closet)\b/i },
  { type: "basin", pattern: /\b(basin|lav|wash)\b/i },
  { type: "shower", pattern: /\b(shower)\b/i },
  { type: "bathtub", pattern: /\b(tub|bath)\b/i },
  { type: "sink", pattern: /\b(sink)\b/i },
  { type: "fridge", pattern: /\b(fridge|refrig)\b/i },
  { type: "stove", pattern: /\b(stove|cook|hob)\b/i },
  { type: "bed", pattern: /\b(bed)\b/i },
  { type: "sofa", pattern: /\b(sofa|couch)\b/i },
  { type: "dining-table", pattern: /\b(table|tbl)\b/i },
  { type: "dining-chair", pattern: /\b(chair)\b/i },
  { type: "wardrobe", pattern: /\b(ward|closet|cupboard)\b/i },
  { type: "tree", pattern: /\b(tree|plant)\b/i },
  { type: "floor-lamp", pattern: /\b(lamp|light)\b/i },
  { type: "stair", pattern: /\b(stair)\b/i },
];

export function classifyRoomLabel(text: string): { type: string; name: string } | null {
  const clean = text.replace(/[{}\\]/g, " ").trim();
  for (const item of ROOM_LABELS) {
    if (item.pattern.test(clean)) return { type: item.type, name: titleCase(clean) || item.name };
  }
  return null;
}

export function classifyBlockName(name: string): FurnitureType | "door" | "window" | "stair" | "tree" | null {
  const n = name.replace(/[_-]+/g, " ");
  for (const item of BLOCK_TYPES) {
    if (item.pattern.test(n) || item.pattern.test(name)) return item.type;
  }
  return null;
}

export function furnitureSize(type: string): { width: number; depth: number; height: number } {
  const map: Record<string, { width: number; depth: number; height: number }> = {
    sofa: { width: 2.2, depth: 0.9, height: 0.85 },
    bed: { width: 1.6, depth: 2.05, height: 0.95 },
    "dining-table": { width: 1.8, depth: 0.9, height: 0.76 },
    "dining-chair": { width: 0.46, depth: 0.5, height: 0.95 },
    toilet: { width: 0.4, depth: 0.65, height: 0.78 },
    basin: { width: 0.65, depth: 0.45, height: 0.85 },
    shower: { width: 1.1, depth: 1.1, height: 2.2 },
    fridge: { width: 0.7, depth: 0.7, height: 1.85 },
    stove: { width: 0.6, depth: 0.55, height: 0.9 },
    sink: { width: 0.7, depth: 0.45, height: 0.9 },
    wardrobe: { width: 1.6, depth: 0.58, height: 2.2 },
    tree: { width: 2, depth: 2, height: 5 },
    "floor-lamp": { width: 0.4, depth: 0.4, height: 1.65 },
  };
  return map[type] ?? { width: 0.8, depth: 0.8, height: 0.9 };
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}
