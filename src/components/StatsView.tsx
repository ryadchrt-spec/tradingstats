import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { useStore } from "../store";
import { DASHBOARD_HABITS, HEALTH_HABITS } from "../habits";
import { shortDateLabelFr } from "../dateUtils";
import { average, dashboardDayWin, healthDayAverage, hasAnyDashboardData, currentStreak, daysTracked, scoreToNum } from "../compute";
import { useDarkMode } from "../useDarkMode";
import { StatTile } from "./StatItem";
import {
  RANGE_PRESETS,
  COMPARE_PRESETS,
  resolveRange,
  rangeDates,
  chunkAverage,
  chunkDates,
  type RangePreset,
} from "../ranges";

const COLORS = {
  light: {
    surface: "#fcfcfb",
    grid: "#e1e0d9",
    axis: "#898781",
    primary: "#0b0b0b",
    secondary: "#52514e",
    series1: "#2a78d6",
    series2: "#1baf7a",
  },
  dark: {
    surface: "#1a1a19",
    grid: "#2c2c2a",
    axis: "#898781",
    primary: "#ffffff",
    secondary: "#c3c2b7",
    series1: "#3987e5",
    series2: "#199e70",
  },
};

function ChartTooltip({ active, payload, label, dark, unit }: any) {
  if (!active || !payload || !payload.length) return null;
  const c = dark ? COLORS.dark : COLORS.light;
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
      <div style={{ color: c.secondary, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color, display: "inline-block" }} />
          {p.value === null || p.value === undefined ? "—" : `${Math.round(p.value)}${unit}`}
        </div>
      ))}
    </div>
  );
}

function habitBreakdown(
  dates: string[],
  data: ReturnType<typeof useStore.getState>["data"]
) {
  const dashboardBars = DASHBOARD_HABITS.map((h) => ({
    name: h.short,
    value: average(dates.map((date) => scoreToNum(data.dashboard[date]?.[h.key]))),
  }))
    .filter((b) => b.value !== null)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .map((b) => ({ ...b, value: Math.round((b.value as number) * 100) }));

  const healthBars = HEALTH_HABITS.map((h) => ({
    name: h.short,
    value: average(dates.map((date) => scoreToNum(data.health[date]?.[h.key]))),
  }))
    .filter((b) => b.value !== null)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .map((b) => ({ ...b, value: Math.round((b.value as number) * 100) }));

  return { dashboardBars, healthBars };
}

