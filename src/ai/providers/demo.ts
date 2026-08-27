import type { AnalysisProgress, AnalysisRequest, AnalysisResult, VisionProvider } from "@/ai/VisionAnalyzer";
import { createDemoVillaScene } from "@/data/demoVilla";

const STAGES = [
  "Analyzing reference",
  "Detecting architecture",
  "Understanding rooms",
  "Generating walls",
  "Generating furniture",
  "Applying materials",
  "Preparing lighting",
  "Optimizing scene",
];

export async function runProgress(onProgress?: (p: AnalysisProgress) => void, duration = 2400) {
  const step = duration / STAGES.length;
  for (let i = 0; i < STAGES.length; i += 1) {
    onProgress?.({ stage: STAGES[i], percent: Math.round(((i + 0.55) / STAGES.length) * 100), done: false });
    await wait(step);
  }
  onProgress?.({ stage: "Ready", percent: 100, done: true });
}

function wait(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const demoProvider: VisionProvider = {
  id: "demo",
  async analyze(request, onProgress) {
    await runProgress(onProgress, 2200);
    const scene = createDemoVillaScene();
    scene.references = request.references.length ? request.references : scene.references;
    scene.settings = { ...scene.settings, ...request.settings };
    if (request.description) scene.project.description = request.description;
    return {
      scene,
      provider: "demo",
      usedFallback: true,
      warnings: [
        "No vision API key is configured. Loaded the Modern Villa demonstration environment.",
        "Connect OPENAI_API_KEY to reconstruct geometry from your references.",
      ],
    };
  },
};
