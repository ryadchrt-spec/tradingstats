import { useState } from "react";
import { MonthNav } from "./components/MonthNav";
import { DashboardTable } from "./components/DashboardTable";
import { HealthTable } from "./components/HealthTable";
import { StatsView } from "./components/StatsView";
import { Toolbar } from "./components/Toolbar";

type Tab = "dashboard" | "health" | "stats";

const TABS: { key: Tab; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "health", label: "Health" },
  { key: "stats", label: "Statistiques" },
];

export default function App() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-[1400px] px-4 py-6 flex flex-col gap-5">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold tracking-tight">TradingStats — Suivi de Productivité</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Habitudes quotidiennes, tâches et santé — un tableau de bord vivant.
            </p>
          </div>
          <Toolbar />
        </header>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav className="flex gap-1 rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-white dark:bg-slate-900 w-fit">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
          <MonthNav year={year} month={month} onChange={(y, m) => { setYear(y); setMonth(m); }} />
        </div>

        <main>
          {tab === "dashboard" && <DashboardTable year={year} month={month} />}
          {tab === "health" && <HealthTable year={year} month={month} />}
          {tab === "stats" && <StatsView year={year} month={month} />}
        </main>

        <footer className="text-xs text-slate-400 dark:text-slate-600 text-center py-4">
          Données enregistrées localement dans votre navigateur.
        </footer>
      </div>
    </div>
  );
}
