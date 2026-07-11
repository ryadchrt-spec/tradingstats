import { useMemo } from "react";
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
import { daysInMonth, toDateKey } from "../dateUtils";
import { average, dashboardDayWin, healthDayAverage, hasAnyDashboardData, currentStreak, daysTracked } from "../compute";
import { useDarkMode } from "../useDarkMode";
import { StatTile } from "./StatItem";

const COLORS = {
  light: {
    surface: "#fcfcfb",
    grid: "#e1e0d9",
    axis: "#898781",
    primary: "#0b0b0b",
    secondary: "#52514e",
    series1: "#2a78d6",
    series1Fill: "rgba(42, 120, 214, 0.14)",
  },
  dark: {
    surface: "#1a1a19",
    grid: "#2c2c2a",
    axis: "#898781",
    primary: "#ffffff",
    secondary: "#c3c2b7",
    series1: "#3987e5",
    series1Fill: "rgba(57, 135, 229, 0.18)",
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
      <div style={{ color: c.secondary, marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
        {Math.round(payload[0].value)}
        {unit}
      </div>
    </div>
  );
}

export function StatsView({ year, month }: { year: number; month: number }) {
  const data = useStore((s) => s.data);
  const dark = useDarkMode();
  const c = dark ? COLORS.dark : COLORS.light;

  const nDays = daysInMonth(year, month);
  const dates = Array.from({ length: nDays }, (_, i) => toDateKey(year, month, i + 1));

  const dayWins = useMemo(
    () =>
      dates.map((date) => {
        const d = data.dashboard[date];
        const hAvg = healthDayAverage(data.health[date]);
        return hasAnyDashboardData(d) ? dashboardDayWin(d, hAvg) : null;
      }),
    [data, dates.join(",")]
  );

  const lineData = dates.map((_date, i) => ({
    day: i + 1,
    value: dayWins[i] === null ? null : Math.round((dayWins[i] as number) * 100),
  }));

  const dashboardBars = DASHBOARD_HABITS.map((h) => ({
    name: h.short,
    value: average(dates.map((date) => data.dashboard[date]?.[h.key] ?? null)),
  }))
    .filter((b) => b.value !== null)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .map((b) => ({ ...b, value: Math.round((b.value as number) * 100) }));

  const healthBars = HEALTH_HABITS.map((h) => ({
    name: h.short,
    value: average(dates.map((date) => data.health[date]?.[h.key] ?? null)),
  }))
    .filter((b) => b.value !== null)
    .sort((a, b) => (b.value as number) - (a.value as number))
    .map((b) => ({ ...b, value: Math.round((b.value as number) * 100) }));

  const monthlyAvg = average(dayWins as any);
  const tracked = daysTracked(dayWins);
  const streak = currentStreak(dayWins);

  const allBars = [...dashboardBars, ...healthBars];
  const best = allBars.length ? allBars.reduce((a, b) => (b.value > a.value ? b : a)) : null;
  const worst = allBars.length ? allBars.reduce((a, b) => (b.value < a.value ? b : a)) : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile label="Day Win moyen" value={monthlyAvg === null ? "—" : `${Math.round(monthlyAvg * 100)}%`} sub={`${tracked}/${nDays} jours suivis`} />
        <StatTile label="Série en cours" value={`${streak} j`} sub="Day Win ≥ 50%" />
        <StatTile label="Meilleure habitude" value={best ? `${best.value}%` : "—"} sub={best?.name ?? "—"} />
        <StatTile label="À travailler" value={worst ? `${worst.value}%` : "—"} sub={worst?.name ?? "—"} />
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Évolution du Day Win</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={lineData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke={c.grid} strokeDasharray="0" />
            <XAxis
              dataKey="day"
              tick={{ fill: c.axis, fontSize: 11 }}
              axisLine={{ stroke: c.grid }}
              tickLine={false}
              interval={Math.max(0, Math.floor(nDays / 10))}
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
              dataKey="value"
              stroke={c.series1}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: c.series1, stroke: c.surface, strokeWidth: 2 }}
              connectNulls
            />
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
