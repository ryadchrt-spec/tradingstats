import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, LabelList } from "recharts";
import { useStore } from "../store";
import type { AppData } from "../types";
import { DASHBOARD_HABITS, HEALTH_HABITS } from "../habits";
import { shortDateLabelFr, todayKey, currentMonthStr, shiftMonthStr, monthStrToFirstDay, monthStrToLastDay } from "../dateUtils";
import { average, dashboardDailyAverage, healthDayAverage, hasAnyDashboardData, currentStreak, daysTracked, scoreToNum, toDiffPair, type DiffPair } from "../compute";
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
  tickIntervalFor,
  niceAxisDomain,
  type RangePreset,
  type DateRange,
} from "../ranges";

type PrimarySelection = RangePreset | "custom";
type CompareSelection = RangePreset | "none" | "custom";

type CombinedBar = DiffPair & { name: string };

// Same category set as habitBreakdown, but keeps every habit that has data in
// EITHER period (not just the primary one) so a comparison bar never goes missing,
// and attaches the compare period's value + the delta for the "diff" label.
function combinedHabitBreakdown(
  primaryDates: string[],
  compareDates: string[],
  data: AppData
): { dashboardBars: CombinedBar[]; healthBars: CombinedBar[] } {
  function build(habits: { key: string; short: string }[], source: "dashboard" | "health"): CombinedBar[] {
    const valueAt = (date: string, key: string) => {
      const day = (source === "dashboard" ? data.dashboard[date] : data.health[date]) as unknown as Record<string, unknown> | undefined;
      return scoreToNum(day?.[key] as Parameters<typeof scoreToNum>[0]);
    };
    return habits
      .map((h) => ({
        name: h.short,
        primary: average(primaryDates.map((d) => valueAt(d, h.key))),
        compare: compareDates.length ? average(compareDates.map((d) => valueAt(d, h.key))) : null,
      }))
      .filter((r) => r.primary !== null || r.compare !== null)
      .sort((a, b) => (b.primary ?? -1) - (a.primary ?? -1))
      .map((r) => ({ name: r.name, ...toDiffPair(r.primary, r.compare) }));
  }

  return {
    dashboardBars: build(DASHBOARD_HABITS, "dashboard"),
    healthBars: build(HEALTH_HABITS, "health"),
  };
}

