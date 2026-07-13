import { useState } from "react";
import { useStore } from "../store";
import { shortDateLabelFr } from "../dateUtils";

export function AnnotationManager() {
  const annotations = useStore((s) => s.data.annotations);
  const addAnnotation = useStore((s) => s.addAnnotation);
  const removeAnnotation = useStore((s) => s.removeAnnotation);
  const [open, setOpen] = useState(false);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [label, setLabel] = useState("");

  function handleAdd() {
    if (!start || !end) return;
    addAnnotation(start, end, label);
    setStart("");
    setEnd("");
    setLabel("");
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        <span>Périodes annotées ({annotations.length})</span>
        <span className="text-slate-400 text-xs">{open ? "Masquer ▲" : "Modifier ▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Les jours dans une période annotée (vacances, maladie…) sont exclus des moyennes et comparaisons partout
            dans l'app. Les données restent visibles et modifiables dans Dashboard, Health et Calories.
          </p>
          {annotations.map((a) => (
            <div key={a.id} className="flex items-center gap-2">
              <span className="flex-1 text-sm text-slate-700 dark:text-slate-200">
                {a.label}{" "}
                <span className="text-slate-400 dark:text-slate-500">
                  ({shortDateLabelFr(a.start)} → {shortDateLabelFr(a.end)})
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAnnotation(a.id)}
                className="h-7 w-7 shrink-0 rounded-md border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-700 text-sm"
                aria-label={`Supprimer ${a.label}`}
                title="Supprimer cette période"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Ex : Vacances"
              className="flex-1 min-w-[120px] rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!start || !end}
              className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:hover:bg-blue-600 text-white text-sm font-medium"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
