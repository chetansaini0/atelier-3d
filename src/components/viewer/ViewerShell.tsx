"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import type * as THREE from "three";
import {
  BoxSelect,
  Camera,
  Download,
  Moon,
  Move3d,
  Redo2,
  Save,
  Search,
  Sun,
  Sunset,
  Undo2,
  Ruler,
} from "lucide-react";
import type { CameraMode, EditorTool, LightingMode, SceneDocument, SceneObject } from "@/types/scene";
import { Button } from "@/components/ui/Button";
import { Minimap } from "@/components/viewer/Minimap";
import { InspectionPanel, MeasurementReadout } from "@/components/viewer/InspectionPanel";
import { FloorPlanView, NavigationTree } from "@/components/viewer/NavigationTree";
import { useViewerStore } from "@/store/viewerStore";
import { useHistoryStore } from "@/store/historyStore";
import { useProjectStore } from "@/store/projectStore";
import { allRooms, findEntity, roomSpawn } from "@/scene/lookup";
import { exportFloorPlanPng, exportFloorPlanSvg, exportGlb, exportSceneJson, exportScreenshot } from "@/utils/export";

const WorldCanvas = dynamic(() => import("@/components/viewer/WorldCanvas").then((m) => m.WorldCanvas), { ssr: false });

const TOOLS: { id: EditorTool; label: string }[] = [
  { id: "select", label: "Select" },
  { id: "move", label: "Move" },
  { id: "rotate", label: "Rotate" },
  { id: "scale", label: "Scale" },
  { id: "wall", label: "Wall" },
  { id: "door", label: "Door" },
  { id: "window", label: "Window" },
  { id: "furniture", label: "Furniture" },
  { id: "measure", label: "Measure" },
  { id: "room", label: "Room" },
  { id: "light", label: "Light" },
];

const COMING: EditorTool[] = ["wall", "door", "window", "furniture", "room", "light"];

