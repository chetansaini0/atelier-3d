const DWG_MAGIC = /^AC10(1[4-9]|2[0-7])/;

export function validateDWG(bytes: Uint8Array, filename: string): { ok: boolean; version?: string; message: string } {
  if (!filename.toLowerCase().endsWith(".dwg")) {
    return { ok: false, message: "File extension is not .dwg." };
  }
  if (bytes.length < 6) {
    return { ok: false, message: "File is too small to be a DWG drawing." };
  }
  const header = String.fromCharCode(...bytes.slice(0, 6));
  if (!header.startsWith("AC10")) {
    return { ok: false, message: "Not a recognized DWG file (missing AutoCAD AC10 header)." };
  }
  return {
    ok: true,
    version: header,
    message: DWG_MAGIC.test(header)
      ? `Valid DWG header ${header}.`
      : `DWG header ${header} recognized. Conversion still required for geometry.`,
  };
}

export function converterConfigured(): boolean {
  return Boolean(process.env.CAD_CONVERTER_CMD);
}
