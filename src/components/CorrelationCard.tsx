import { useMemo, useState } from "react";
import { ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip } from "recharts";
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

function CorrelationTooltip({ active, payload, dark }: any) {
  if (!active || !payload || !payload.length) return null;
  const c = dark ? COLORS.dark : COLORS.light;
  const p = payload[0].payload;
  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(11,11,11,0.10)"}`,
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 12,
        color: c.primary,
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      }}
    >
      <div>{p.x}% / {p.y}%</div>
      <div style={{ color: c.secondary }}>{p.count} jour(s)</div>
    </div>
  );
}

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
    const x = optA.valueAt(date);
    const y = optB.valueAt(date);
    if (x !== null && y !== null) pairs.push([x, y]);
  }
  const r = pearsonCorrelation(pairs);

  const freq = new Map<string, { x: number; y: number; count: number }>();
  for (const [x, y] of pairs) {
    const xPct = Math.round(x * 100);
    const yPct = Math.round(y * 100);
    const key = `${xPct}-${yPct}`;
    const entry = freq.get(key);
    if (entry) entry.count += 1;
    else freq.set(key, { x: xPct, y: yPct, count: 1 });
  }
  const bubbleData = [...freq.values()];

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
          <p className="text-sm mb-2 text-slate-600 dark:text-slate-300">
            <span className="font-semibold tabular-nums">r = {r.toFixed(2)}</span>{" "}
            <span className="text-slate-500 dark:text-slate-400">
              — corrélation {correlationLabel(r)} ({pairs.length} jours communs)
            </span>
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <ScatterChart margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={c.grid} />
              <XAxis
                type="number"
                dataKey="x"
                name={optA.label}
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tick={{ fill: c.axis, fontSize: 11 }}
                axisLine={{ stroke: c.grid }}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <YAxis
                type="number"
                dataKey="y"
                name={optB.label}
                domain={[0, 100]}
                ticks={[0, 50, 100]}
                tick={{ fill: c.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v) => `${v}%`}
              />
              <ZAxis type="number" dataKey="count" range={[80, 500]} />
              <Tooltip content={<CorrelationTooltip dark={dark} />} cursor={{ strokeDasharray: "3 3" }} />
              <Scatter data={bubbleData} fill={c.series1} fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
          <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 mt-1">
            <span>{optA.label} →</span>
            <span>↑ {optB.label}</span>
          </div>
        </>
      )}
    </div>
  );
}
