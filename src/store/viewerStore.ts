"use client";

import { create } from "zustand";
import type { CameraMode, EditorTool, LightingMode, SceneDocument, Vec3 } from "@/types/scene";

interface ViewerState {
  cameraMode: CameraMode;
  lightingMode: LightingMode;
  selectedId: string | null;
  selectedKind: "wall" | "door" | "window" | "room" | "object" | "light" | null;
  highlightedIds: Set<string>;
  openDoorIds: Set<string>;
  visibleLevelId: string | null;
  ghostOtherFloors: boolean;
  editorTool: EditorTool;
  measurePoints: Vec3[];
  measureDistance: number | null;
  searchQuery: string;
  cinematic: boolean;
  reducedMotion: boolean;
  highContrast: boolean;
  pointerLocked: boolean;
  playerPosition: Vec3;
  playerYaw: number;
  inspectOpen: boolean;
  floorPlanOpen: boolean;
  setCameraMode: (mode: CameraMode) => void;
  setLightingMode: (mode: LightingMode) => void;
  select: (id: string | null, kind?: ViewerState["selectedKind"]) => void;
  setHighlights: (ids: string[]) => void;
  toggleDoor: (id: string) => void;
  setVisibleLevel: (id: string | null) => void;
  setEditorTool: (tool: EditorTool) => void;
  addMeasurePoint: (point: Vec3) => void;
  clearMeasure: () => void;
  setSearch: (q: string) => void;
  setCinematic: (v: boolean) => void;
  setPointerLocked: (v: boolean) => void;
  setPlayer: (pos: Vec3, yaw: number) => void;
  setInspectOpen: (v: boolean) => void;
  setFloorPlanOpen: (v: boolean) => void;
  applySearch: (scene: SceneDocument, query: string) => string[];
  resetViewer: () => void;
}

const emptySet = new Set<string>();

export const useViewerStore = create<ViewerState>((set, get) => ({
  cameraMode: "orbit",
  lightingMode: "day",
  selectedId: null,
  selectedKind: null,
  highlightedIds: emptySet,
  openDoorIds: emptySet,
  visibleLevelId: "ground",
  ghostOtherFloors: true,
  editorTool: "select",
  measurePoints: [],
  measureDistance: null,
  searchQuery: "",
  cinematic: false,
  reducedMotion: false,
  highContrast: false,
  pointerLocked: false,
  playerPosition: { x: 1.6, y: 1.7, z: 1.15 },
  playerYaw: 0,
  inspectOpen: true,
  floorPlanOpen: false,
  setCameraMode: (cameraMode) => set({ cameraMode }),
  setLightingMode: (lightingMode) => set({ lightingMode }),
  select: (id, kind = null) => set({ selectedId: id, selectedKind: id ? kind : null, inspectOpen: true }),
  setHighlights: (ids) => set({ highlightedIds: new Set(ids) }),
  toggleDoor: (id) => {
    const next = new Set(get().openDoorIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    set({ openDoorIds: next });
  },
  setVisibleLevel: (visibleLevelId) => set({ visibleLevelId }),
  setEditorTool: (editorTool) => set({ editorTool, measurePoints: editorTool === "measure" ? get().measurePoints : [] }),
  addMeasurePoint: (point) => {
    const points = [...get().measurePoints, point].slice(-2);
    const measureDistance =
      points.length === 2
        ? Math.hypot(points[1].x - points[0].x, points[1].y - points[0].y, points[1].z - points[0].z)
        : null;
    set({ measurePoints: points, measureDistance });
  },
  clearMeasure: () => set({ measurePoints: [], measureDistance: null }),
  setSearch: (searchQuery) => set({ searchQuery }),
  setCinematic: (cinematic) => set({ cinematic }),
  setPointerLocked: (pointerLocked) => set({ pointerLocked }),
  setPlayer: (playerPosition, playerYaw) => set({ playerPosition, playerYaw }),
  setInspectOpen: (inspectOpen) => set({ inspectOpen }),
  setFloorPlanOpen: (floorPlanOpen) => set({ floorPlanOpen }),
  applySearch: (scene, query) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      set({ highlightedIds: emptySet, searchQuery: "" });
      return [];
    }
    const ids: string[] = [];
    for (const level of scene.levels) {
      for (const room of level.rooms) {
        if (room.name.toLowerCase().includes(q) || room.type.toLowerCase().includes(q)) ids.push(room.id);
        for (const object of room.objects) {
          if (object.name.toLowerCase().includes(q) || object.type.toLowerCase().includes(q)) ids.push(object.id);
        }
      }
      for (const wall of level.walls) {
        for (const opening of wall.openings) {
          if (opening.name.toLowerCase().includes(q) || opening.type.toLowerCase().includes(q)) ids.push(opening.id);
        }
      }
    }
    set({ highlightedIds: new Set(ids), searchQuery: query });
    return ids;
  },
  resetViewer: () =>
    set({
      cameraMode: "orbit",
      selectedId: null,
      highlightedIds: emptySet,
      openDoorIds: emptySet,
      measurePoints: [],
      measureDistance: null,
      cinematic: false,
    }),
}));
