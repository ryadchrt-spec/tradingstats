import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { useStore } from "../store";
import { DASHBOARD_HABITS, HEALTH_HABITS } from "../habits";
import { shortDateLabelFr, todayKey, addDaysToKey } from "../dateUtils";
import { average, dashboardDailyAverage, healthDayAverage, hasAnyDashboardData, currentStreak, daysTracked, scoreToNum } from "../compute";
import { useDarkMode } from "../useDarkMode";
import { StatTile } from "./StatItem";
import { ChartTooltip } from "./ChartTooltip";
import { COLORS } from "../chartColors";
import { MonthlyBreakdown } from "./MonthlyBreakdown";
import {
  RANGE_PRESETS,
  COMPARE_PRESETS,
  resolveRange,
  rangeDates,
  chunkAverage,
  chunkDates,
  type RangePreset,
  type DateRange,
} from "../ranges";

type PrimarySelection = RangePreset | "custom";

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

  const [primaryPreset, setPrimaryPreset] = useState<PrimarySelection>("month");
  const [comparePreset, setComparePreset] = useState<RangePreset | "none">("none");
  const [customStart, setCustomStart] = useState<string>(() => addDaysToKey(todayKey(), -29));
  const [customEnd, setCustomEnd] = useState<string>(() => todayKey());

  const monthAnchor = { year, month };

  const primaryRange: DateRange = useMemo(() => {
    if (primaryPreset === "custom") {
      return customStart <= customEnd ? { start: customStart, end: customEnd } : { start: customEnd, end: customStart };
    }
    return resolveRange(primaryPreset, data, monthAnchor);
  }, [primaryPreset, data, year, month, customStart, customEnd]);
  const primaryDates = useMemo(() => rangeDates(primaryRange), [primaryRange.start, primaryRange.end]);

  const primaryDailyAverages = useMemo(
    () =>
      primaryDates.map((date) => {
        const d = data.dashboard[date];
        const hAvg = healthDayAverage(data.health[date]);
        return hasAnyDashboardData(d) ? dashboardDailyAverage(d, hAvg) : null;
      }),
    [data, primaryDates.join(",")]
  );

  const isComparing = comparePreset !== "none";
  const compareRange = useMemo(
    () => (isComparing ? resolveRange(comparePreset as RangePreset, data, monthAnchor, primaryRange) : null),
    [comparePreset, data, year, month, primaryRange.start, primaryRange.end]
  );
  const compareDates = useMemo(() => (compareRange ? rangeDates(compareRange) : []), [compareRange?.start, compareRange?.end]);
  const compareDailyAverages = useMemo(
    () =>
      compareDates.map((date) => {
        const d = data.dashboard[date];
        const hAvg = healthDayAverage(data.health[date]);
        return hasAnyDashboardData(d) ? dashboardDailyAverage(d, hAvg) : null;
      }),
    [data, compareDates.join(",")]
  );

  // Cap points so long ranges stay readable; a single month (<=31 days) stays daily, unchanged.
  const targetPoints = Math.min(primaryDates.length, 31) || 1;
  const isDaily = primaryPreset === "month";

  const primaryLabelDates = chunkDates(primaryDates, targetPoints);
  const primaryValues = chunkAverage(primaryDailyAverages, targetPoints).map((v) => (v === null ? null : Math.round(v * 100)));
  const compareValues = isComparing
    ? chunkAverage(compareDailyAverages, targetPoints).map((v) => (v === null ? null : Math.round(v * 100)))
    : [];

  const lineData = primaryLabelDates.map((date, i) => ({
    x: isDaily ? i + 1 : shortDateLabelFr(date),
    primary: primaryValues[i] ?? null,
    compare: isComparing ? compareValues[i] ?? null : undefined,
  }));

  const { dashboardBars, healthBars } = useMemo(() => habitBreakdown(primaryDates, data), [primaryDates.join(","), data]);

  const monthlyAvg = average(primaryDailyAverages);
  const tracked = daysTracked(primaryDailyAverages);
  const streak = currentStreak(primaryDailyAverages);

  // "Day Win" itself — the manually-checked trading outcome, kept separate from the
  // computed daily average above (mirrors the source spreadsheet's column S).
  const dayWinValues = primaryDates.map((date) => scoreToNum(data.dashboard[date]?.dayWin));
  const dayWinPct = average(dayWinValues);
  const dayWinTracked = daysTracked(dayWinValues);

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
            onChange={(e) => setPrimaryPreset(e.target.value as PrimarySelection)}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
          >
            {RANGE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
            <option value="custom">Personnalisé…</option>
          </select>
        </label>

        {primaryPreset === "custom" && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="date"
              value={customStart}
              max={customEnd}
              onChange={(e) => setCustomStart(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={customEnd}
              min={customStart}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
          </div>
        )}

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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile label="Moyenne journalière" value={monthlyAvg === null ? "—" : `${Math.round(monthlyAvg * 100)}%`} sub={`${tracked}/${primaryDates.length} jours suivis`} />
        <StatTile label="Day Win" value={dayWinPct === null ? "—" : `${Math.round(dayWinPct * 100)}%`} sub={`${dayWinTracked} jour(s) coché(s)`} />
        <StatTile label="Série en cours" value={`${streak} j`} sub="Moyenne ≥ 50%" />
        <StatTile label="Meilleure habitude" value={best ? `${best.value}%` : "—"} sub={best?.name ?? "—"} />
        <StatTile label="À travailler" value={worst ? `${worst.value}%` : "—"} sub={worst?.name ?? "—"} />
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Évolution de la moyenne journalière</h3>
          {isComparing && (
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series1 }} />
                {primaryPreset === "custom" ? "Personnalisé" : RANGE_PRESETS.find((p) => p.key === primaryPreset)?.label}
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

      <MonthlyBreakdown primaryDates={primaryDates} primaryDailyAverages={primaryDailyAverages} data={data} dark={dark} />

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
