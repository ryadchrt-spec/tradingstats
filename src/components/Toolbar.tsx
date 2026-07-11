import { useRef } from "react";
import { useStore } from "../store";
import type { AppData } from "../types";

export function Toolbar() {
  const data = useStore((s) => s.data);
  const importData = useStore((s) => s.importData);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleExport() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `productivite-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileRef.current?.click();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as AppData;
      if (!parsed.dashboard || !parsed.health) throw new Error("format invalide");
      importData(parsed);
    } catch {
      alert("Fichier JSON invalide.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExport}
        className="h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Exporter
      </button>
      <button
        onClick={handleImportClick}
        className="h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Importer
      </button>
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />
    </div>
  );
}