export function ViewerShell({ projectId, scene, onSceneChange }: { projectId: string; scene: SceneDocument; onSceneChange: (scene: SceneDocument) => void }) {
  const cameraMode = useViewerStore((s) => s.cameraMode);
  const setCameraMode = useViewerStore((s) => s.setCameraMode);
  const lightingMode = useViewerStore((s) => s.lightingMode);
  const setLightingMode = useViewerStore((s) => s.setLightingMode);
  const tool = useViewerStore((s) => s.editorTool);
  const setTool = useViewerStore((s) => s.setEditorTool);
  const searchQuery = useViewerStore((s) => s.searchQuery);
  const applySearch = useViewerStore((s) => s.applySearch);
  const setSearch = useViewerStore((s) => s.setSearch);
  const select = useViewerStore((s) => s.select);
  const selectedId = useViewerStore((s) => s.selectedId);
  const cinematic = useViewerStore((s) => s.cinematic);
  const setCinematic = useViewerStore((s) => s.setCinematic);
  const floorPlanOpen = useViewerStore((s) => s.floorPlanOpen);
  const setFloorPlanOpen = useViewerStore((s) => s.setFloorPlanOpen);
  const visibleLevelId = useViewerStore((s) => s.visibleLevelId);
  const setVisibleLevel = useViewerStore((s) => s.setVisibleLevel);
  const pointerLocked = useViewerStore((s) => s.pointerLocked);
  const setPlayer = useViewerStore((s) => s.setPlayer);
  const rename = useProjectStore((s) => s.updateScene);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootRef = useRef<THREE.Object3D | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [errorChoice, setErrorChoice] = useState<string | null>(null);

  const selectedObject = useMemo(() => {
    if (!selectedId) return null;
    for (const level of scene.levels) {
      for (const room of level.rooms) {
        const obj = room.objects.find((o) => o.id === selectedId);
        if (obj) return { obj, roomId: room.id, levelId: level.id };
      }
    }
    return null;
  }, [scene, selectedId]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        const next = useHistoryStore.getState().undo(scene);
        if (next) onSceneChange(next);
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        const next = useHistoryStore.getState().redo(scene);
        if (next) onSceneChange(next);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scene, onSceneChange]);

  const updateObject = (patch: Partial<SceneObject>) => {
    if (!selectedObject) return;
    useHistoryStore.getState().push(scene);
    const next: SceneDocument = structuredClone(scene);
    for (const level of next.levels) {
      for (const room of level.rooms) {
        const idx = room.objects.findIndex((o) => o.id === selectedObject.obj.id);
        if (idx >= 0) room.objects[idx] = { ...room.objects[idx], ...patch, confidence: { ...room.objects[idx].confidence, source: "user", score: 1 } };
      }
    }
    onSceneChange(next);
  };

  const renameRoom = (id: string, name: string) => {
    useHistoryStore.getState().push(scene);
    const next = structuredClone(scene);
    for (const level of next.levels) {
      const room = level.rooms.find((r) => r.id === id);
      if (room) {
        room.name = name;
        room.confidence = { ...room.confidence, source: "user", score: 1 };
      }
    }
    onSceneChange(next);
  };

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-[var(--bg)]">
      <WorldCanvas
        scene={scene}
        onBindRenderer={(gl, root) => {
          rendererRef.current = gl;
          rootRef.current = root;
        }}
      />

      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4">
        <div className="pointer-events-auto glass flex items-center gap-3 rounded-full px-4 py-2">
          <span className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Atelier</span>
          <input
            aria-label="Project name"
            className="w-48 bg-transparent text-sm outline-none"
            value={scene.project.name}
            onChange={(e) => onSceneChange({ ...scene, project: { ...scene.project, name: e.target.value } })}
          />
        </div>
        <div className="pointer-events-auto flex flex-wrap items-center gap-2">
          <ToolCluster />
          <Button variant="ghost" onClick={() => { const n = useHistoryStore.getState().undo(scene); if (n) onSceneChange(n); }} aria-label="Undo">
            <Undo2 size={16} />
          </Button>
          <Button variant="ghost" onClick={() => { const n = useHistoryStore.getState().redo(scene); if (n) onSceneChange(n); }} aria-label="Redo">
            <Redo2 size={16} />
          </Button>
          <Button
            variant="line"
            onClick={() => {
              rename(projectId, scene);
              setSavedFlash(true);
              setTimeout(() => setSavedFlash(false), 1200);
            }}
          >
            <Save size={14} /> {savedFlash ? "Saved" : "Save"}
          </Button>
          <ExportMenu
            scene={scene}
            onImage={() => rendererRef.current && exportScreenshot(rendererRef.current)}
            onGlb={() => rootRef.current && exportGlb(rootRef.current)}
          />
        </div>
      </header>

      <div className="pointer-events-none absolute left-4 top-20 z-20 flex flex-col gap-3">
        <div className="pointer-events-auto">
          <NavigationTree scene={scene} />
        </div>
        <div className="pointer-events-auto glass flex w-64 flex-col gap-1 rounded-2xl p-2">
          {TOOLS.map((item) => (
            <button
              key={item.id}
              className={`rounded-xl px-3 py-2 text-left text-sm ${tool === item.id ? "bg-white/10 text-[var(--brass)]" : "text-[var(--muted)]"}`}
              onClick={() => setTool(item.id)}
            >
              {item.label}
              {COMING.includes(item.id) ? <span className="ml-2 text-[10px] uppercase tracking-wider">Coming soon</span> : null}
            </button>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute right-4 top-20 z-20 flex flex-col items-end gap-3">
        <div className="pointer-events-auto">
          <InspectionPanel scene={scene} />
        </div>
        {selectedObject ? (
          <div className="pointer-events-auto glass w-80 rounded-2xl p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Properties</p>
            <label className="block text-xs text-[var(--muted)]">Name</label>
            <input className="mb-2 w-full bg-transparent text-sm outline-none" value={selectedObject.obj.name} onChange={(e) => updateObject({ name: e.target.value })} />
            <div className="grid grid-cols-3 gap-2 text-xs">
              {(["width", "depth", "height"] as const).map((key) => (
                <label key={key}>
                  {key}
                  <input
                    type="number"
                    step="0.05"
                    className="w-full bg-transparent outline-none"
                    value={selectedObject.obj.dimensions[key]}
                    onChange={(e) =>
                      updateObject({
                        dimensions: { ...selectedObject.obj.dimensions, [key]: Number(e.target.value) },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <label className="mt-2 block text-xs text-[var(--muted)]">Rotation (deg)</label>
            <input
              type="number"
              className="w-full bg-transparent text-sm outline-none"
              value={Math.round((selectedObject.obj.rotation * 180) / Math.PI)}
              onChange={(e) => updateObject({ rotation: (Number(e.target.value) * Math.PI) / 180 })}
            />
          </div>
        ) : selectedId && findEntity(scene, selectedId)?.kind === "room" ? (
          <div className="pointer-events-auto glass w-80 rounded-2xl p-4">
            <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[var(--muted)]">Room correction</p>
            <input
              className="w-full bg-transparent text-sm outline-none"
              defaultValue={findEntity(scene, selectedId)?.name}
              onBlur={(e) => renameRoom(selectedId, e.target.value)}
            />
          </div>
        ) : null}
      </div>

      <div className="pointer-events-none absolute bottom-4 left-4 z-20 flex items-end gap-3">
        <div className="pointer-events-auto">
          <Minimap scene={scene} />
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <MeasurementReadout scene={scene} />
          <div className="glass flex gap-1 rounded-full p-1">
            {(["first-person", "orbit", "top", "presentation"] as CameraMode[]).map((mode) => (
              <button
                key={mode}
                className={`rounded-full px-3 py-1 text-xs capitalize ${cameraMode === mode ? "bg-[var(--brass)] text-[#1a1916]" : "text-[var(--muted)]"}`}
                onClick={() => setCameraMode(mode)}
              >
                {mode.replace("-", " ")}
              </button>
            ))}
          </div>
          <div className="glass flex gap-1 rounded-full p-1">
            {([
              ["day", Sun],
              ["sunset", Sunset],
              ["night", Moon],
            ] as [LightingMode, typeof Sun][]).map(([mode, Icon]) => (
              <button key={mode} className={`rounded-full px-3 py-1 ${lightingMode === mode ? "text-[var(--brass)]" : "text-[var(--muted)]"}`} onClick={() => setLightingMode(mode)} aria-label={mode}>
                <Icon size={16} />
              </button>
            ))}
          </div>
          <div className="glass flex gap-1 rounded-full p-1">
            {scene.levels.map((level) => (
              <button key={level.id} className={`rounded-full px-3 py-1 text-xs ${visibleLevelId === level.id ? "text-[var(--brass)]" : "text-[var(--muted)]"}`} onClick={() => setVisibleLevel(level.id)}>
                {level.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-4 right-4 z-20 flex flex-col items-end gap-2">
        <form
          className="pointer-events-auto glass flex items-center gap-2 rounded-full px-3 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            const ids = applySearch(scene, searchQuery);
            const rooms = allRooms(scene);
            const match = rooms.find((r) => ids.includes(r.room.id) || r.room.name.toLowerCase().includes(searchQuery.toLowerCase()));
            if (match) {
              select(match.room.id, "room");
              setPlayer(roomSpawn(match.room, scene.levels.find((l) => l.id === match.levelId)?.elevation ?? 0), 0);
            }
          }}
        >
          <Search size={14} />
          <input
            aria-label="Search environment"
            placeholder="Search: sofa, bathroom…"
            className="w-48 bg-transparent text-sm outline-none"
            value={searchQuery}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>
        <div className="pointer-events-auto flex gap-2">
          <Button variant="line" onClick={() => setFloorPlanOpen(!floorPlanOpen)}>
            {floorPlanOpen ? "3D View" : "Floor Plan"}
          </Button>
          <Button variant="line" onClick={() => { setCinematic(!cinematic); setCameraMode("presentation"); }}>
            Generate Presentation View
          </Button>
          <Button id="enter-walkthrough" onClick={() => setCameraMode("first-person")}>
            Enter walkthrough
          </Button>
        </div>
        {pointerLocked ? <p className="text-xs text-[var(--muted)]">ESC releases the mouse · WASD move · Shift run · Space jump</p> : null}
      </div>

      {floorPlanOpen ? (
        <div className="absolute inset-x-0 bottom-24 z-30 mx-auto max-w-3xl px-4">
          <FloorPlanView scene={scene} />
        </div>
      ) : null}

      {errorChoice ? (
        <div className="absolute inset-0 z-40 grid place-items-center bg-black/50">
          <div className="glass max-w-md rounded-2xl p-6">
            <p>Could not confidently identify this object.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Would you like to:</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button onClick={() => { setTool("select"); setErrorChoice(null); }}>Add manually</Button>
              <Button variant="line" onClick={() => setErrorChoice(null)}>Try AI analysis again</Button>
              <Button variant="ghost" onClick={() => setErrorChoice(null)}>Ignore</Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="sr-only">
        <BoxSelect />
        <Move3d />
        <Camera />
        <Download />
        <Ruler />
      </div>
    </div>
  );
}

function ToolCluster() {
  const mode = useViewerStore((s) => s.cameraMode);
  return <span className="glass hidden rounded-full px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--muted)] md:inline">{mode}</span>;
}

function ExportMenu({ scene, onImage, onGlb }: { scene: SceneDocument; onImage: () => void; onGlb: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Button variant="line" onClick={() => setOpen((v) => !v)}>
        <Download size={14} /> Export
      </Button>
      {open ? (
        <div className="glass absolute right-0 top-12 z-30 w-48 rounded-2xl p-2 text-sm">
          <button className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5" onClick={() => { onImage(); setOpen(false); }}>
            Image PNG
          </button>
          <button className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5" onClick={() => { onGlb(); setOpen(false); }}>
            3D GLB / GLTF
          </button>
          <button className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5" onClick={() => { exportSceneJson(scene); setOpen(false); }}>
            Scene JSON
          </button>
          <button className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5" onClick={() => { exportFloorPlanSvg(scene); setOpen(false); }}>
            Floor plan SVG
          </button>
          <button className="block w-full rounded-xl px-3 py-2 text-left hover:bg-white/5" onClick={() => { exportFloorPlanPng(scene); setOpen(false); }}>
            Floor plan PNG
          </button>
          <p className="px-3 py-2 text-[10px] uppercase tracking-wider text-[var(--muted)]">PDF export · Coming soon</p>
        </div>
      ) : null}
    </div>
  );
}
