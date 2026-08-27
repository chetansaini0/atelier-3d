"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReferenceDropzone, type CadUpload } from "@/components/upload/ReferenceDropzone";
import { SettingsForm } from "@/components/generation/SettingsForm";
import { ProgressScreen } from "@/components/generation/ProgressScreen";
import { CadPreview } from "@/components/cad/CadPreview";
import { CadAnalysisPanel } from "@/components/cad/CadAnalysisPanel";
import { CadDwgPanel } from "@/components/cad/CadDwgPanel";
import { Button } from "@/components/ui/Button";
import { defaultSettings } from "@/ai/SceneInterpreter";
import { heuristicProvider } from "@/ai/providers/heuristic";
import { runProgress } from "@/ai/providers/demo";
import { useProjectStore } from "@/store/projectStore";
import { cadProcessor } from "@/cad/CADProcessor";
import { sampleVillaDxf, SAMPLE_DXF_FILENAME } from "@/cad/sampleDxf";
import { mergeCadWithVision } from "@/cad/hybrid";
import type { CadLayerCategory, CadProcessResult, CadUnits } from "@/cad/types";
import type { AnalysisResult } from "@/ai/VisionAnalyzer";
import type { GenerationSettings, ReferenceImage } from "@/types/scene";
import { sanitizeText } from "@/utils/files";

