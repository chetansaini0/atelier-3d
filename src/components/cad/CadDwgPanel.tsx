"use client";

import { Button } from "@/components/ui/Button";

export function CadDwgPanel({
  filename,
  message,
  processing,
  onProcess,
}: {
  filename: string;
  message: string;
  processing: boolean;
  onProcess: () => void;
}) {
  return (
    <div className="glass rounded-2xl p-6">
      <p className="text-xs uppercase tracking-[0.18em] text-[var(--brass)]">CAD file detected</p>
      <h2 className="font-serif mt-2 text-3xl">DWG processing</h2>
      <p className="mt-3 text-sm text-[var(--muted)]">
        {filename} contains CAD information that can be reconstructed in 3D. This is not a flat image preview.
      </p>
      <p className="mt-3 text-sm">{message}</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={onProcess} disabled={processing}>
          {processing ? "Processing…" : "Process DWG"}
        </Button>
        <label htmlFor="cad-upload" className="inline-flex cursor-pointer">
          <span className="rounded-full border border-[var(--line)] px-4 py-2 text-sm">Upload DXF instead</span>
        </label>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        Direct DWG conversion uses a licensed server converter when configured. Otherwise export ASCII DXF from AutoCAD,
        BricsCAD, or LibreCAD. Do not use an untrusted online converter.
      </p>
    </div>
  );
}
