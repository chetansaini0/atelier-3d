import type { NextRequest } from "next/server";
import { inspectDxfBytes } from "@/cad/CADProcessor";
import { processDwgUpload } from "@/cad/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") ?? "";
    if (!contentType.includes("multipart/form-data")) {
      return Response.json({ status: "error", message: "Expected multipart CAD upload.", sceneReady: false }, { status: 400 });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return Response.json({ status: "error", message: "Missing CAD file.", sceneReady: false }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return Response.json({ status: "error", message: "CAD file exceeds the 50 MB limit.", sceneReady: false }, { status: 413 });
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const name = file.name || "upload";

    if (/\.dwg$/i.test(name)) {
      const result = await processDwgUpload(bytes, name);
      const status = result.status === "error" ? 400 : 200;
      return Response.json(sanitize(result), { status });
    }

    if (/\.dxf$/i.test(name)) {
      const result = inspectDxfBytes(bytes, name);
      const status = result.status === "error" ? 400 : 200;
      return Response.json(sanitize(result), { status });
    }

    return Response.json({ status: "error", message: "Upload a .dwg or .dxf file.", sceneReady: false }, { status: 400 });
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: error instanceof Error ? error.message : "CAD processing failed.",
        sceneReady: false,
      },
      { status: 500 },
    );
  }
}

function sanitize(result: ReturnType<typeof inspectDxfBytes>) {
  if (!result.document) return result;
  const { blocks: _blocks, ...document } = result.document;
  return {
    ...result,
    document: {
      ...document,
      segments: document.segments.slice(0, 8000),
      polylines: document.polylines.slice(0, 2000),
      inserts: document.inserts.slice(0, 2000),
      texts: document.texts.slice(0, 2000),
    },
  };
}
