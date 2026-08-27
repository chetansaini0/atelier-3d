import { generateObject } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { sceneDocumentSchema, validateSceneDocument } from "@/scene/SceneSchema";
import type { AnalysisRequest, AnalysisResult, VisionProvider } from "@/ai/VisionAnalyzer";
import { createDemoVillaScene } from "@/data/demoVilla";

const SYSTEM = `You are an architectural reconstruction engine.
Convert floor plans, interiors, and design references into a Scene JSON document.
Rules:
- 1 unit = 1 meter.
- Preserve room positions, proportions, doors, windows, and furniture when visible.
- Never arbitrarily redesign the layout.
- If something cannot be determined, still include it only if necessary for a walkable building, and set confidence.source to "estimated" or "inferred" with notes "Estimated / Inferred".
- Do not invent luxury furniture that is not evidenced.
- Output must match the provided schema exactly. version must be 1.
- Include at least one level with rooms, walls with openings, and spawn inside the entrance.
- Wall coordinates must form a closed building.
- Furniture types must be from the allowed set.`;

export function createOpenAIProvider(): VisionProvider {
  return {
    id: "openai",
    async analyze(request): Promise<AnalysisResult> {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY is not configured");
      }

      const openai = createOpenAI({ apiKey });
      const modelName = process.env.OPENAI_VISION_MODEL || "gpt-4o";
      const images = request.references.filter((r) => r.dataUrl).slice(0, 6);

      const result = await generateObject({
        model: openai(modelName),
        schema: sceneDocumentSchema,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `${SYSTEM}

Settings: ${JSON.stringify(request.settings)}
Description: ${request.description ?? "none"}
Known measurement: ${JSON.stringify(request.settings.knownMeasurement ?? null)}

Return a complete Scene JSON reconstruction.`,
              },
              ...images.map((img) => ({
                type: "image" as const,
                image: img.dataUrl!,
              })),
            ],
          },
        ],
      });

      const scene = validateSceneDocument(result.object);
      scene.references = request.references.map(({ dataUrl: _d, ...rest }) => rest);
      scene.settings = { ...scene.settings, ...request.settings };

      return {
        scene,
        provider: "openai",
        usedFallback: false,
        warnings: [],
      };
    },
  };
}

export function createSafeOpenAIProvider(): VisionProvider {
  return {
    id: "openai",
    async analyze(request, onProgress) {
      try {
        const inner = createOpenAIProvider();
        onProgress?.({ stage: "Analyzing reference", percent: 15, done: false });
        const result = await inner.analyze(request, onProgress);
        onProgress?.({ stage: "Ready", percent: 100, done: true });
        return result;
      } catch (error) {
        const scene = createDemoVillaScene();
        scene.references = request.references;
        return {
          scene,
          provider: "openai-fallback",
          usedFallback: true,
          warnings: [
            error instanceof Error ? error.message : "Vision analysis failed",
            "Loaded the demonstration villa so you can continue exploring.",
          ],
        };
      }
    },
  };
}
