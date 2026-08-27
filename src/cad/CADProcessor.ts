import { parseDxf, isAsciiDxf, isBinaryDxf } from "@/cad/dxf/parseDxf";
import { validateDWG } from "@/cad/dwg/validateDwg";
import { applyLayerMap } from "@/cad/layers";
import { detectArchitecturalElements } from "@/cad/architecture/detect";
import { buildCadReport, checkScale } from "@/cad/architecture/validate";
import { cadDocumentToScene } from "@/cad/toScene";
import type { CadDocument, CadLayerCategory, CadProcessResult, CadUnits } from "@/cad/types";
import type { GenerationSettings, ReferenceImage, SceneDocument } from "@/types/scene";

export class CADProcessor {
  validateDWG(bytes: Uint8Array, filename: string) {
    return validateDWG(bytes, filename);
  }

  parseCAD(text: string, filename = "drawing.dxf"): CadDocument {
    if (!isAsciiDxf(text)) {
      throw new Error("Not an ASCII DXF. Export ASCII DXF from your CAD application.");
    }
    return parseDxf(text, filename);
  }

  extractLayers(doc: CadDocument) {
    return doc.layers;
  }

  extractGeometry(doc: CadDocument) {
    return { segments: doc.segments, polylines: doc.polylines, inserts: doc.inserts };
  }

  extractDimensions(doc: CadDocument) {
    return doc.dimensions;
  }

  detectUnits(doc: CadDocument) {
    return { units: doc.units, source: doc.unitsSource };
  }

  detectRooms(doc: CadDocument, units?: CadUnits) {
    return this.detectArchitecturalElements(doc, units).rooms;
  }

  detectArchitecturalElements(doc: CadDocument, units?: CadUnits, layerMap?: Record<string, CadLayerCategory>) {
    const mapped = layerMap ? { ...doc, layers: applyLayerMap(doc.layers, layerMap) } : doc;
    return detectArchitecturalElements(mapped, units);
  }

  generateSceneJSON(
    doc: CadDocument,
    options: {
      units?: CadUnits;
      layerMap?: Record<string, CadLayerCategory>;
      settings?: GenerationSettings;
      references?: ReferenceImage[];
      description?: string;
    } = {},
  ): { scene: SceneDocument; result: CadProcessResult } {
    const document = options.units ? { ...doc, units: options.units, unitsSource: "user" as const } : doc;
    const mapped = options.layerMap ? { ...document, layers: applyLayerMap(document.layers, options.layerMap) } : document;
    const elements = detectArchitecturalElements(mapped, mapped.units);
    const report = buildCadReport(mapped, elements);
    const scaleWarning = checkScale(elements);
    const scene = cadDocumentToScene(mapped, elements, {
      settings: options.settings,
      references: options.references,
      description: options.description,
      confidence: report.confidence,
    });
    return {
      scene,
      result: {
        status: "ok",
        message: "CAD geometry reconstructed. Review units and layers before entering the 3D environment.",
        document: mapped,
        elements,
        report,
        scaleWarning,
        sceneReady: true,
      },
    };
  }

  analyzeDocument(
    doc: CadDocument,
    options: { units?: CadUnits; layerMap?: Record<string, CadLayerCategory> } = {},
  ): CadProcessResult {
    const { result } = this.generateSceneJSON(doc, options);
    return result;
  }
}

export const cadProcessor = new CADProcessor();

export function inspectDxfBytes(bytes: Uint8Array, filename: string): CadProcessResult {
  if (isBinaryDxf(bytes)) {
    return {
      status: "error",
      message: "Binary DXF is not supported. Re-export as ASCII DXF.",
      sceneReady: false,
    };
  }
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (!isAsciiDxf(text)) {
    return {
      status: "error",
      message: "File is not a recognized ASCII DXF.",
      sceneReady: false,
    };
  }
  try {
    const doc = cadProcessor.parseCAD(text, filename);
    return cadProcessor.analyzeDocument(doc);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "DXF parse failed.",
      sceneReady: false,
    };
  }
}