export function StatsView({ year, month }: { year: number; month: number }) {
  const data = useStore((s) => s.data);
  const dark = useDarkMode();
  const c = dark ? COLORS.dark : COLORS.light;

  const [primaryPreset, setPrimaryPreset] = useState<PrimarySelection>("month");
  const [comparePreset, setComparePreset] = useState<CompareSelection>("none");
  const [customStartMonth, setCustomStartMonth] = useState<string>(() => shiftMonthStr(currentMonthStr(), -1));
  const [customEndMonth, setCustomEndMonth] = useState<string>(() => currentMonthStr());
  const [compareCustomStartMonth, setCompareCustomStartMonth] = useState<string>(() => shiftMonthStr(currentMonthStr(), -3));
  const [compareCustomEndMonth, setCompareCustomEndMonth] = useState<string>(() => shiftMonthStr(currentMonthStr(), -2));

  const monthAnchor = { year, month };

  const primaryRange: DateRange = useMemo(() => {
    if (primaryPreset === "custom") {
      const [startMonth, endMonth] =
        customStartMonth <= customEndMonth ? [customStartMonth, customEndMonth] : [customEndMonth, customStartMonth];
      const end = monthStrToLastDay(endMonth);
      return { start: monthStrToFirstDay(startMonth), end: end > todayKey() ? todayKey() : end };
    }
    return resolveRange(primaryPreset, data, monthAnchor);
  }, [primaryPreset, data, year, month, customStartMonth, customEndMonth]);
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
  const compareRange: DateRange | null = useMemo(() => {
    if (!isComparing) return null;
    if (comparePreset === "custom") {
      const [startMonth, endMonth] =
        compareCustomStartMonth <= compareCustomEndMonth
          ? [compareCustomStartMonth, compareCustomEndMonth]
          : [compareCustomEndMonth, compareCustomStartMonth];
      const end = monthStrToLastDay(endMonth);
      return { start: monthStrToFirstDay(startMonth), end: end > todayKey() ? todayKey() : end };
    }
    return resolveRange(comparePreset as RangePreset, data, monthAnchor, primaryRange);
  }, [comparePreset, data, year, month, primaryRange.start, primaryRange.end, compareCustomStartMonth, compareCustomEndMonth]);
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

  // Every day of the selected period gets its own point — no averaging into
  // months — so the curve shows the real day-to-day picture regardless of
  // how long the period is. Readability over long periods (e.g. "Tout") is
  // handled by thinning the X-axis tick labels, not by dropping data points.
  const lineData = primaryDates.map((date, i) => {
    const primaryVal = primaryDailyAverages[i] ?? null;
    const compareVal = compareDailyAverages[i] ?? null;
    return {
      x: primaryPreset === "month" ? i + 1 : shortDateLabelFr(date),
      primary: primaryVal === null ? null : Math.round(primaryVal * 100),
      compare: isComparing ? (compareVal === null ? null : Math.round(compareVal * 100)) : undefined,
    };
  });

  // Zoom the Y-axis into the curve's actual range (±5 pts) instead of always
  // spanning the full 0-100%, which flattened out real variation.
  const lineValues = lineData.flatMap((d) => [d.primary, d.compare]).filter((v): v is number => v !== null && v !== undefined);
  const { domain: lineYDomain, ticks: lineYTicks } = niceAxisDomain(lineValues);

  const { dashboardBars: dashboardChartBars, healthBars: healthChartBars } = useMemo(
    () => combinedHabitBreakdown(primaryDates, isComparing ? compareDates : [], data),
    [primaryDates.join(","), isComparing, compareDates.join(","), data]
  );

  const monthlyAvg = average(primaryDailyAverages);
  const compareMonthlyAvg = isComparing ? average(compareDailyAverages) : null;
  const tracked = daysTracked(primaryDailyAverages);
  const streak = currentStreak(primaryDailyAverages);

  // Émotions — surfaced as its own tile alongside the overall average.
  const emotionValues = primaryDates.map((date) => scoreToNum(data.dashboard[date]?.controlEmotion));
  const emotionPct = average(emotionValues);
  const emotionTracked = daysTracked(emotionValues);
  const compareEmotionPct = isComparing
    ? average(compareDates.map((date) => scoreToNum(data.dashboard[date]?.controlEmotion)))
    : null;

  const allBars = [...dashboardChartBars, ...healthChartBars].filter((b) => b.primary !== null);
  const best = allBars.length ? allBars.reduce((a, b) => ((b.primary as number) > (a.primary as number) ? b : a)) : null;
  const worst = allBars.length ? allBars.reduce((a, b) => ((b.primary as number) < (a.primary as number) ? b : a)) : null;

  const primaryLabel = primaryPreset === "custom" ? "Personnalisé" : RANGE_PRESETS.find((p) => p.key === primaryPreset)?.label;
  const compareLabel = comparePreset === "custom" ? "Personnalisé" : COMPARE_PRESETS.find((p) => p.key === comparePreset)?.label;
  const compareLegend = isComparing ? (
    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series1 }} />
        {primaryLabel}
      </span>
      <span className="flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series2 }} />
        {compareLabel}
      </span>
    </div>
  ) : null;

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
              type="month"
              value={customStartMonth}
              max={customEndMonth}
              onChange={(e) => setCustomStartMonth(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
            <span className="text-slate-400">→</span>
            <input
              type="month"
              value={customEndMonth}
              min={customStartMonth}
              onChange={(e) => setCustomEndMonth(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          Comparer avec
          <select
            value={comparePreset}
            onChange={(e) => setComparePreset(e.target.value as CompareSelection)}
            className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
          >
            {COMPARE_PRESETS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
            <option value="custom">Personnalisé…</option>
          </select>
        </label>

        {comparePreset === "custom" && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="month"
              value={compareCustomStartMonth}
              max={compareCustomEndMonth}
              onChange={(e) => setCompareCustomStartMonth(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
            <span className="text-slate-400">→</span>
            <input
              type="month"
              value={compareCustomEndMonth}
              min={compareCustomStartMonth}
              onChange={(e) => setCompareCustomEndMonth(e.target.value)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile
          label="Moyenne journalière"
          value={monthlyAvg === null ? "—" : `${Math.round(monthlyAvg * 100)}%`}
          sub={`${tracked}/${primaryDates.length} jours suivis`}
          compareValue={isComparing && compareMonthlyAvg !== null ? `${Math.round(compareMonthlyAvg * 100)}%` : undefined}
          compareColor={c.series2}
        />
        <StatTile
          label="Émotions"
          value={emotionPct === null ? "—" : `${Math.round(emotionPct * 100)}%`}
          sub={`${emotionTracked}/${primaryDates.length} jours suivis`}
          compareValue={isComparing && compareEmotionPct !== null ? `${Math.round(compareEmotionPct * 100)}%` : undefined}
          compareColor={c.series2}
        />
        <StatTile label="Série en cours" value={`${streak} j`} sub="Moyenne ≥ 50%" />
        <StatTile
          label="Meilleure habitude"
          value={best ? `${best.primary}%` : "—"}
          sub={best?.name ?? "—"}
          compareValue={isComparing && best?.compareVal != null ? `${best.compareVal}%` : undefined}
          compareColor={c.series2}
        />
        <StatTile
          label="À travailler"
          value={worst ? `${worst.primary}%` : "—"}
          sub={worst?.name ?? "—"}
          compareValue={isComparing && worst?.compareVal != null ? `${worst.compareVal}%` : undefined}
          compareColor={c.series2}
        />
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Évolution de la moyenne journalière</h3>
          {compareLegend}
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />
            <XAxis
              dataKey="x"
              tick={{ fill: c.axis, fontSize: 11 }}
              axisLine={{ stroke: c.grid }}
              tickLine={false}
              interval={tickIntervalFor(lineData.length, 8)}
            />
            <YAxis
              domain={lineYDomain}
              ticks={lineYTicks}
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

      <MonthlyBreakdown
        primaryDates={primaryDates}
        primaryDailyAverages={primaryDailyAverages}
        compareDates={isComparing ? compareDates : []}
        compareDailyAverages={compareDailyAverages}
        data={data}
        dark={dark}
        compareLegend={compareLegend}
      />

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Habitudes — Dashboard</h3>
            {compareLegend}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(160, dashboardChartBars.length * (isComparing ? 42 : 32))}>
            <BarChart data={dashboardChartBars} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }} barCategoryGap={isComparing ? "30%" : 6}>
              <CartesianGrid horizontal={false} stroke={c.grid} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: c.secondary, fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }} />
              <Bar dataKey="primary" fill={c.series1} radius={[0, 4, 4, 0]} maxBarSize={isComparing ? 12 : 16}>
                {isComparing && <LabelList dataKey="diffLabel" position="right" style={{ fill: c.secondary, fontSize: 11 }} />}
              </Bar>
              {isComparing && <Bar dataKey="compareVal" fill={c.series2} radius={[0, 4, 4, 0]} maxBarSize={12} />}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Habitudes — Health</h3>
            {compareLegend}
          </div>
          <ResponsiveContainer width="100%" height={Math.max(160, healthChartBars.length * (isComparing ? 42 : 32))}>
            <BarChart data={healthChartBars} layout="vertical" margin={{ top: 0, right: 44, left: 0, bottom: 0 }} barCategoryGap={isComparing ? "30%" : 6}>
              <CartesianGrid horizontal={false} stroke={c.grid} />
              <XAxis type="number" domain={[0, 100]} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: c.secondary, fontSize: 12 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }} />
              <Bar dataKey="primary" fill={c.series1} radius={[0, 4, 4, 0]} maxBarSize={isComparing ? 12 : 16}>
                {isComparing && <LabelList dataKey="diffLabel" position="right" style={{ fill: c.secondary, fontSize: 11 }} />}
              </Bar>
              {isComparing && <Bar dataKey="compareVal" fill={c.series2} radius={[0, 4, 4, 0]} maxBarSize={12} />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
