import { spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TIMEOUT_MS = 25_000;

export async function convertDwgToDxf(bytes: Uint8Array, filename: string): Promise<{ dxf?: string; error: string | null }> {
  const cmd = process.env.CAD_CONVERTER_CMD;
  if (!cmd) {
    return {
      dxf: undefined,
      error:
        "Direct DWG processing is not configured. Export an ASCII DXF from AutoCAD, BricsCAD, or LibreCAD, or set CAD_CONVERTER_CMD to a licensed converter (for example ODA File Converter).",
    };
  }

  const dir = await mkdtemp(join(/* turbopackIgnore: true */ tmpdir(), "atelier-cad-"));
  const safeName = filename.replace(/[^\w.-]/g, "_") || "input.dwg";
  const input = join(/* turbopackIgnore: true */ dir, safeName);
  const output = join(/* turbopackIgnore: true */ dir, "out.dxf");
  try {
    await writeFile(input, bytes);
    await runConverter(cmd, input, output);
    const dxf = await readFile(output, "utf8");
    return { dxf, error: null };
  } catch (error) {
    return {
      dxf: undefined,
      error: error instanceof Error ? error.message : "DWG conversion failed.",
    };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => undefined);
  }
}

function runConverter(command: string, input: string, output: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, [input, output], { windowsHide: true, timeout: TIMEOUT_MS });
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error("DWG conversion timed out."));
    }, TIMEOUT_MS);
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("exit", (code) => {
      clearTimeout(timer);
      if (code === 0) resolve();
      else reject(new Error(`CAD converter exited with code ${code}.`));
    });
  });
}
