import { createId } from "@/utils/ids";
import { makeLayer } from "@/cad/layers";
import { inferUnitsFromExtents, unitsFromInsunits } from "@/cad/units";
import type {
  CadBlock,
  CadDimension,
  CadDocument,
  CadInsert,
  CadLayer,
  CadPoint,
  CadPolyline,
  CadSegment,
  CadText,
} from "@/cad/types";

export function isAsciiDxf(text: string): boolean {
  const head = text.slice(0, 200).replace(/^\uFEFF/, "");
  return /^\s*0\s+SECTION/i.test(head) || /^\s*999\s+/i.test(head);
}

export function isBinaryDxf(bytes: Uint8Array): boolean {
  const sig = "AutoCAD Binary DXF";
  const slice = String.fromCharCode(...bytes.slice(0, sig.length));
  return slice.startsWith("AutoCAD Binary DXF");
}

export function parseDxf(text: string, filename = "drawing.dxf"): CadDocument {
  const pairs = readPairs(text);
  const version = headerString(pairs, "$ACADVER");
  const insunits = headerInt(pairs, "$INSUNITS");
  const layers = parseLayers(pairs);
  const blocks = parseBlocks(pairs);
  const entityPairs = sectionPairs(pairs, "ENTITIES");
  const parsed = parseEntities(entityPairs, layers);

  const allX = [
    ...parsed.segments.flatMap((s) => [s.start.x, s.end.x]),
    ...parsed.polylines.flatMap((p) => p.points.map((pt) => pt.x)),
    ...parsed.inserts.map((i) => i.position.x),
  ];
  const allY = [
    ...parsed.segments.flatMap((s) => [s.start.y, s.end.y]),
    ...parsed.polylines.flatMap((p) => p.points.map((pt) => pt.y)),
    ...parsed.inserts.map((i) => i.position.y),
  ];
  const allZ = [
    ...parsed.segments.flatMap((s) => [s.start.z, s.end.z]),
    ...parsed.polylines.flatMap((p) => p.points.map((pt) => pt.z)),
  ];
  const minX = Math.min(...allX, 0);
  const minY = Math.min(...allY, 0);
  const minZ = Math.min(...allZ, 0);
  const maxX = Math.max(...allX, 1);
  const maxY = Math.max(...allY, 1);
  const maxZ = Math.max(...allZ, 0);
  const maxAbs = Math.max(Math.abs(maxX - minX), Math.abs(maxY - minY));

  const headerUnits = unitsFromInsunits(insunits ?? 0);
  const units = headerUnits === "unitless" ? inferUnitsFromExtents(maxAbs) : headerUnits;

  const layerMap = new Map(layers.map((l) => [l.name, l]));
  for (const name of new Set([...parsed.segments, ...parsed.polylines, ...parsed.inserts, ...parsed.texts].map((e) => e.layer))) {
    if (!layerMap.has(name)) {
      const layer = makeLayer(name);
      layers.push(layer);
      layerMap.set(name, layer);
    }
  }

  return {
    filename,
    format: "DXF",
    version,
    units,
    unitsSource: headerUnits === "unitless" ? "inferred" : "header",
    layers,
    ...parsed,
    blocks,
    extents: {
      min: { x: minX, y: minY, z: minZ },
      max: { x: maxX, y: maxY, z: maxZ },
    },
  };
}

function readPairs(text: string): { code: number; value: string }[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const pairs: { code: number; value: string }[] = [];
  for (let i = 0; i < lines.length - 1; i += 2) {
    const code = Number(lines[i].trim());
    if (Number.isNaN(code)) {
      i -= 1;
      continue;
    }
    pairs.push({ code, value: lines[i + 1] ?? "" });
  }
  return pairs;
}

function headerInt(pairs: { code: number; value: string }[], name: string): number | undefined {
  const header = sectionPairs(pairs, "HEADER");
  for (let i = 0; i < header.length; i += 1) {
    if (header[i].code === 9 && header[i].value.trim() === name) {
      const next = header[i + 1];
      if (next) return Number(next.value);
    }
  }
  return undefined;
}

function headerString(pairs: { code: number; value: string }[], name: string): string | undefined {
  const header = sectionPairs(pairs, "HEADER");
  for (let i = 0; i < header.length; i += 1) {
    if (header[i].code === 9 && header[i].value.trim() === name) {
      return header[i + 1]?.value.trim();
    }
  }
  return undefined;
}

