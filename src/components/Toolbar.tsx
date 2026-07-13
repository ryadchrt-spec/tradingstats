import { useRef, useState } from "react";
import { useStore } from "../store";
import type { AppData } from "../types";
import { parseWorkbookFile } from "../excelImport";
import { defaultProfile, defaultDashboardHabits, defaultHealthHabits } from "../emptyRecords";

export function Toolbar() {
  const data = useStore((s) => s.data);
  const importData = useStore((s) => s.importData);
  const mergeData = useStore((s) => s.mergeData);
  const fileRef = useRef<HTMLInputElement>(null);
  const excelRef = useRef<HTMLInputElement>(null);
  const [excelBusy, setExcelBusy] = useState(false);

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
      const parsed = JSON.parse(text) as Partial<AppData>;
      if (!parsed.dashboard || !parsed.health) throw new Error("format invalide");
      // Older exports predate the calories/profile/dashboardHabits fields —
      // backfill them so the store always has a complete AppData shape.
      importData({
        dashboard: parsed.dashboard,
        health: parsed.health,
        calories: parsed.calories ?? {},
        profile: { ...defaultProfile(), ...(parsed.profile ?? {}) },
        dashboardHabits: parsed.dashboardHabits ?? defaultDashboardHabits(),
        healthHabits: parsed.healthHabits ?? defaultHealthHabits(),
      });
    } catch {
      alert("Fichier JSON invalide.");
    } finally {
      e.target.value = "";
    }
  }

  function handleExcelClick() {
    excelRef.current?.click();
  }

  async function handleExcelFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setExcelBusy(true);
    try {
      let totalDashboard = 0;
      let totalHealth = 0;
      const failed: string[] = [];
      for (const file of files) {
        try {
          const { data: parsed, summary } = await parseWorkbookFile(file);
          if (summary.dashboardDays === 0 && summary.healthDays === 0) {
            failed.push(file.name);
            continue;
          }
          mergeData(parsed);
          totalDashboard += summary.dashboardDays;
          totalHealth += summary.healthDays;
        } catch {
          failed.push(file.name);
        }
      }
      const parts = [`${totalDashboard} jour(s) Dashboard`, `${totalHealth} jour(s) Health`];
      let msg = `Import terminé : ${parts.join(", ")} ajoutés/mis à jour.`;
      if (failed.length) msg += `\n\nNon reconnus (structure inattendue) : ${failed.join(", ")}`;
      alert(msg);
    } finally {
      setExcelBusy(false);
      e.target.value = "";
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleExcelClick}
        disabled={excelBusy}
        className="h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
      >
        {excelBusy ? "Import…" : "Importer Excel"}
      </button>
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
        Importer JSON
      </button>
      <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleFile} />
      <input
        ref={excelRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        multiple
        className="hidden"
        onChange={handleExcelFile}
      />
    </div>
  );
}
