import type { NextRequest } from "next/server";
import { demoProvider } from "@/ai/providers/demo";
import { createSafeOpenAIProvider } from "@/ai/providers/openai";
import { sanitizeText } from "@/utils/files";
import type { AnalysisRequest } from "@/ai/VisionAnalyzer";
import { sceneDocumentSchema } from "@/scene/SceneSchema";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_JSON = 25 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentLength = Number(req.headers.get("content-length") ?? 0);
    if (contentLength > MAX_JSON) {
      return Response.json({ error: "Payload too large" }, { status: 413 });
    }

    const body = (await req.json()) as AnalysisRequest;
    if (!body?.settings) {
      return Response.json({ error: "Missing settings" }, { status: 400 });
    }

    body.description = body.description ? sanitizeText(body.description) : undefined;
    body.references = (body.references ?? []).slice(0, 8).map((ref) => ({
      ...ref,
      name: sanitizeText(ref.name, 120),
      notes: ref.notes ? sanitizeText(ref.notes, 500) : undefined,
    }));

    const hasKey = Boolean(process.env.OPENAI_API_KEY);
    const provider = hasKey ? createSafeOpenAIProvider() : demoProvider;
    const result = await provider.analyze(body);

    const parsed = sceneDocumentSchema.safeParse(result.scene);
    if (!parsed.success) {
      const fallback = await demoProvider.analyze(body);
      return Response.json({
        ...fallback,
        warnings: [...(result.warnings ?? []), "AI scene JSON failed validation. Loaded the demo environment."],
      });
    }

    return Response.json(result);
  } catch (error) {
    const fallback = await demoProvider.analyze({
      references: [],
      settings: {
        units: "metric",
        scale: "auto",
        architectureType: "auto",
        detailLevel: "high",
        realism: "photorealistic",
        detectFurniture: true,
        lighting: "automatic",
        confidenceThreshold: 0.45,
      },
    });
    return Response.json({
      ...fallback,
      warnings: [error instanceof Error ? error.message : "Analysis failed", ...fallback.warnings],
    });
  }
}