function sectionPairs(pairs: { code: number; value: string }[], name: string) {
  const out: { code: number; value: string }[] = [];
  let inSection = false;
  for (let i = 0; i < pairs.length; i += 1) {
    const p = pairs[i];
    if (p.code === 0 && p.value.trim() === "SECTION" && pairs[i + 1]?.code === 2 && pairs[i + 1].value.trim() === name) {
      inSection = true;
      i += 1;
      continue;
    }
    if (inSection && p.code === 0 && p.value.trim() === "ENDSEC") break;
    if (inSection) out.push(p);
  }
  return out;
}

function parseLayers(pairs: { code: number; value: string }[]): CadLayer[] {
  const tables = sectionPairs(pairs, "TABLES");
  const layers: CadLayer[] = [];
  let current: { name?: string; color?: number; lineType?: string } | null = null;
  let inLayerTable = false;
  for (let i = 0; i < tables.length; i += 1) {
    const p = tables[i];
    if (p.code === 0 && p.value.trim() === "TABLE" && tables[i + 1]?.value.trim() === "LAYER") inLayerTable = true;
    if (p.code === 0 && p.value.trim() === "ENDTAB") inLayerTable = false;
    if (!inLayerTable) continue;
    if (p.code === 0 && p.value.trim() === "LAYER") {
      if (current?.name) layers.push(makeLayer(current.name, current.color, current.lineType));
      current = {};
    }
    if (!current) continue;
    if (p.code === 2) current.name = p.value.trim();
    if (p.code === 62) current.color = Number(p.value);
    if (p.code === 6) current.lineType = p.value.trim();
  }
  if (current?.name) layers.push(makeLayer(current.name, current.color, current.lineType));
  return layers;
}

function parseBlocks(pairs: { code: number; value: string }[]): CadBlock[] {
  const blockPairs = sectionPairs(pairs, "BLOCKS");
  const blocks: CadBlock[] = [];
  let name = "";
  let buffer: { code: number; value: string }[] = [];
  const flush = () => {
    if (!name || name.startsWith("*")) {
      buffer = [];
      return;
    }
    const parsed = parseEntities(buffer, []);
    blocks.push({ name, segments: parsed.segments, polylines: parsed.polylines });
    buffer = [];
  };
  for (const p of blockPairs) {
    if (p.code === 0 && p.value.trim() === "BLOCK") {
      flush();
      name = "";
      continue;
    }
    if (p.code === 2 && !name) {
      name = p.value.trim();
      continue;
    }
    if (p.code === 0 && p.value.trim() === "ENDBLK") {
      flush();
      name = "";
      continue;
    }
    if (name) buffer.push(p);
  }
  return blocks;
}

function parseEntities(pairs: { code: number; value: string }[], _layers: CadLayer[]) {
  const segments: CadSegment[] = [];
  const polylines: CadPolyline[] = [];
  const inserts: CadInsert[] = [];
  const texts: CadText[] = [];
  const dimensions: CadDimension[] = [];

  let i = 0;
  while (i < pairs.length) {
    const p = pairs[i];
    if (p.code !== 0) {
      i += 1;
      continue;
    }
    const type = p.value.trim();
    const { fields, next } = collectEntity(pairs, i + 1);
    i = next;
    const layer = fields.get("8") ?? "0";
    const id = createId("ent");

    if (type === "LINE") {
      segments.push({
        id,
        layer,
        entityType: "LINE",
        width: Number(fields.get("39") ?? 0),
        start: pt(fields, "10", "20", "30"),
        end: pt(fields, "11", "21", "31"),
      });
    } else if (type === "LWPOLYLINE") {
      const pts = verticesFromLw(fields);
      const closed = (Number(fields.get("70") ?? 0) & 1) === 1;
      const elevation = Number(fields.get("38") ?? 0);
      polylines.push({ id, layer, points: pts, closed, elevation, entityType: "LWPOLYLINE" });
      addPolylineSegments(segments, id, layer, pts, closed, "LWPOLYLINE");
    } else if (type === "POLYLINE") {
      const verts: CadPoint[] = [];
      let j = i;
      let closed = (Number(fields.get("70") ?? 0) & 1) === 1;
      while (j < pairs.length) {
        if (pairs[j].code === 0 && pairs[j].value.trim() === "SEQEND") {
          j = collectEntity(pairs, j + 1).next;
          break;
        }
        if (pairs[j].code === 0 && pairs[j].value.trim() === "VERTEX") {
          const v = collectEntity(pairs, j + 1);
          verts.push(pt(v.fields, "10", "20", "30"));
          j = v.next;
          continue;
        }
        j += 1;
      }
      i = j;
      polylines.push({ id, layer, points: verts, closed, elevation: verts[0]?.z ?? 0, entityType: "POLYLINE" });
      addPolylineSegments(segments, id, layer, verts, closed, "POLYLINE");
    } else if (type === "ARC") {
      const c = pt(fields, "10", "20", "30");
      const r = Number(fields.get("40") ?? 0);
      const a0 = ((Number(fields.get("50") ?? 0)) * Math.PI) / 180;
      const a1 = ((Number(fields.get("51") ?? 0)) * Math.PI) / 180;
      const pts = sampleArc(c, r, a0, a1);
      polylines.push({ id, layer, points: pts, closed: false, elevation: c.z, entityType: "ARC" });
      addPolylineSegments(segments, id, layer, pts, false, "ARC");
    } else if (type === "CIRCLE") {
      const c = pt(fields, "10", "20", "30");
      const r = Number(fields.get("40") ?? 0);
      const pts = sampleArc(c, r, 0, Math.PI * 2 - 0.01);
      polylines.push({ id, layer, points: pts, closed: true, elevation: c.z, entityType: "CIRCLE" });
    } else if (type === "INSERT") {
      inserts.push({
        id,
        layer,
        block: fields.get("2") ?? "UNKNOWN",
        position: pt(fields, "10", "20", "30"),
        rotation: ((Number(fields.get("50") ?? 0)) * Math.PI) / 180,
        scale: {
          x: Number(fields.get("41") ?? 1),
          y: Number(fields.get("42") ?? 1),
          z: Number(fields.get("43") ?? 1),
        },
      });
    } else if (type === "TEXT") {
      texts.push({
        id,
        layer,
        value: fields.get("1") ?? "",
        position: pt(fields, "10", "20", "30"),
        height: Number(fields.get("40") ?? 0),
      });
    } else if (type === "MTEXT") {
      texts.push({
        id,
        layer,
        value: (fields.get("1") ?? "") + (fields.get("3") ?? ""),
        position: pt(fields, "10", "20", "30"),
        height: Number(fields.get("40") ?? 0),
      });
    } else if (type === "DIMENSION") {
      dimensions.push({
        id,
        layer,
        text: fields.get("1") ?? "",
        measurement: fields.has("42") ? Number(fields.get("42")) : parseDimensionText(fields.get("1") ?? ""),
        start: pt(fields, "13", "23", "33"),
        end: pt(fields, "14", "24", "34"),
      });
    }
  }

  return { segments, polylines, inserts, texts, dimensions };
}

