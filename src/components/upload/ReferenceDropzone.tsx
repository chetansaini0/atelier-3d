"use client";

import { useCallback, useState } from "react";
import type { ReferenceImage } from "@/types/scene";
import { createId } from "@/utils/ids";
import { fileToDataUrl, fileToText, isCadFile, validateReferenceFile } from "@/utils/files";
import { Button } from "@/components/ui/Button";

export type CadUpload = {
  id: string;
  name: string;
  format: "dwg" | "dxf";
  text?: string;
  bytes?: Uint8Array;
};

export function ReferenceDropzone({
  files,
  onChange,
  cad,
  onCad,
}: {
  files: ReferenceImage[];
  onChange: (files: ReferenceImage[]) => void;
  cad: CadUpload | null;
  onCad: (file: CadUpload | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const ingest = useCallback(
    async (list: FileList | File[]) => {
      const next = [...files];
      for (const file of Array.from(list)) {
        const problem = validateReferenceFile(file);
        if (problem) {
          setError(problem);
          continue;
        }
        if (isCadFile(file)) {
          const format = file.name.toLowerCase().endsWith(".dwg") ? "dwg" : "dxf";
          if (format === "dxf") {
            onCad({ id: createId("cad"), name: file.name, format, text: await fileToText(file) });
          } else {
            onCad({ id: createId("cad"), name: file.name, format, bytes: new Uint8Array(await file.arrayBuffer()) });
          }
          continue;
        }
        const dataUrl = await fileToDataUrl(file);
        next.push({
          id: createId("ref"),
          name: file.name,
          mimeType: file.type || "application/octet-stream",
          role: guessRole(file.name),
          dataUrl,
        });
      }
      onChange(next.slice(0, 8));
    },
    [files, onCad, onChange],
  );

  return (
    <div>
      <label
        className={`glass flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-3xl border-dashed p-8 text-center ${dragging ? "border-[var(--brass)]" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void ingest(e.dataTransfer.files);
        }}
      >
        <p className="font-serif text-3xl">Drop your design here</p>
        <p className="mt-2 text-sm text-[var(--muted)]">
          DWG, DXF, PNG, JPG, WEBP, SVG, PDF · CAD is reconstructed as geometry, not a flat image
        </p>
        <input
          id="cad-upload"
          className="sr-only"
          type="file"
          multiple
          accept=".dwg,.dxf,image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
          suppressHydrationWarning
          onChange={(e) => e.target.files && void ingest(e.target.files)}
        />
      </label>
      {error ? <p className="mt-2 text-sm text-[var(--danger)]">{error}</p> : null}
      {cad ? (
        <div className="glass mt-4 flex items-center justify-between rounded-2xl p-3 text-sm">
          <span>
            CAD: {cad.name} · {cad.format.toUpperCase()}
          </span>
          <Button variant="ghost" className="text-xs" onClick={() => onCad(null)}>
            Remove CAD
          </Button>
        </div>
      ) : null}
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {files.map((file, index) => (
          <li key={file.id} className="glass overflow-hidden rounded-2xl">
            {file.dataUrl && file.mimeType.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={file.dataUrl} alt={file.name} className="h-28 w-full object-cover" />
            ) : (
              <div className="grid h-28 place-items-center text-xs text-[var(--muted)]">PDF / file</div>
            )}
            <div className="flex items-center justify-between p-2 text-xs">
              <span className="truncate">{file.name}</span>
              <select
                className="bg-transparent"
                value={file.role}
                onChange={(e) => {
                  const next = [...files];
                  next[index] = { ...file, role: e.target.value as ReferenceImage["role"] };
                  onChange(next);
                }}
              >
                <option value="floor-plan">Floor plan</option>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="material">Material</option>
                <option value="cad">CAD</option>
                <option value="other">Other</option>
              </select>
            </div>
            <Button variant="ghost" className="w-full text-xs" onClick={() => onChange(files.filter((f) => f.id !== file.id))}>
              Remove
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function guessRole(name: string): ReferenceImage["role"] {
  const n = name.toLowerCase();
  if (n.endsWith(".dwg") || n.endsWith(".dxf")) return "cad";
  if (n.includes("plan") || n.includes("blueprint")) return "floor-plan";
  if (n.includes("kitchen") || n.includes("living") || n.includes("bed") || n.includes("bath")) return "interior";
  if (n.includes("elev") || n.includes("facade") || n.includes("garden")) return "exterior";
  if (n.includes("material") || n.includes("finish") || n.includes("texture")) return "material";
  return "other";
}
