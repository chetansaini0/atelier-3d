"use client";

import type { CadAnalysisReport, CadLayer, CadLayerCategory, CadUnits, ScaleWarning } from "@/cad/types";
import { LAYER_CATEGORIES } from "@/cad/types";
import { formatCadUnits } from "@/cad/units";
import { Button } from "@/components/ui/Button";

const UNITS: CadUnits[] = ["millimeters", "centimeters", "meters", "inches", "feet"];

export function CadAnalysisPanel({
  layers,
  report,
  scaleWarning,
  units,
  onUnits,
  layerMap,
  onLayerMap,
  hidden,
  onToggleCategory,
  scaleOk,
  onScaleOk,
}: {
  layers: CadLayer[];
  report: CadAnalysisReport;
  scaleWarning?: ScaleWarning;
  units: CadUnits;
  onUnits: (units: CadUnits) => void;
  layerMap: Record<string, CadLayerCategory>;
  onLayerMap: (name: string, category: CadLayerCategory) => void;
  hidden: Set<CadLayerCategory>;
  onToggleCategory: (category: CadLayerCategory) => void;
  scaleOk: boolean;
  onScaleOk: (ok: boolean) => void;
}) {
  const categories = [...new Set(layers.map((l) => layerMap[l.name] ?? l.category))];

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--brass)]">Detected CAD Units: {formatCadUnits(units)}</p>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Scene Units: Meters · Scale Conversion: 1:{Math.round(1 / report.scaleToMeters) || 1}
        </p>
        <label className="mt-3 block text-xs uppercase tracking-[0.18em] text-[var(--muted)]">
          Override units
          <select
            className="mt-1 w-full rounded-xl bg-transparent p-2"
            value={units}
            onChange={(e) => onUnits(e.target.value as CadUnits)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {formatCadUnits(u)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {scaleWarning?.unusual ? (
        <div className="glass rounded-2xl border border-[var(--brass)] p-4">
          <p className="font-serif text-2xl">Scale warning</p>
          <p className="mt-2 text-sm text-[var(--muted)]">{scaleWarning.message}</p>
          <ul className="mt-3 text-sm">
            {scaleWarning.samples.map((s) => (
              <li key={s.label}>
                {s.label}: {s.meters.toFixed(2)} m
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm">Is this correct?</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button onClick={() => onScaleOk(true)}>Yes, continue</Button>
            <Button variant="line" onClick={() => onScaleOk(false)}>
              Fix units
            </Button>
          </div>
          {scaleOk ? <p className="mt-2 text-xs text-[var(--brass)]">Scale acknowledged.</p> : null}
        </div>
      ) : null}

      <div className="glass rounded-2xl p-4">
        <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">CAD analysis</p>
        <ul className="mt-3 space-y-1 text-sm">
          {report.checks.map((c) => (
            <li key={c}>✓ {c}</li>
          ))}
        </ul>
        {report.warnings.length ? (
          <ul className="mt-3 space-y-1 text-sm text-[var(--muted)]">
            {report.warnings.map((w) => (
              <li key={w.message}>⚠ {w.message}</li>
            ))}
          </ul>
        ) : null}
        <p className="mt-4 text-sm">
          Overall reconstruction confidence: {Math.round(report.confidence * 100)}%
        </p>
      </div>

      <div className="glass rounded-2xl p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Layer visibility</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <label key={cat} className="flex items-center gap-2 text-sm capitalize">
              <input type="checkbox" checked={!hidden.has(cat)} onChange={() => onToggleCategory(cat)} />
              {cat}
            </label>
          ))}
        </div>
      </div>

      <div className="glass overflow-x-auto rounded-2xl p-4">
        <p className="mb-3 text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Layer mapping</p>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-[var(--muted)]">
              <th className="pb-2 font-normal">Layer</th>
              <th className="pb-2 font-normal">Detected as</th>
            </tr>
          </thead>
          <tbody>
            {layers.map((layer) => (
              <tr key={layer.name}>
                <td className="py-1">{layer.name}</td>
                <td>
                  <select
                    className="bg-transparent"
                    value={layerMap[layer.name] ?? layer.category}
                    onChange={(e) => onLayerMap(layer.name, e.target.value as CadLayerCategory)}
                  >
                    {LAYER_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