function collectEntity(pairs: { code: number; value: string }[], start: number) {
  const fields = new Map<string, string>();
  const multi: { code: number; value: string }[] = [];
  let i = start;
  while (i < pairs.length && pairs[i].code !== 0) {
    multi.push(pairs[i]);
    if (!fields.has(String(pairs[i].code)) || pairs[i].code === 10 || pairs[i].code === 20) {
      fields.set(String(pairs[i].code), pairs[i].value.trim());
    }
    i += 1;
  }
  (fields as Map<string, string> & { multi?: typeof multi }).multi = multi;
  return { fields, next: i, multi };
}

function verticesFromLw(fields: Map<string, string>): CadPoint[] {
  const multi = (fields as Map<string, string> & { multi?: { code: number; value: string }[] }).multi ?? [];
  const pts: CadPoint[] = [];
  let x = 0;
  for (const item of multi) {
    if (item.code === 10) x = Number(item.value);
    if (item.code === 20) pts.push({ x, y: Number(item.value), z: Number(fields.get("38") ?? 0) });
  }
  return pts;
}

function addPolylineSegments(
  segments: CadSegment[],
  id: string,
  layer: string,
  pts: CadPoint[],
  closed: boolean,
  entityType: CadSegment["entityType"],
) {
  const count = closed ? pts.length : pts.length - 1;
  for (let i = 0; i < count; i += 1) {
    const a = pts[i];
    const b = pts[(i + 1) % pts.length];
    if (!a || !b) continue;
    segments.push({ id: `${id}_${i}`, layer, start: a, end: b, width: 0, entityType });
  }
}

function sampleArc(c: CadPoint, r: number, a0: number, a1: number): CadPoint[] {
  let end = a1;
  if (end <= a0) end += Math.PI * 2;
  const steps = Math.max(8, Math.round(((end - a0) / (Math.PI / 8))));
  const pts: CadPoint[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const a = a0 + ((end - a0) * i) / steps;
    pts.push({ x: c.x + Math.cos(a) * r, y: c.y + Math.sin(a) * r, z: c.z });
  }
  return pts;
}

function pt(fields: Map<string, string>, x: string, y: string, z: string): CadPoint {
  return {
    x: Number(fields.get(x) ?? 0),
    y: Number(fields.get(y) ?? 0),
    z: Number(fields.get(z) ?? 0),
  };
}

function parseDimensionText(text: string): number | undefined {
  const match = text.replace(/<>/g, "").match(/-?\d+(\.\d+)?/);
  return match ? Number(match[0]) : undefined;
}
