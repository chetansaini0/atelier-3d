import type { AnalysisRequest, AnalysisResult, VisionAnalyzer, VisionProvider } from "@/ai/VisionAnalyzer";
import { demoProvider } from "@/ai/providers/demo";
import { heuristicProvider } from "@/ai/providers/heuristic";

export class DefaultVisionAnalyzer implements VisionAnalyzer {
  constructor(private provider: VisionProvider) {}

  async analyzeImage(dataUrl: string) {
    return this.createSceneDescription({
      references: [{ id: "img", name: "image", mimeType: "image/jpeg", role: "other", dataUrl }],
      settings: defaultSettings(),
    });
  }

  detectRooms(dataUrl: string) {
    return this.analyzeImage(dataUrl);
  }
  detectWalls(dataUrl: string) {
    return this.analyzeImage(dataUrl);
  }
  detectDoors(dataUrl: string) {
    return this.analyzeImage(dataUrl);
  }
  detectWindows(dataUrl: string) {
    return this.analyzeImage(dataUrl);
  }
  detectFurniture(dataUrl: string) {
    return this.analyzeImage(dataUrl);
  }
  detectMaterials(dataUrl: string) {
    return this.analyzeImage(dataUrl);
  }
  estimateDimensions(dataUrl: string) {
    return this.analyzeImage(dataUrl);
  }

  createSceneDescription(request: AnalysisRequest): Promise<AnalysisResult> {
    return this.provider.analyze(request);
  }
}

export function defaultSettings() {
  return {
    units: "metric" as const,
    scale: "auto" as const,
    architectureType: "auto" as const,
    detailLevel: "high" as const,
    realism: "photorealistic" as const,
    detectFurniture: true,
    lighting: "automatic" as const,
    confidenceThreshold: 0.45,
  };
}

export function createClientAnalyzer(): DefaultVisionAnalyzer {
  return new DefaultVisionAnalyzer(heuristicProvider);
}

export function createServerAnalyzer(hasKey: boolean): DefaultVisionAnalyzer {
  return new DefaultVisionAnalyzer(hasKey ? demoProvider : demoProvider);
}

export { demoProvider, heuristicProvider };
