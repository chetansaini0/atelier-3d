"use client";

import { create } from "zustand";
import type { SceneDocument } from "@/types/scene";

interface HistoryState {
  past: SceneDocument[];
  future: SceneDocument[];
  push: (scene: SceneDocument) => void;
  undo: (current: SceneDocument) => SceneDocument | null;
  redo: (current: SceneDocument) => SceneDocument | null;
  clear: () => void;
}

const MAX = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  future: [],
  push: (scene) => {
    set({ past: [...get().past, structuredClone(scene)].slice(-MAX), future: [] });
  },
  undo: (current) => {
    const { past, future } = get();
    if (!past.length) return null;
    const previous = past[past.length - 1];
    set({ past: past.slice(0, -1), future: [structuredClone(current), ...future] });
    return previous;
  },
  redo: (current) => {
    const { past, future } = get();
    if (!future.length) return null;
    const next = future[0];
    set({ past: [...past, structuredClone(current)], future: future.slice(1) });
    return next;
  },
  clear: () => set({ past: [], future: [] }),
}));
