import { describe, expect, it } from "vitest";
import {
  collideWithWalls,
  formatMeters,
  polygonArea,
  pointInPolygon,
  roomDimensions,
  wallLength,
  wallSegments,
} from "@/scene/geometry";
import type { Room, Wall } from "@/types/scene";

const conf = { score: 1, source: "demo" as const };

function sampleWall(openings: Wall["openings"] = []): Wall {
  return {
    id: "w",
    start: { x: 0, z: 0 },
    end: { x: 4, z: 0 },
    height: 3,
    thickness: 0.2,
    materialId: "paint",
    exterior: true,
    openings,
    confidence: conf,
  };
}

describe("geometry", () => {
  it("computes polygon area with shoelace", () => {
    expect(polygonArea([
      { x: 0, z: 0 },
      { x: 5, z: 0 },
      { x: 5, z: 4 },
      { x: 0, z: 4 },
    ])).toBe(20);
  });

  it("detects point in polygon", () => {
    const poly = [
      { x: 0, z: 0 },
      { x: 4, z: 0 },
      { x: 4, z: 3 },
      { x: 0, z: 3 },
    ];
    expect(pointInPolygon({ x: 2, z: 1 }, poly)).toBe(true);
    expect(pointInPolygon({ x: 5, z: 1 }, poly)).toBe(false);
  });

  it("returns room dimensions", () => {
    const room: Room = {
      id: "r",
      name: "Living Room",
      type: "living",
      polygon: [
        { x: 0, z: 0 },
        { x: 5.2, z: 0 },
        { x: 5.2, z: 4.8 },
        { x: 0, z: 4.8 },
      ],
      floorMaterialId: "wood",
      wallMaterialId: "paint",
      ceilingMaterialId: "ceil",
      ceilingHeight: 3,
      objects: [],
      lights: [],
      confidence: conf,
    };
    expect(roomDimensions(room)).toEqual({ width: 5.2, length: 4.8, height: 3, area: 24.96 });
  });

  it("splits walls around door openings", () => {
    const wall = sampleWall([
      {
        id: "d",
        type: "door",
        name: "Door",
        offset: 1,
        width: 1,
        height: 2.1,
        sillHeight: 0,
        interactive: true,
        confidence: conf,
      },
    ]);
    expect(wallLength(wall)).toBe(4);
    const segs = wallSegments(wall);
    expect(segs.some((s) => s.kind === "door")).toBe(true);
    expect(segs[0].kind).toBe("solid");
  });

  it("prevents walking through closed walls", () => {
    const wall = sampleWall();
    const pushed = collideWithWalls({ x: 2, z: 0.05 }, 0.22, [wall], new Set());
    expect(Math.abs(pushed.z)).toBeGreaterThan(0.2);
  });

  it("allows walking through open doors", () => {
    const wall = sampleWall([
      {
        id: "d1",
        type: "door",
        name: "Door",
        offset: 1.5,
        width: 1,
        height: 2.1,
        sillHeight: 0,
        interactive: true,
        open: true,
        confidence: conf,
      },
    ]);
    const pos = collideWithWalls({ x: 2, z: 0.05 }, 0.22, [wall], new Set(["d1"]));
    expect(Math.abs(pos.z)).toBeLessThan(0.12);
  });

  it("formats meters and feet", () => {
    expect(formatMeters(4.82)).toBe("4.82 m");
    expect(formatMeters(1, "imperial")).toContain("ft");
  });
});