export default function NewProjectPage() {
  const router = useRouter();
  const createProject = useProjectStore((s) => s.createProject);
  const [refs, setRefs] = useState<ReferenceImage[]>([]);
  const [cad, setCad] = useState<CadUpload | null>(null);
  const [cadResult, setCadResult] = useState<CadProcessResult | null>(null);
  const [units, setUnits] = useState<CadUnits>("millimeters");
  const [layerMap, setLayerMap] = useState<Record<string, CadLayerCategory>>({});
  const [hidden, setHidden] = useState<Set<CadLayerCategory>>(new Set(["electrical", "plumbing", "annotation"]));
  const [scaleOk, setScaleOk] = useState(false);
  const [dwgBusy, setDwgBusy] = useState(false);
  const [settings, setSettings] = useState<GenerationSettings>(defaultSettings());
  const [description, setDescription] = useState("");
  const [phase, setPhase] = useState<"form" | "generate" | "error">("form");
  const [percent, setPercent] = useState(0);
  const [stage, setStage] = useState("Analyzing reference");
  const [warnings, setWarnings] = useState<string[]>([]);

  const analyzed = useMemo(() => {
    if (!cadResult?.document) return cadResult;
    return cadProcessor.analyzeDocument(cadResult.document, { units, layerMap });
  }, [cadResult?.document, units, layerMap]);

  const loadDxf = (text: string, filename: string) => {
    try {
      const doc = cadProcessor.parseCAD(text, filename);
      const result = cadProcessor.analyzeDocument(doc);
      setCadResult(result);
      setUnits(doc.units);
      setLayerMap(Object.fromEntries(doc.layers.map((l) => [l.name, l.category])));
      setScaleOk(!result.scaleWarning?.unusual);
    } catch (error) {
      setCadResult({
        status: "error",
        message: error instanceof Error ? error.message : "DXF parse failed.",
        sceneReady: false,
      });
    }
  };

  const onCad = (file: CadUpload | null) => {
    setCad(file);
    setCadResult(null);
    setScaleOk(false);
    if (!file) return;
    if (file.format === "dxf" && file.text) loadDxf(file.text, file.name);
    if (file.format === "dwg") {
      setCadResult({
        status: "dxf-required",
        message:
          "Your DWG contains CAD information that can be reconstructed in 3D. Process it on the server, or upload an ASCII DXF instead.",
        sceneReady: false,
      });
    }
  };

  const processDwg = async () => {
    if (!cad?.bytes) return;
    setDwgBusy(true);
    try {
      const form = new FormData();
      form.append("file", new Blob([cad.bytes as BlobPart], { type: "application/octet-stream" }), cad.name);
      const res = await fetch("/api/cad/process", { method: "POST", body: form });
      const result = (await res.json()) as CadProcessResult;
      setCadResult(result);
      if (result.document) {
        setUnits(result.document.units);
        setLayerMap(Object.fromEntries(result.document.layers.map((l) => [l.name, l.category])));
        setScaleOk(!result.scaleWarning?.unusual);
      }
    } finally {
      setDwgBusy(false);
    }
  };

  const generate = async () => {
    setPhase("generate");
    setPercent(8);
    setStage("Analyzing CAD");

    const progress = runProgress((p) => {
      setStage(p.stage);
      setPercent(p.percent);
    }, 3500);

    try {
      let cadScene = analyzed?.document
        ? cadProcessor.generateSceneJSON(analyzed.document, {
            units,
            layerMap,
            settings,
            references: refs,
            description: sanitizeText(description),
          }).scene
        : null;

      if (cadScene && refs.some((r) => r.dataUrl?.startsWith("data:image"))) {
        setStage("Hybrid CAD + vision");
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            references: refs.map((r) => ({ ...r, dataUrl: r.dataUrl?.startsWith("data:image") ? r.dataUrl : undefined })),
            settings,
            description: sanitizeText(description),
          }),
        });
        const vision = (await res.json()) as AnalysisResult;
        cadScene = mergeCadWithVision(cadScene, vision.scene);
        setWarnings([
          ...(vision.warnings ?? []),
          "CAD measurements take priority over AI estimates.",
        ]);
      }

      if (cadScene) {
        await progress;
        const stored = {
          ...cadScene,
          references: cadScene.references.map((ref) => {
            const { dataUrl: _dataUrl, ...rest } = ref;
            void _dataUrl;
            return rest;
          }),
        };
        const id = createProject(stored.project.name, stored);
        router.push(`/projects/${id}`);
        return;
      }

      const payload = {
        references: refs.map((r) => ({ ...r, dataUrl: r.dataUrl?.startsWith("data:image") ? r.dataUrl : undefined })),
        settings,
        description: sanitizeText(description),
      };
      let result: AnalysisResult | null = null;
      try {
        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        result = (await res.json()) as AnalysisResult;
      } catch {
        result = await heuristicProvider.analyze(payload, (p) => {
          setStage(p.stage);
          setPercent(p.percent);
        });
      }
      await progress;
      if (!result?.scene) {
        setPhase("error");
        return;
      }
      setWarnings(result.warnings ?? []);
      const stored = {
        ...result.scene,
        references: result.scene.references.map((ref) => {
          const { dataUrl, ...rest } = ref;
          void dataUrl;
          return rest;
        }),
      };
      const id = createProject(stored.project.name, stored);
      router.push(`/projects/${id}`);
    } catch {
      setPhase("error");
    }
  };

  if (phase === "generate") {
    return (
      <div className="min-h-screen px-8 py-16">
        <ProgressScreen percent={percent} stage={stage} />
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-lg px-6 py-24">
        <h1 className="font-serif text-4xl">Could not confidently identify this object.</h1>
        <p className="mt-4 text-[var(--muted)]">Would you like to:</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Button onClick={() => setPhase("form")}>Add manually</Button>
          <Button variant="line" onClick={() => void generate()}>
            Try AI analysis again
          </Button>
          <Button variant="ghost" onClick={() => router.push("/demo")}>
            Ignore · open demo
          </Button>
        </div>
      </div>
    );
  }

  const canGenerateCad = Boolean(analyzed?.sceneReady && analyzed.document && (!analyzed.scaleWarning?.unusual || scaleOk));

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-xs uppercase tracking-[0.28em] text-[var(--brass)]">New environment</p>
      <h1 className="font-serif mt-2 text-5xl">Upload reference</h1>
      <p className="mt-3 max-w-2xl text-[var(--muted)]">
        Upload a DWG or DXF to reconstruct walls, doors, and rooms from CAD geometry. Add interior photos for materials
        and furniture appearance. Images never override CAD measurements.
      </p>
      <div className="mt-10">
        <ReferenceDropzone files={refs} onChange={setRefs} cad={cad} onCad={onCad} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          variant="line"
          onClick={() => {
            const text = sampleVillaDxf();
            setCad({ id: "sample", name: SAMPLE_DXF_FILENAME, format: "dxf", text });
            loadDxf(text, SAMPLE_DXF_FILENAME);
          }}
        >
          Load sample DXF
        </Button>
      </div>

      {cad?.format === "dwg" && cadResult?.status === "dxf-required" ? (
        <div className="mt-8">
          <CadDwgPanel filename={cad.name} message={cadResult.message} processing={dwgBusy} onProcess={() => void processDwg()} />
        </div>
      ) : null}

      {cadResult?.status === "error" ? <p className="mt-6 text-sm text-[var(--danger)]">{cadResult.message}</p> : null}

      {analyzed?.document && analyzed.elements && analyzed.report ? (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <CadPreview document={analyzed.document} elements={analyzed.elements} hiddenCategories={hidden} />
          <CadAnalysisPanel
            layers={analyzed.document.layers}
            report={analyzed.report}
            scaleWarning={analyzed.scaleWarning}
            units={units}
            onUnits={setUnits}
            layerMap={layerMap}
            onLayerMap={(name, category) => setLayerMap((m) => ({ ...m, [name]: category }))}
            hidden={hidden}
            onToggleCategory={(cat) => {
              const next = new Set(hidden);
              if (next.has(cat)) next.delete(cat);
              else next.add(cat);
              setHidden(next);
            }}
            scaleOk={scaleOk}
            onScaleOk={setScaleOk}
          />
        </div>
      ) : null}

      <label className="mt-8 block">
        <span className="text-xs uppercase tracking-[0.18em] text-[var(--muted)]">Optional description</span>
        <textarea
          className="glass mt-2 min-h-28 w-full rounded-2xl p-4 outline-none"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Two-storey villa, oak floors, sage kitchen…"
        />
      </label>
      <div className="mt-10">
        <h2 className="mb-4 font-serif text-3xl">Scene configuration</h2>
        <SettingsForm value={settings} onChange={setSettings} />
      </div>
      {warnings.length ? (
        <ul className="mt-6 text-sm text-[var(--muted)]">
          {warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      <div className="mt-10 flex gap-3">
        <Button onClick={() => void generate()} disabled={Boolean(cad) && !canGenerateCad}>
          Generate 3D environment
        </Button>
        <Button variant="line" onClick={() => router.push("/demo")}>
          Skip to demo villa
        </Button>
      </div>
      <p className="mt-4 text-xs text-[var(--muted)]">
        DWG is never modified. Processed CAD data and scene JSON are stored separately from the original file.
      </p>
    </div>
  );
}
