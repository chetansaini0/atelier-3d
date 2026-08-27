"use client";

import type { SceneDocument } from "@/types/scene";
import { findEntity } from "@/scene/lookup";
import { useViewerStore } from "@/store/viewerStore";
import { formatMeters, roomDimensions } from "@/scene/geometry";
import { Button } from "@/components/ui/Button";

export function InspectionPanel({ scene }: { scene: SceneDocument }) {
  const selectedId = useViewerStore((s) => s.selectedId);
  const inspectOpen = useViewerStore((s) => s.inspectOpen);
  const setInspectOpen = useViewerStore((s) => s.setInspectOpen);
  const entity = findEntity(scene, selectedId);
  const units = scene.settings.units;

  if (!inspectOpen) return null;

  return (
    <aside className="glass panel-shadow flex w-80 max-w-full flex-col rounded-2xl p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs uppercase tracking-[0.22em] text-[var(--muted)]">Inspect</p>
        <button className="text-[var(--muted)]" onClick={() => setInspectOpen(false)} aria-label="Close inspection">
          ×
        </button>
      </div>
      {!entity ? (
        <p className="text-sm text-[var(--muted)]">Select a room, door, window, or object.</p>
      ) : (
        <div className="space-y-3 text-sm">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Object</p>
            <h3 className="font-serif text-2xl">{entity.name}</h3>
          </div>
          <Row label="Type" value={entity.type} />
          {entity.dimensions ? (
            <Row
              label="Dimensions"
              value={
                entity.kind === "room"
                  ? `${formatMeters(entity.dimensions.width, units)} × ${formatMeters(entity.dimensions.length ?? 0, units)} × ${formatMeters(entity.dimensions.height, units)} · ${entity.dimensions.area?.toFixed(2)} m²`
                  : `${Math.round((entity.dimensions.width ?? 0) * 100)} × ${Math.round((entity.dimensions.depth ?? entity.dimensions.length ?? 0) * 100)} × ${Math.round(entity.dimensions.height * 100)} cm`
              }
            />
          ) : null}
          {entity.material ? <Row label="Material" value={entity.material} /> : null}
          {entity.estimatedCost ? <Row label="Estimated cost" value={`₹ ${entity.estimatedCost.toLocaleString("en-IN")}`} /> : null}
          {entity.manufacturer ? <Row label="Manufacturer" value={entity.manufacturer} /> : null}
          {entity.confidence ? (
            <Row
              label="Confidence"
              value={
                entity.confidence.source === "cad"
                  ? `${Math.round(entity.confidence.score * 100)}% · CAD`
                  : `${Math.round(entity.confidence.score * 100)}% · ${entity.confidence.source}${entity.confidence.source !== "reference" && entity.confidence.source !== "user" && entity.confidence.source !== "demo" ? " · Estimated / Inferred" : ""}`
              }
            />
          ) : null}
          {entity.source?.type === "cad" ? (
            <>
              <Row label="Source" value="CAD" />
              {entity.source.filename ? <Row label="File" value={entity.source.filename} /> : null}
              {entity.source.layer ? <Row label="Layer" value={entity.source.layer} /> : null}
              {entity.source.entityType ? <Row label="Entity" value={`${entity.source.entityType}${entity.source.entityId ? ` ${entity.source.entityId}` : ""}`} /> : null}
              {entity.source.block ? <Row label="Block" value={entity.source.block} /> : null}
              {entity.confidence?.notes ? <Row label="Trace" value={entity.confidence.notes} /> : null}
            </>
          ) : entity.sourceReferenceId ? (
            <Row label="Source" value={entity.sourceReferenceId} />
          ) : null}
          {entity.extras
            ? Object.entries(entity.extras).map(([k, v]) => <Row key={k} label={k} value={String(v)} />)
            : null}
        </div>
      )}
      {selectedId && entity?.kind === "room" ? <RoomExtra scene={scene} roomId={selectedId} /> : null}
      <div className="mt-4 text-xs text-[var(--muted)]">Click doors to open or close. Click furniture to inspect.</div>
    </aside>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--muted)]">{label}</p>
      <p>{value}</p>
    </div>
  );
}

function RoomExtra({ scene, roomId }: { scene: SceneDocument; roomId: string }) {
  const room = scene.levels.flatMap((l) => l.rooms).find((r) => r.id === roomId);
  if (!room) return null;
  const dim = roomDimensions(room);
  return (
    <div className="mt-4 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
      Area {dim.area} m² · {room.objects.length} objects
    </div>
  );
}

export function MeasurementReadout({ scene }: { scene: SceneDocument }) {
  const distance = useViewerStore((s) => s.measureDistance);
  const tool = useViewerStore((s) => s.editorTool);
  const clear = useViewerStore((s) => s.clearMeasure);
  if (tool !== "measure") return null;
  return (
    <div className="glass rounded-full px-4 py-2 text-sm">
      {distance === null ? "Click two points to measure" : `Distance: ${formatMeters(distance, scene.settings.units)}`}
      {distance !== null ? (
        <Button variant="ghost" className="ml-2 px-2 py-0 text-xs" onClick={clear}>
          Clear
        </Button>
      ) : null}
    </div>
  );
}
