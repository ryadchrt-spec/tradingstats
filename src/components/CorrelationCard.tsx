import { Fragment, useMemo, useState } from "react";
import type { AppData } from "../types";
import { scoreToNum, dashboardHabitValue, healthHabitValue } from "../compute";
import { COLORS } from "../chartColors";

interface HabitOption {
  key: string;
  label: string;
  valueAt: (date: string) => number | null;
}

function buildHabitOptions(data: AppData): HabitOption[] {
  const dash = data.dashboardHabits.map((h) => ({
    key: `dashboard:${h.id}`,
    label: `${h.short} (Dashboard)`,
    valueAt: (date: string) => scoreToNum(dashboardHabitValue(data.dashboard[date], h)),
  }));
  const heal = data.healthHabits.map((h) => ({
    key: `health:${h.id}`,
    label: `${h.short} (Health)`,
    valueAt: (date: string) => scoreToNum(healthHabitValue(data.health[date], h)),
  }));
  return [...dash, ...heal];
}

// Pearson correlation coefficient between two series, ignoring any day where
// either habit has no value — a missing entry on one side shouldn't count
// against the other. Requires at least 3 shared data points to be meaningful.
function pearsonCorrelation(pairs: [number, number][]): number | null {
  const n = pairs.length;
  if (n < 3) return null;
  const xs = pairs.map((p) => p[0]);
  const ys = pairs.map((p) => p[1]);
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let denX = 0;
  let denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }
  if (denX === 0 || denY === 0) return null;
  return num / Math.sqrt(denX * denY);
}

function correlationLabel(r: number): string {
  const abs = Math.abs(r);
  const strength = abs >= 0.7 ? "forte" : abs >= 0.4 ? "modérée" : abs >= 0.2 ? "faible" : "très faible";
  const direction = r > 0.02 ? "positive" : r < -0.02 ? "négative" : "nulle";
  return `${strength} ${direction}`;
}

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Each habit only ever takes 3 values (0%, 50%, 100%), so a scatter plot has
// at most 9 possible positions — a 3x3 grid of "how many days had this exact
// combination" reads far more directly than a bubble chart at that scale.
const ROWS: [number, string][] = [
  [1, "100%"],
  [0.5, "50%"],
  [0, "0%"],
];
const COLS: [number, string][] = [
  [0, "0%"],
  [0.5, "50%"],
  [1, "100%"],
];

export function CorrelationCard({ dates, data, dark }: { dates: string[]; data: AppData; dark: boolean }) {
  const c = dark ? COLORS.dark : COLORS.light;
  const options = useMemo(() => buildHabitOptions(data), [data]);
  const [keyA, setKeyA] = useState("");
  const [keyB, setKeyB] = useState("");

  if (options.length < 2) return null;

  const optA = options.find((o) => o.key === keyA) ?? options[0];
  const optB = options.find((o) => o.key === keyB) ?? options[1] ?? options[0];

  const pairs: [number, number][] = [];
  for (const date of dates) {
    const a = optA.valueAt(date);
    const b = optB.valueAt(date);
    if (a !== null && b !== null) pairs.push([a, b]);
  }
  const r = pearsonCorrelation(pairs);

  const grid = ROWS.map(([av]) => COLS.map(([bv]) => pairs.filter(([a, b]) => a === av && b === bv).length));
  const maxCount = Math.max(1, ...grid.flat());

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Corrélation entre habitudes</h3>
      <div className="flex flex-wrap items-center gap-2 mb-3 text-sm text-slate-600 dark:text-slate-300">
        <select
          value={optA.key}
          onChange={(e) => setKeyA(e.target.value)}
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
        <span className="text-slate-400">vs</span>
        <select
          value={optB.key}
          onChange={(e) => setKeyB(e.target.value)}
          className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
        >
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {r === null ? (
        <p className="text-sm text-slate-400 dark:text-slate-500">
          Pas assez de jours avec les deux habitudes renseignées ({pairs.length} jour(s) commun(s), 3 minimum).
        </p>
      ) : (
        <>
          <p className="text-sm mb-4 text-slate-600 dark:text-slate-300">
            <span className="font-semibold tabular-nums">r = {r.toFixed(2)}</span>{" "}
            <span className="text-slate-500 dark:text-slate-400">
              — corrélation {correlationLabel(r)} ({pairs.length} jours communs)
            </span>
          </p>

          <div className="flex gap-2 max-w-md">
            <div
              className="shrink-0 flex items-center justify-center text-[11px] text-slate-500 dark:text-slate-400 text-center"
              style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
            >
              {optA.label}
            </div>
            <div className="flex-1">
              <div className="grid gap-1" style={{ gridTemplateColumns: "44px repeat(3, 1fr)" }}>
                <div />
                {COLS.map(([, label]) => (
                  <div key={label} className="text-center text-[11px] text-slate-500 dark:text-slate-400 pb-1">
                    {label}
                  </div>
                ))}
                {ROWS.map(([av, aLabel], ri) => (
                  <Fragment key={aLabel}>
                    <div className="flex items-center justify-end pr-1 text-[11px] text-slate-500 dark:text-slate-400">
                      {aLabel}
                    </div>
                    {COLS.map(([bv, bLabel], ci) => {
                      const count = grid[ri][ci];
                      const alpha = count === 0 ? 0 : 0.15 + 0.65 * (count / maxCount);
                      return (
                        <div
                          key={`${av}-${bv}`}
                          title={`${optA.label} = ${aLabel} et ${optB.label} = ${bLabel} : ${count} jour(s)`}
                          className="aspect-square rounded-md flex items-center justify-center text-sm font-semibold tabular-nums"
                          style={{ background: hexToRgba(c.series1, alpha), color: alpha > 0.45 ? "#fff" : c.primary }}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      );
                    })}
                  </Fragment>
                ))}
              </div>
              <div className="text-center text-[11px] text-slate-500 dark:text-slate-400 mt-1">{optB.label}</div>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
            Chaque case = le nombre de jours où {optA.label} et {optB.label} avaient ces deux valeurs à la fois.
            Plus la case est foncée, plus ça arrive souvent.
          </p>
        </>
      )}
    </div>
  );
}
