import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from "recharts";
import type { AppData } from "../types";
import { DASHBOARD_HABITS, HEALTH_HABITS } from "../habits";
import { average, scoreToNum } from "../compute";
import { monthBuckets } from "../ranges";
import { COLORS } from "../chartColors";
import { ChartTooltip } from "./ChartTooltip";

export function MonthlyBreakdown({
  primaryDates,
  primaryDailyAverages,
  data,
  dark,
}: {
  primaryDates: string[];
  primaryDailyAverages: (number | null)[];
  data: AppData;
  dark: boolean;
}) {
  const c = dark ? COLORS.dark : COLORS.light;
  const buckets = monthBuckets(primaryDates);
  if (buckets.length < 2) return null;

  const dateIndex = new Map(primaryDates.map((d, i) => [d, i]));

  const monthlyAvgData = buckets.map((b) => ({
    month: b.label,
    value: average(b.dates.map((d) => primaryDailyAverages[dateIndex.get(d) ?? -1] ?? null)),
  })).map((row) => ({ ...row, value: row.value === null ? null : Math.round(row.value * 100) }));

  function habitSeries(habitKey: string, source: "dashboard" | "health") {
    return buckets.map((b) => {
      const value = average(
        b.dates.map((d) =>
          scoreToNum(source === "dashboard" ? (data.dashboard[d] as any)?.[habitKey] : (data.health[d] as any)?.[habitKey])
        )
      );
      return { month: b.label, value: value === null ? null : Math.round(value * 100) };
    });
  }

  const tickInterval = buckets.length > 8 ? 1 : 0;

  return (
    <>
      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Moyenne par mois</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyAvgData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }} barCategoryGap="20%">
            <CartesianGrid vertical={false} stroke={c.grid} />
            <XAxis dataKey="month" tick={{ fill: c.axis, fontSize: 11 }} axisLine={{ stroke: c.grid }} tickLine={false} interval={tickInterval} />
            <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}%`} />
            <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }} />
            <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={48}>
              {monthlyAvgData.map((_, i) => (
                <Cell key={i} fill={c.series1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Chaque habitude, mois par mois</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {DASHBOARD_HABITS.map((h) => (
            <MiniMonthChart key={h.key} title={h.short} data={habitSeries(h.key, "dashboard")} color={c.series1} dark={dark} />
          ))}
          {HEALTH_HABITS.map((h) => (
            <MiniMonthChart key={h.key} title={h.short} data={habitSeries(h.key, "health")} color={c.series2} dark={dark} />
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
  dark,
}: {
  title: string;
  data: { month: string; value: number | null }[];
  color: string;
  dark: boolean;
}) {
  const c = dark ? COLORS.dark : COLORS.light;
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-3">
      <div className="text-xs font-medium text-slate-600 dark:text-slate-300 mb-1">{title}</div>
      <ResponsiveContainer width="100%" height={100}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barCategoryGap="25%">
          <CartesianGrid vertical={false} stroke={c.grid} />
          {/* Month labels are shown once in "Moyenne par mois" above; repeating them
              on every mini chart just collides, so rely on the hover tooltip instead. */}
          <XAxis dataKey="month" tick={false} axisLine={{ stroke: c.grid }} tickLine={false} />
          <YAxis domain={[0, 100]} ticks={[0, 100]} tick={{ fill: c.axis, fontSize: 9 }} axisLine={false} tickLine={false} width={26} tickFormatter={(v) => `${v}%`} />
          <Tooltip content={<ChartTooltip dark={dark} unit="%" />} cursor={{ fill: dark ? "rgba(255,255,255,0.04)" : "rgba(11,11,11,0.03)" }} />
          <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={28} fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