export function StatsView({ year, month }: { year: number; month: number }) {
  const data = useStore((s) => s.data);
  const dark = useDarkMode();
  const c = dark ? COLORS.dark : COLORS.light;

  const [primaryPreset, setPrimaryPreset] = useState<RangePreset>("month");
  const [comparePreset, setComparePreset] = useState<RangePreset | "none">("none");

  const monthAnchor = { year, month };

  const primaryRange = useMemo(() => resolveRange(primaryPreset, data, monthAnchor), [primaryPreset, data, year, month]);
  const primaryDates = useMemo(() => rangeDates(primaryRange), [primaryRange.start, primaryRange.end]);

  const primaryDayWins = useMemo(
    () =>
      primaryDates.map((date) => {
        const d = data.dashboard[date];
        const hAvg = healthDayAverage(data.health[date]);
        return hasAnyDashboardData(d) ? dashboardDayWin(d, hAvg) : null;
      }),
    [data, primaryDates.join(",")]
  );

  const isComparing = comparePreset !== "none";
  const compareRange = useMemo(
    () => (isComparing ? resolveRange(comparePreset as RangePreset, data, monthAnchor, primaryRange) : null),
    [comparePreset, data, year, month, primaryRange.start, primaryRange.end]
  );
  const compareDates = useMemo(() => (compareRange ? rangeDates(compareRange) : []), [compareRange?.start, compareRange?.end]);
  const compareDayWins = useMemo(
    () =>
      compareDates.map((date) => {
        const d = data.dashboard[date];
        const hAvg = healthDayAverage(data.health[date]);
        return hasAnyDashboardData(d) ? dashboardDayWin(d, hAvg) : null;
      }),
    [data, compareDates.join(",")]
  );

  // Cap points so long ranges stay readable; a single month (<=31 days) stays daily, unchanged.
  const targetPoints = Math.min(primaryDates.length, 31) || 1;
  const isDaily = primaryPreset === "month";

  const primaryLabelDates = chunkDates(primaryDates, targetPoints);
  const primaryValues = chunkAverage(primaryDayWins, targetPoints).map((v) => (v === null ? null : Math.round(v * 100)));
  const compareValues = isComparing
    ? chunkAverage(compareDayWins, targetPoints).map((v) => (v === null ? null : Math.round(v * 100)))
    : [];

  const lineData = primaryLabelDates.map((date, i) => ({
    x: isDaily ? i + 1 : shortDateLabelFr(date),
    primary: primaryValues[i] ?? null,
    compare: isComparing ? compareValues[i] ?? null : undefined,
  }));

  const { dashboardBars, healthBars } = useMemo(() => habitBreakdown(primaryDates, data), [primaryDates.join(","), data]);

  const monthlyAvg = average(primaryDayWins);
  const tracked = daysTracked(primaryDayWins);
  const streak = currentStreak(primaryDayWins);

  const allBars = [...dashboardBars, ...healthBars];
  const best = allBars.length ? allBars.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  const worst = allBars.length ? allBars.reduce((a, b) => (b.value < a.value ? b : a)) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Période
          <select
            value={primaryPreset}
            onChange={(e) => setPrimaryPreset(e.target.value as RangePreset)}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Comparer avec
          <select
            value={comparePreset}
            onChange={(e) => setComparePreset(e.target.value as RangePreset | "none")}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
          >
            {COMPARE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Day Win moyen" value={monthlyAvg === null ? "—" : `${Math.round(monthlyAvg * 100)}%`} sub={`${tracked}/${primaryDates.length} jours suivis`} />
        <StatTile label="Série en cours" value={`${streak} j`} sub="Day Win ≥ 50%" />
        <StatTile label="Meilleure habitude" value={best ? `${best.value}%` : "—"} sub={best?.name ?? "—"} />
        <StatTile label="À travailler" value={worst ? `${worst.value}%` : "—"} sub={worst?.name ?? "—"} />
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Évolution du Day Win</h3>
          {isComparing && (
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series1 }} />
                {RANGE_PRESETS.find((p) => p.key === primaryPreset)?.label ?? "Période"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series2 }} />
                {COMPARE_PRESETS.find((p) => p.key === comparePreset)?.label ?? "Comparaison"}
              </span>
            </div>
          )}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />
            <XAxis
              dataKey="x"
              tick={{ fill: c.axis, fontSize: 11 }}
              axisLine={{ stroke: c.grid }}
              tickLine={false}
              interval={Math.max(0, Math.floor(lineData.length / 8))}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              tick={{ fill: c.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={44}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ stroke: c.grid }} />
            <Line
              type="monotone"
              dataKey="primary"
              stroke={c.series1}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: c.series1, stroke: c.surface, strokeWidth: 2 }}
              connectNulls
            />
            {isComparing && (
              <Line
                type="monotone"
                dataKey="compare"
                stroke={c.series2}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 4, fill: c.series2, stroke: c.surface, strokeWidth: 2 }}
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Habitudes — Dashboard</h3>
          <ResponsiveContainer width="100%" height={Math.max(160, dashboardBars.length * 32)}>
            <BarChart data={dashboardBars} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke={c.grid} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: c.secondary, fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {dashboardBars.map((_, i) => (
                  <Cell key={i} fill={c.series1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Habitudes — Health</h3>
          <ResponsiveContainer width="100%" height={Math.max(160, healthBars.length * 32)}>
            <BarChart data={healthBars} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }} barCategoryGap={6}>
              <CartesianGrid horizontal={false} stroke={c.grid} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: c.secondary, fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }} />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={16}>
                {healthBars.map((_, i) => (
                  <Cell key={i} fill={c.series1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
