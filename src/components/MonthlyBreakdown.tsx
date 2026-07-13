import type { ReactNode } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LabelList } from "recharts";
import type { AppData, HealthKey } from "../types";
import { HEALTH_HABITS } from "../habits";
import { average, scoreToNum, dashboardHabitValue, toDiffPair } from "../compute";
import { monthBuckets, tickIntervalFor } from "../ranges";
import { COLORS } from "../chartColors";
import { ChartTooltip } from "./ChartTooltip";

export function MonthlyBreakdown({
  primaryDates,
  primaryDailyAverages,
  compareDates,
  compareDailyAverages,
  data,
  dark,
  compareLegend,
}: {
  primaryDates: string[];
  primaryDailyAverages: (number | null)[];
  compareDates: string[];
  compareDailyAverages: (number | null)[];
  data: AppData;
  dark: boolean;
  compareLegend: ReactNode;
}) {
  const c = dark ? COLORS.dark : COLORS.light;
  const buckets = monthBuckets(primaryDates);
  if (buckets.length < 2) return null;

  const isComparing = compareDates.length > 0;
  const dateIndex = new Map(primaryDates.map((d, i) => [d, i]));
  const compareBuckets = isComparing ? monthBuckets(compareDates) : [];
  const compareIndex = new Map(compareDates.map((d, i) => [d, i]));

  // Compare buckets are paired to primary buckets by relative position (1st month
  // of the primary period vs 1st month of the compare period, etc.), not by matching
  // calendar month — the two periods rarely share actual months.
  const monthlyAvgData = buckets.map((b, i) => {
    const primaryVal = average(b.dates.map((d) => primaryDailyAverages[dateIndex.get(d) ?? -1] ?? null));
    const cBucket = compareBuckets[i];
    const compareVal = cBucket ? average(cBucket.dates.map((d) => compareDailyAverages[compareIndex.get(d) ?? -1] ?? null)) : null;
    return { month: b.label, ...toDiffPair(primaryVal, compareVal) };
  });

  function series(valueAt: (dates: string[]) => number | null) {
    return buckets.map((b, i) => {
      const primaryVal = valueAt(b.dates);
      const cBucket = compareBuckets[i];
      const compareVal = cBucket ? valueAt(cBucket.dates) : null;
      return { month: b.label, ...toDiffPair(primaryVal, compareVal) };
    });
  }
  const dashboardHabitSeries = (habit: AppData["dashboardHabits"][number]) =>
    series((dates) => average(dates.map((d) => scoreToNum(dashboardHabitValue(data.dashboard[d], habit)))));
  const healthHabitSeries = (key: HealthKey) => series((dates) => average(dates.map((d) => scoreToNum(data.health[d]?.[key]))));

  // Full-width chart has room for more labels than the mini per-habit ones.
  const tickInterval = tickIntervalFor(buckets.length, 10);

  return (
    <>
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Moyenne par mois</h3>
          {isComparing && compareLegend}
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={monthlyAvgData} margin={{ top: 16, right: 12, left: 0, bottom: 0 }} barCategoryGap="20%" barGap={0}>
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="month" tick={{ fill: c.axis, fontSize: 11 }} axisLine={{ stroke: c.grid }} tickLine={false} interval={tickInterval} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }} />
            <Bar dataKey="primary" fill={c.series1} radius={[4, 4, 0, 0]} maxBarSize={isComparing ? 28 : 48}>
              {isComparing && <LabelList dataKey="diffLabel" position="top" style={{ fill: c.secondary, fontSize: 10 }} />}
            </Bar>
            {isComparing && <Bar dataKey="compareVal" fill={c.series2} radius={[4, 4, 0, 0]} maxBarSize={28} />}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chaque habitude, mois par mois</h3>
          {isComparing && compareLegend}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.dashboardHabits.map((h) => (
            <MiniMonthChart key={h.id} title={h.short} data={dashboardHabitSeries(h)} color={c.series1} compareColor={c.series2} isComparing={isComparing} dark={dark} />
          ))}
          {HEALTH_HABITS.map((h) => (
            <MiniMonthChart key={h.key} title={h.short} data={healthHabitSeries(h.key)} color={c.series1} compareColor={c.series2} isComparing={isComparing} dark={dark} />
          ))}
        </div>
      </div>
    </>
  );
}

function MiniMonthChart({
  title,
  data,
  color,
  compareColor,
  isComparing,
  dark,
}: {
  title: string;
  data: { month: string; primary: number | null; compareVal: number | null }[];
  color: string;
  compareColor: string;
  isComparing: boolean;
  dark: boolean;
}) {
  const c = dark ? COLORS.dark : COLORS.light;
  const tickInterval = tickIntervalFor(data.length, 4);
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
      <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{title}</div>
      <ResponsiveContainer width="100%" height={130}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barCategoryGap="25%" barGap={0}>
          <CartesianGrid vertical={false} stroke={c.grid} />
          <XAxis dataKey="month" tick={{ fill: c.axis, fontSize: 8 }} axisLine={{ stroke: c.grid }} tickLine={false} interval={tickInterval} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: c.axis, fontSize: 8 }} axisLine={false} tickLine={false} width={30} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }} />
          <Bar dataKey="primary" fill={color} radius={[3, 3, 0, 0]} maxBarSize={isComparing ? 14 : 28} />
          {isComparing && <Bar dataKey="compareVal" fill={compareColor} radius={[3, 3, 0, 0]} maxBarSize={14} />}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
