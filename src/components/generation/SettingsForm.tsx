"use client";

import type { ReactNode } from "react";
import type { GenerationSettings } from "@/types/scene";

export function SettingsForm({ value, onChange }: { value: GenerationSettings; onChange: (v: GenerationSettings) => void }) {
  const set = (patch: Partial<GenerationSettings>) => onChange({ ...value, ...patch });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Field label="Units">
        <div className="flex gap-2">
          {(["metric", "imperial"] as const).map((u) => (
            <Choice key={u} active={value.units === u} onClick={() => set({ units: u })}>
              {u === "metric" ? "Metric" : "Imperial"}
            </Choice>
          ))}
        </div>
      </Field>
      <Field label="Scale">
        <select
          className="w-full bg-transparent outline-none"
          value={value.scale === "auto" ? "auto" : String(value.scale)}
          onChange={(e) => set({ scale: e.target.value === "auto" ? "auto" : Number(e.target.value) })}
        >
          <option value="auto">Auto detect</option>
          <option value="50">1:50</option>
          <option value="100">1:100</option>
        </select>
      </Field>
      <Field label="Architecture type">
        <input
          className="w-full bg-transparent outline-none"
          value={value.architectureType}
          onChange={(e) => set({ architectureType: e.target.value })}
          placeholder="Auto detect"
        />
      </Field>
      <Field label="Detail level">
        <div className="flex gap-2">
          {(["standard", "high", "ultra"] as const).map((d) => (
            <Choice key={d} active={value.detailLevel === d} onClick={() => set({ detailLevel: d })}>
              {d}
            </Choice>
          ))}
        </div>
      </Field>
      <Field label="Realism">
        <div className="flex gap-2">
          {(["standard", "photorealistic"] as const).map((d) => (
            <Choice key={d} active={value.realism === d} onClick={() => set({ realism: d })}>
              {d}
            </Choice>
          ))}
        </div>
      </Field>
      <Field label="Furniture">
        <Choice active={value.detectFurniture} onClick={() => set({ detectFurniture: !value.detectFurniture })}>
          Detect automatically
        </Choice>
      </Field>
      <Field label="Lighting">
        <select
          className="w-full bg-transparent outline-none"
          value={value.lighting}
          onChange={(e) => set({ lighting: e.target.value as GenerationSettings["lighting"] })}
        >
          <option value="automatic">Automatic</option>
          <option value="day">Day</option>
          <option value="sunset">Sunset</option>
          <option value="night">Night</option>
        </select>
      </Field>
      <Field label={`AI confidence threshold · ${Math.round(value.confidenceThreshold * 100)}%`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={value.confidenceThreshold}
          onChange={(e) => set({ confidenceThreshold: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
      <Field label="Known measurement (optional scale reference)">
        <div className="flex gap-2">
          <input
            className="flex-1 bg-transparent outline-none"
            placeholder="Width of the main entrance"
            value={value.knownMeasurement?.label ?? ""}
            onChange={(e) =>
              set({
                knownMeasurement: {
                  label: e.target.value,
                  meters: value.knownMeasurement?.meters ?? 1.2,
                },
              })
            }
          />
          <input
            type="number"
            step="0.1"
            className="w-24 bg-transparent outline-none"
            placeholder="1.2 m"
            value={value.knownMeasurement?.meters ?? ""}
            onChange={(e) =>
              set({
                knownMeasurement: {
                  label: value.knownMeasurement?.label ?? "Known width",
                  meters: Number(e.target.value) || 1.2,
                },
              })
            }
          />
        </div>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">{label}</span>
      <div className="glass rounded-2xl px-3 py-2">{children}</div>
    </label>
  );
}

function Choice({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`rounded-full px-3 py-1 text-sm capitalize ${active ? "bg-[var(--brass)] text-[#1a1916]" : "text-[var(--muted)]"}`}>
      {children}
    </button>
  );
}
