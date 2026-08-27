import type { SceneDocument } from "@/types/scene";

const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
const MAX_CAD_BYTES = 50 * 1024 * 1024;
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
]);

export function isCadFile(file: File): boolean {
  return /\.(dwg|dxf)$/i.test(file.name);
}

export function validateReferenceFile(file: File): string | null {
  if (/\.zip$/i.test(file.name)) return `${file.name}: ZIP reference bundles are coming soon.`;
  if (isCadFile(file)) {
    if (file.size > MAX_CAD_BYTES) return `${file.name} exceeds the 50 MB CAD limit.`;
    return null;
  }
  if (file.size > MAX_IMAGE_BYTES) return `${file.name} exceeds the 20 MB limit.`;
  if (!ALLOWED.has(file.type) && !/\.(png|jpe?g|webp|svg|pdf)$/i.test(file.name)) {
    return `${file.name} is not a supported reference type.`;
  }
  return null;
}

export function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsText(file);
  });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function sanitizeText(input: string, max = 4000): string {
  return input.replace(/[<>]/g, "").slice(0, max);
}

export function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  triggerDownload(blob, filename);
}

export function downloadText(filename: string, text: string, type = "text/plain") {
  triggerDownload(new Blob([text], { type }), filename);
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function sceneToSvg(scene: SceneDocument, levelId?: string): string {
  const level = scene.levels.find((l) => l.id === levelId) ?? scene.levels[0];
  let minX = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxZ = -Infinity;
  for (const wall of level.walls) {
    minX = Math.min(minX, wall.start.x, wall.end.x);
    minZ = Math.min(minZ, wall.start.z, wall.end.z);
    maxX = Math.max(maxX, wall.start.x, wall.end.x);
    maxZ = Math.max(maxZ, wall.start.z, wall.end.z);
  }
  const pad = 1;
  const w = (maxX - minX + pad * 2) * 40;
  const h = (maxZ - minZ + pad * 2) * 40;
  const tx = (v: number) => (v - minX + pad) * 40;
  const tz = (v: number) => (v - minZ + pad) * 40;
  const walls = level.walls
    .map(
      (wall) =>
        `<line x1="${tx(wall.start.x)}" y1="${tz(wall.start.z)}" x2="${tx(wall.end.x)}" y2="${tz(wall.end.z)}" stroke="${wall.exterior ? "#1a1916" : "#5c5346"}" stroke-width="${wall.exterior ? 5 : 3}" />`,
    )
    .join("\n");
  const labels = level.rooms
    .map((room) => {
      const x = room.polygon.reduce((s, p) => s + p.x, 0) / room.polygon.length;
      const z = room.polygon.reduce((s, p) => s + p.z, 0) / room.polygon.length;
      return `<text x="${tx(x)}" y="${tz(z)}" font-size="11" text-anchor="middle" fill="#3b342b">${room.name}</text>`;
    })
    .join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${walls}${labels}</svg>`;
}
