import { useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useStore } from "../store";
import { shortDateLabelFr } from "../dateUtils";
import { totalCalories, calorieTarget, calorieDeficit, proteinTarget, theoreticalKgChange, formatNum, formatSigned } from "../calorieCompute";
import { useDarkMode } from "../useDarkMode";
import { StatTile } from "./StatItem";
import { ChartTooltip } from "./ChartTooltip";
import { COLORS } from "../chartColors";
import { ProfileSettings } from "./ProfileSettings";
import { CaloriesTable } from "./CaloriesTable";
import { RANGE_PRESETS, resolveRange, rangeDates, chunkAverage, chunkDates, type RangePreset, type DateRange } from "../ranges";

export function CaloriesPage({ year, month }: { year: number; month: number }) {
  const data = useStore((s) => s.data);
  const dark = useDarkMode();
  const c = dark ? COLORS.dark : COLORS.light;
  const profile = data.profile;

  const [periodOpen, setPeriodOpen] = useState(false);
  const [periodPreset, setPeriodPreset] = useState<RangePreset>("month");

  const monthAnchor = { year, month };
  const periodRange: DateRange = useMemo(() => resolveRange(periodPreset, data, monthAnchor), [periodPreset, data, year, month]);
  const periodDates = useMemo(() => rangeDates(periodRange), [periodRange.start, periodRange.end]);
  const periodLabel = RANGE_PRESETS.find((p) => p.key === periodPreset)?.label;

  const rows = useMemo(
    () =>
      periodDates.map((date) => {
        const cal = data.calories[date];
        return {
          date,
          weight: cal?.weight ?? null,
          intake: totalCalories(cal),
          objectif: calorieTarget(cal, profile),
          deficit: calorieDeficit(cal, profile),
          protein: cal?.protein ?? null,
          proteinObjectif: proteinTarget(cal?.weight ?? null, profile),
        };
      }),
    [data.calories, periodDates.join(","), profile]
  );

  const totalDeficit = rows.reduce((sum, r) => sum + (r.deficit ?? 0), 0);
  const trackedDeficitDays = rows.filter((r) => r.deficit !== null).length;
  const theoreticalKg = trackedDeficitDays > 0 ? theoreticalKgChange(totalDeficit) : null;

  const weightPoints = rows.filter((r) => r.weight !== null);
  const actualKgChange =
    weightPoints.length >= 2 ? (weightPoints[weightPoints.length - 1].weight as number) - (weightPoints[0].weight as number) : null;

  const intakeDays = rows.filter((r) => r.intake !== null);
  const avgIntake = intakeDays.length ? intakeDays.reduce((s, r) => s + (r.intake as number), 0) / intakeDays.length : null;
  const proteinDays = rows.filter((r) => r.protein !== null);
  const avgProtein = proteinDays.length ? proteinDays.reduce((s, r) => s + (r.protein as number), 0) / proteinDays.length : null;
  const avgProteinTarget = proteinDays.length
    ? proteinDays.reduce((s, r) => s + (r.proteinObjectif ?? 0), 0) / proteinDays.length
    : null;

  // Cap chart points so long ranges stay readable; a single month stays daily, unchanged.
  const targetPoints = Math.min(periodDates.length, 31) || 1;
  const isDaily = periodPreset === "month";
  const labelDates = chunkDates(periodDates, targetPoints);
  const xLabel = (date: string, i: number) => (isDaily ? i + 1 : shortDateLabelFr(date));

  const weightChunked = chunkAverage(rows.map((r) => r.weight), targetPoints);
  const intakeChunked = chunkAverage(rows.map((r) => r.intake), targetPoints);
  const objectifChunked = chunkAverage(rows.map((r) => r.objectif), targetPoints);
  const proteinChunked = chunkAverage(rows.map((r) => r.protein), targetPoints);
  const proteinObjChunked = chunkAverage(rows.map((r) => r.proteinObjectif), targetPoints);

  const weightData = labelDates.map((date, i) => ({ x: xLabel(date, i), value: weightChunked[i] ?? null }));
  const calorieData = labelDates.map((date, i) => ({ x: xLabel(date, i), intake: intakeChunked[i] ?? null, objectif: objectifChunked[i] ?? null }));
  const proteinData = labelDates.map((date, i) => ({ x: xLabel(date, i), protein: proteinChunked[i] ?? null, objectif: proteinObjChunked[i] ?? null }));

  // Computed explicitly instead of via recharts' "dataMin"/"dataMax" domain
  // strings, which mis-render when the series starts with a run of nulls.
  const weightValues = weightChunked.filter((v): v is number => v !== null);
  const weightDomain: [number, number] = weightValues.length
    ? [Math.floor(Math.min(...weightValues) - 1), Math.ceil(Math.max(...weightValues) + 1)]
    : [0, 100];

  return (
    <div className="flex flex-col gap-6">
      <ProfileSettings />

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <button
          onClick={() => setPeriodOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200"
        >
          <span>Période affichée (résumé et graphiques) : {periodLabel}</span>
          <span className="text-slate-400 text-xs">{periodOpen ? "Masquer ▲" : "Modifier ▼"}</span>
        </button>
        {periodOpen && (
          <div className="px-4 pb-4 flex flex-wrap items-center gap-3">
            <select
              value={periodPreset}
              onChange={(e) => setPeriodPreset(e.target.value as RangePreset)}
              className="rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-sm text-slate-700 dark:text-slate-200"
            >
              {RANGE_PRESETS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Le tableau détaillé plus bas reste sur le mois affiché en haut de page ({RANGE_PRESETS[0].label.toLowerCase()}).
            </span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <StatTile
          label="Déficit total"
          value={trackedDeficitDays ? `${formatSigned(totalDeficit)} kcal` : "—"}
          sub={`${trackedDeficitDays}/${periodDates.length} jours suivis`}
        />
        <StatTile label="Perte théorique" value={theoreticalKg === null ? "—" : `${formatSigned(theoreticalKg, 2)} kg`} sub="Déficit ÷ 7700" />
        <StatTile
          label="Poids réel"
          value={actualKgChange === null ? "—" : `${formatSigned(actualKgChange, 1)} kg`}
          sub={weightPoints.length >= 2 ? `${formatNum(weightPoints[0].weight, 1)} → ${formatNum(weightPoints[weightPoints.length - 1].weight, 1)} kg` : "Pas assez de données"}
        />
        <StatTile label="Cal. moyennes/j" value={avgIntake === null ? "—" : formatNum(avgIntake)} sub="kcal" />
        <StatTile
          label="Protéine moyenne/j"
          value={avgProtein === null ? "—" : `${formatNum(avgProtein)} g`}
          sub={avgProteinTarget === null ? "objectif —" : `objectif ${formatNum(avgProteinTarget)} g`}
        />
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Poids</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={weightData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="x" tick={{ fill: c.axis, fontSize: 11 }} axisLine={{ stroke: c.grid }} tickLine={false} interval={Math.max(0, Math.floor(weightData.length / 8))} />
              <YAxis
                domain={weightDomain}
                tick={{ fill: c.axis, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip content={<ChartTooltip dark={dark} unit=" kg" />} cursor={{ stroke: c.grid }} />
              <Line type="monotone" dataKey="value" stroke={c.series1} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: c.series1, stroke: c.surface, strokeWidth: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Calories : apport vs objectif</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series1 }} />
                Apport
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series2 }} />
                Objectif
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={calorieData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="x" tick={{ fill: c.axis, fontSize: 11 }} axisLine={{ stroke: c.grid }} tickLine={false} interval={Math.max(0, Math.floor(calorieData.length / 8))} />
              <YAxis tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTooltip dark={dark} unit=" kcal" />} cursor={{ stroke: c.grid }} />
              <Line type="monotone" dataKey="intake" stroke={c.series1} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: c.series1, stroke: c.surface, strokeWidth: 2 }} connectNulls />
              <Line type="monotone" dataKey="objectif" stroke={c.series2} strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, fill: c.series2, stroke: c.surface, strokeWidth: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Protéine : apport vs objectif</h3>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series1 }} />
                Apport
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full inline-block" style={{ background: c.series2 }} />
                Objectif
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={proteinData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis dataKey="x" tick={{ fill: c.axis, fontSize: 11 }} axisLine={{ stroke: c.grid }} tickLine={false} interval={Math.max(0, Math.floor(proteinData.length / 8))} />
              <YAxis tick={{ fill: c.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
              <Tooltip content={<ChartTooltip dark={dark} unit=" g" />} cursor={{ stroke: c.grid }} />
              <Line type="monotone" dataKey="protein" stroke={c.series1} strokeWidth={2} dot={false} activeDot={{ r: 4, fill: c.series1, stroke: c.surface, strokeWidth: 2 }} connectNulls />
              <Line type="monotone" dataKey="objectif" stroke={c.series2} strokeWidth={2} strokeDasharray="4 3" dot={false} activeDot={{ r: 4, fill: c.series2, stroke: c.surface, strokeWidth: 2 }} connectNulls />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <CaloriesTable year={year} month={month} />
    </div>
  );
}
