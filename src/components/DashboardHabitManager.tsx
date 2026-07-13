import { useState } from "react";
import { useStore } from "../store";

export function DashboardHabitManager() {
  const habits = useStore((s) => s.data.dashboardHabits);
  const addDashboardHabit = useStore((s) => s.addDashboardHabit);
  const removeDashboardHabit = useStore((s) => s.removeDashboardHabit);
  const renameDashboardHabit = useStore((s) => s.renameDashboardHabit);
  const moveDashboardHabit = useStore((s) => s.moveDashboardHabit);

  const [open, setOpen] = useState(false);
  const [newHabit, setNewHabit] = useState("");

  function handleAdd() {
    if (!newHabit.trim()) return;
    addDashboardHabit(newHabit);
    setNewHabit("");
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"
      >
        <span>Colonnes d'habitudes ({habits.length})</span>
        <span className="text-slate-400 text-xs">{open ? "Masquer ▲" : "Modifier ▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 flex flex-col gap-2">
          {habits.map((h, i) => (
            <div key={h.id} className="flex items-center gap-2">
              <div className="flex flex-col">
                <button
                  type="button"
                  onClick={() => moveDashboardHabit(h.id, "up")}
                  disabled={i === 0}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed leading-none text-xs px-1"
                  aria-label="Monter"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => moveDashboardHabit(h.id, "down")}
                  disabled={i === habits.length - 1}
                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed leading-none text-xs px-1"
                  aria-label="Descendre"
                >
                  ▼
                </button>
              </div>
              <input
                type="text"
                value={h.short}
                onChange={(e) => renameDashboardHabit(h.id, e.target.value)}
                className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
              />
              <button
                type="button"
                onClick={() => removeDashboardHabit(h.id)}
                className="h-7 w-7 shrink-0 rounded-md border border-slate-300 dark:border-slate-700 text-slate-400 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-700 text-sm"
                aria-label={`Supprimer ${h.short}`}
                title="Supprimer cette colonne"
              >
                ✕
              </button>
            </div>
          ))}

          <div className="flex items-center gap-2 pt-2 mt-1 border-t border-slate-100 dark:border-slate-800">
            <input
              type="text"
              value={newHabit}
              onChange={(e) => setNewHabit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Nouvelle habitude…"
              className="flex-1 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleAdd}
              className="h-8 px-3 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              Ajouter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
