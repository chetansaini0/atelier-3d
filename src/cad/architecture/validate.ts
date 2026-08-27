import { classifyBlockName } from "@/cad/architecture/classify";
import { metersPerCadUnit } from "@/cad/units";
import type { ArchitecturalElements, CadAnalysisReport, CadDocument, CadWarning, ScaleWarning } from "@/cad/types";

export function buildCadReport(doc: CadDocument, elements: ArchitecturalElements): CadAnalysisReport {
  const warnings: CadWarning[] = [];
  const checks: string[] = [];
  const scale = metersPerCadUnit(doc.units);

  checks.push(`${elements.rooms.length} rooms detected`);
  checks.push(`${elements.doors.length} doors detected`);
  checks.push(`${elements.windows.length} windows detected`);
  checks.push(`${elements.furniture.length} furniture blocks detected`);
  checks.push(`${elements.levels.length} floors detected`);
  checks.push(`Units detected: ${doc.units}`);

  if (!elements.walls.length) warnings.push({ code: "open-wall", message: "No wall geometry could be reconstructed from parallel lines or wall layers." });
  if (elements.rooms.length && !elements.doors.length) {
    warnings.push({ code: "no-entrance", message: "1 or more rooms have no detected entrance." });
  }

  let unclassified = 0;
  for (const insert of doc.inserts) {
    if (!classifyBlockName(insert.block) && !classifyBlockName(insert.layer)) unclassified += 1;
  }
  if (unclassified) {
    warnings.push({
      code: "unclassified-block",
      message: `${unclassified} furniture blocks could not be classified.`,
    });
  }

  if (doc.unitsSource === "inferred") {
    warnings.push({ code: "units", message: "CAD units were inferred from drawing extents. Confirm the unit override if scale looks wrong." });
  }

  for (const room of elements.rooms) {
    if (room.polygon.length < 3) warnings.push({ code: "open-wall", message: `Room ${room.name} has an invalid polygon.` });
  }

  let confidence = 0.42;
  if (elements.walls.length >= 4) confidence += 0.18;
  if (elements.rooms.length) confidence += 0.12;
  if (elements.doors.length) confidence += 0.08;
  if (doc.unitsSource === "header") confidence += 0.08;
  if (doc.dimensions.length) confidence += 0.06;
  if (elements.furniture.length) confidence += 0.04;
  confidence = Math.max(0.2, Math.min(0.97, confidence - warnings.length * 0.03));

  return {
    rooms: elements.rooms.length,
    doors: elements.doors.length,
    windows: elements.windows.length,
    furniture: elements.furniture.length,
    floors: elements.levels.length,
    walls: elements.walls.length,
    units: doc.units,
    scaleToMeters: scale,
    confidence,
    warnings,
    checks,
  };
}

export function checkScale(elements: ArchitecturalElements): ScaleWarning {
  const door = elements.doors[0];
  const longest = elements.walls.reduce(
    (best, wall) => {
      const len = Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
      return len > best.len ? { len, wall } : best;
    },
    { len: 0, wall: elements.walls[0] },
  );
  const samples = [
    { label: "Door width", meters: door?.width ?? 0 },
    { label: "Wall length", meters: longest.len },
    { label: "Room height", meters: elements.walls[0]?.height ?? 3 },
  ].filter((s) => s.meters > 0);

  const unusual = samples.some((s) => {
    if (s.label === "Door width") return s.meters < 0.5 || s.meters > 2.4;
    if (s.label === "Wall length") return s.meters < 0.8 || s.meters > 80;
    return s.meters < 2 || s.meters > 6;
  });

  return {
    unusual,
    samples,
    message: unusual
      ? "The CAD file appears to contain unusually large or small dimensions. Confirm units before generating 3D."
      : "Scale looks consistent with architectural drawings.",
  };
}
