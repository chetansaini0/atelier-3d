import { describe, expect, it } from "vitest";
import { safeParseSceneDocument, validateSceneDocument } from "@/scene/SceneSchema";
import { createDemoVillaScene } from "@/data/demoVilla";

describe("scene schema", () => {
  it("validates the demo villa", () => {
    const scene = createDemoVillaScene();
    const parsed = validateSceneDocument(scene);
    expect(parsed.version).toBe(1);
    expect(parsed.levels.length).toBeGreaterThan(1);
    expect(parsed.levels[0].rooms.some((r) => r.name === "Living Room")).toBe(true);
    expect(parsed.spawn.y).toBeCloseTo(1.7);
  });

  it("rejects missing levels", () => {
    const result = safeParseSceneDocument({ version: 1, project: { name: "x" } });
    expect(result.success).toBe(false);
  });

  it("keeps furniture inside rooms", () => {
    const scene = createDemoVillaScene();
    const living = scene.levels[0].rooms.find((r) => r.id === "living-room");
    expect(living?.objects.some((o) => o.type === "sofa")).toBe(true);
    expect(living?.objects.find((o) => o.id === "sofa-main")?.dimensions.width).toBe(2.2);
  });
});
