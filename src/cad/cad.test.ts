import { describe, expect, it } from "vitest";
import { parseDxf } from "@/cad/dxf/parseDxf";
import { classifyLayerName } from "@/cad/layers";
import { metersPerCadUnit } from "@/cad/units";
import { cadProcessor } from "@/cad/CADProcessor";
import { sampleVillaDxf, SAMPLE_DXF_FILENAME } from "@/cad/sampleDxf";
import { detectArchitecturalElements, detectWalls } from "@/cad/architecture/detect";
import { classifyRoomLabel, classifyBlockName } from "@/cad/architecture/classify";
import { validateSceneDocument } from "@/scene/SceneSchema";

describe("CAD layer classification", () => {
  it("maps AIA-style layer names", () => {
    expect(classifyLayerName("A-WALL")).toBe("wall");
    expect(classifyLayerName("A-DOOR")).toBe("door");
    expect(classifyLayerName("A-WINDOW")).toBe("window");
    expect(classifyLayerName("FURNITURE")).toBe("furniture");
    expect(classifyLayerName("MY-CUSTOM-LAYER")).toBe("unknown");
  });
});

describe("CAD units", () => {
  it("converts millimeters to meters", () => {
    expect(metersPerCadUnit("millimeters")).toBe(0.001);
  });
});

describe("ASCII DXF parser", () => {
  it("reads units, layers, text, and inserts from the sample villa", () => {
    const doc = parseDxf(sampleVillaDxf(), SAMPLE_DXF_FILENAME);
    expect(doc.units).toBe("millimeters");
    expect(doc.layers.some((l) => l.name === "A-WALL" && l.category === "wall")).toBe(true);
    expect(doc.texts.some((t) => /LIVING/i.test(t.value))).toBe(true);
    expect(doc.inserts.some((i) => i.block === "SOFA_BLOCK")).toBe(true);
    expect(doc.dimensions.some((d) => d.measurement === 5200)).toBe(true);
  });
});

describe("architecture reconstruction", () => {
  it("pairs parallel wall lines at ~200 mm thickness", () => {
    const scale = 0.001;
    const segments = [
      { id: "a", layer: "A-WALL", entityType: "LINE" as const, width: 0, start: { x: 0, y: 0, z: 0 }, end: { x: 5.2, y: 0, z: 0 } },
      { id: "b", layer: "A-WALL", entityType: "LINE" as const, width: 0, start: { x: 0, y: 0.2, z: 0 }, end: { x: 5.2, y: 0.2, z: 0 } },
    ];
    const walls = detectWalls(segments, new Map([["A-WALL", "wall"]]));
    expect(walls.length).toBe(1);
    expect(walls[0].thickness).toBeCloseTo(0.2, 2);
    expect(Math.hypot(walls[0].end.x - walls[0].start.x, walls[0].end.z - walls[0].start.z)).toBeCloseTo(5.2, 2);
    expect(scale).toBe(0.001);
  });

  it("names rooms from CAD text labels", () => {
    expect(classifyRoomLabel("LIVING")?.type).toBe("living");
    expect(classifyRoomLabel("MASTER BEDROOM")?.type).toBe("bedroom");
    expect(classifyBlockName("SOFA_BLOCK")).toBe("sofa");
    expect(classifyBlockName("DOOR_BLOCK")).toBe("door");
  });

  it("builds a valid scene from the sample DXF", () => {
    const { scene, result } = cadProcessor.generateSceneJSON(cadProcessor.parseCAD(sampleVillaDxf(), SAMPLE_DXF_FILENAME));
    expect(result.status).toBe("ok");
    expect(result.elements?.walls.length).toBeGreaterThan(4);
    expect(result.elements?.rooms.some((r) => /living/i.test(r.name) || r.type === "living")).toBe(true);
    expect(result.report?.units).toBe("millimeters");
    expect(result.scaleWarning?.unusual).toBe(false);
    const parsed = validateSceneDocument(scene);
    expect(parsed.cad?.source.type).toBe("DXF");
    expect(parsed.levels[0].walls.length).toBeGreaterThan(3);
    expect(parsed.levels[0].walls[0].confidence.source).toBe("cad");
    expect(parsed.levels[0].walls[0].source?.layer).toBeTruthy();
    expect(parsed.spawn.y).toBeCloseTo(parsed.levels[0].elevation + 1.7, 1);
  });
});

describe("CADProcessor", () => {
  it("exposes the required analysis methods", () => {
    const doc = cadProcessor.parseCAD(sampleVillaDxf(), SAMPLE_DXF_FILENAME);
    expect(cadProcessor.extractLayers(doc).length).toBeGreaterThan(3);
    expect(cadProcessor.detectUnits(doc).units).toBe("millimeters");
    expect(cadProcessor.detectRooms(doc).length).toBeGreaterThan(2);
    expect(cadProcessor.extractDimensions(doc).length).toBeGreaterThan(0);
    const elements = detectArchitecturalElements(doc);
    expect(elements.doors.length).toBeGreaterThan(0);
  });
});
