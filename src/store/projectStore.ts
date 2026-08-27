"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SceneDocument, StoredProject } from "@/types/scene";
import { createId } from "@/utils/ids";
import { createDemoVillaScene } from "@/data/demoVilla";

interface ProjectState {
  projects: StoredProject[];
  currentId: string | null;
  hydrateDemo: () => string;
  createProject: (name: string, scene: SceneDocument, thumbnail?: string | null) => string;
  updateScene: (id: string, scene: SceneDocument) => void;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => void;
  setCurrent: (id: string | null) => void;
  getProject: (id: string) => StoredProject | undefined;
}

export const useProjectStore = create<ProjectState>()(
  persist(
    (set, get) => ({
      projects: [],
      currentId: null,
      hydrateDemo: () => {
        const existing = get().projects.find((p) => p.id === "demo-villa");
        if (existing) {
          set({ currentId: existing.id });
          return existing.id;
        }
        const scene = createDemoVillaScene();
        const project: StoredProject = {
          id: "demo-villa",
          name: scene.project.name,
          thumbnail: null,
          scene,
          createdAt: scene.project.createdAt,
          updatedAt: scene.project.updatedAt,
        };
        set({ projects: [project, ...get().projects], currentId: project.id });
        return project.id;
      },
      createProject: (name, scene, thumbnail = null) => {
        const id = createId("proj");
        const now = new Date().toISOString();
        const project: StoredProject = {
          id,
          name,
          thumbnail,
          scene: {
            ...scene,
            project: { ...scene.project, name, createdAt: now, updatedAt: now },
          },
          createdAt: now,
          updatedAt: now,
        };
        set({ projects: [project, ...get().projects], currentId: id });
        return id;
      },
      updateScene: (id, scene) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id
              ? {
                  ...p,
                  scene: { ...scene, project: { ...scene.project, updatedAt: new Date().toISOString() } },
                  updatedAt: new Date().toISOString(),
                  name: scene.project.name,
                }
              : p,
          ),
        });
      },
      renameProject: (id, name) => {
        set({
          projects: get().projects.map((p) =>
            p.id === id
              ? { ...p, name, scene: { ...p.scene, project: { ...p.scene.project, name } }, updatedAt: new Date().toISOString() }
              : p,
          ),
        });
      },
      deleteProject: (id) => {
        set({
          projects: get().projects.filter((p) => p.id !== id),
          currentId: get().currentId === id ? null : get().currentId,
        });
      },
      setCurrent: (currentId) => set({ currentId }),
      getProject: (id) => get().projects.find((p) => p.id === id),
    }),
    { name: "r23d-projects" },
  ),
);
