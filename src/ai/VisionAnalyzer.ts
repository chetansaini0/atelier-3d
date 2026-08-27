import type { GenerationSettings, ReferenceImage, SceneDocument } from "@/types/scene";

export interface AnalysisProgress {
  stage: string;
  percent: number;
  done: boolean;
}

export interface AnalysisRequest {
  references: ReferenceImage[];
  settings: GenerationSettings;
  description?: string;
}

export interface AnalysisResult {
  scene: SceneDocument;
  provider: string;
  warnings: string[];
  usedFallback: boolean;
}

export interface VisionProvider {
  id: string;
  analyze(request: AnalysisRequest, onProgress?: (p: AnalysisProgress) => void): Promise<AnalysisResult>;
}

export interface VisionAnalyzer {
  analyzeImage(dataUrl: string): Promise<unknown>;
  detectRooms(dataUrl: string): Promise<unknown>;
  detectWalls(dataUrl: string): Promise<unknown>;
  detectDoors(dataUrl: string): Promise<unknown>;
  detectWindows(dataUrl: string): Promise<unknown>;
  detectFurniture(dataUrl: string): Promise<unknown>;
  detectMaterials(dataUrl: string): Promise<unknown>;
  estimateDimensions(dataUrl: string): Promise<unknown>;
  createSceneDescription(request: AnalysisRequest): Promise<AnalysisResult>;
}
