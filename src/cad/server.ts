import { inspectDxfBytes } from "@/cad/CADProcessor";
import { convertDwgToDxf } from "@/cad/dwg/convertDwg";
import { converterConfigured, validateDWG } from "@/cad/dwg/validateDwg";
import type { CadProcessResult } from "@/cad/types";

export async function processDwgUpload(bytes: Uint8Array, filename: string): Promise<CadProcessResult> {
  const check = validateDWG(bytes, filename);
  if (!check.ok) {
    return { status: "error", message: check.message, sceneReady: false };
  }
  if (!converterConfigured()) {
    return {
      status: "dxf-required",
      message:
        "Your DWG contains CAD information that can be reconstructed in 3D. Direct DWG processing is not configured on this server. Export an ASCII DXF from AutoCAD, BricsCAD, or LibreCAD, then upload that instead. Do not use an untrusted online converter.",
      sceneReady: false,
    };
  }
  const converted = await convertDwgToDxf(bytes, filename);
  if (!converted.dxf) {
    return {
      status: "dxf-required",
      message: converted.error ?? "DWG conversion failed. Upload an ASCII DXF instead.",
      sceneReady: false,
    };
  }
  const result = inspectDxfBytes(new TextEncoder().encode(converted.dxf), filename.replace(/\.dwg$/i, ".dxf"));
  if (result.document) result.document.format = "DWG";
  return result;
}
