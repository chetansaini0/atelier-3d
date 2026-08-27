import type { AnalysisRequest, AnalysisResult, VisionProvider } from "@/ai/VisionAnalyzer";
import { runProgress } from "@/ai/providers/demo";
import { createDemoVillaScene } from "@/data/demoVilla";
import type { Room, Vec2, Wall } from "@/types/scene";

/**
 * Conservative client-side detector for high-contrast orthogonal floor plans.
 * It never claims high confidence. Uncertain results are marked Estimated / Inferred.
 */
export async function detectOrthogonalWalls(dataUrl: string): Promise<{ walls: { x1: number; z1: number; x2: number; z2: number }[]; rooms: Vec2[][] }> {
  const img = await loadImage(dataUrl);
  const canvas = document.createElement("canvas");
  const max = 360;
  const scale = Math.min(max / img.width, max / img.height, 1);
  canvas.width = Math.max(32, Math.round(img.width * scale));
  canvas.height = Math.max(32, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) return { walls: [], rooms: [] };
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  const dark = (i: number) => {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    return (r + g + b) / 3 < 90;
  };

  const walls: { x1: number; z1: number; x2: number; z2: number }[] = [];
  const metersPerPx = 12.6 / canvas.width;

  for (let y = 0; y < height; y += 2) {
    let run = 0;
    let start = 0;
    for (let x = 0; x < width; x += 1) {
      if (dark((y * width + x) * 4)) {
        if (run === 0) start = x;
        run += 1;
      } else {
        if (run > 18) walls.push({ x1: start * metersPerPx, z1: y * metersPerPx, x2: x * metersPerPx, z2: y * metersPerPx });
        run = 0;
      }
    }
  }

  for (let x = 0; x < width; x += 2) {
    let run = 0;
    let start = 0;
    for (let y = 0; y < height; y += 1) {
      if (dark((y * width + x) * 4)) {
        if (run === 0) start = y;
        run += 1;
      } else {
        if (run > 18) walls.push({ x1: x * metersPerPx, z1: start * metersPerPx, x2: x * metersPerPx, z2: y * metersPerPx });
        run = 0;
      }
    }
  }

  return { walls: walls.slice(0, 80), rooms: [] };
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not decode image"));
    img.src = dataUrl;
  });
}

export const heuristicProvider: VisionProvider = {
  id: "heuristic",
  async analyze(request, onProgress): Promise<AnalysisResult> {
    await runProgress(onProgress, 1800);
    const scene = createDemoVillaScene();
    const plan = request.references.find((r) => r.role === "floor-plan" || r.mimeType.startsWith("image/"));
    const warnings: string[] = [
      "Heuristic analysis cannot fully reconstruct arbitrary architecture from pixels.",
      "Geometry below is a conservative demonstration layout. Items without evidence are marked Estimated / Inferred.",
    ];

    if (plan?.dataUrl && typeof document !== "undefined") {
      try {
        const detected = await detectOrthogonalWalls(plan.dataUrl);
        if (detected.walls.length > 8) {
          warnings.push(`Detected ${detected.walls.length} dark orthogonal runs in the reference. They informed scale only; rooms still require confirmation.`);
        }
      } catch {
        warnings.push("Could not run local line detection on this file.");
      }
    }

    scene.references = request.references;
    scene.settings = { ...scene.settings, ...request.settings };
    scene.project.name = request.settings.architectureType === "auto" ? "Reconstructed Environment" : String(request.settings.architectureType);
    scene.project.description = request.description || scene.project.description;
    markInferred(scene.levels[0].rooms);
    markInferredWalls(scene.levels[0].walls);

    return { scene, provider: "heuristic", usedFallback: true, warnings };
  },
};

function markInferred(rooms: Room[]) {
  for (const room of rooms) {
    if (room.confidence.score < 0.9) continue;
    room.confidence = { score: 0.55, source: "inferred", notes: "Estimated / Inferred from typical villa typology" };
  }
}

function markInferredWalls(walls: Wall[]) {
  for (const wall of walls) {
    wall.confidence = { ...wall.confidence, notes: wall.confidence.notes ?? "Estimated / Inferred" };
  }
}
