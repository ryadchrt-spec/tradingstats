import { useStore } from "../store";
import { daysInMonth, dayNameFr, toDateKey, isToday } from "../dateUtils";
import { average } from "../compute";
import { totalCalories, calorieTarget, calorieDeficit, proteinTarget, tdee, formatNum, formatSigned, ACTIVITY_LEVELS } from "../calorieCompute";
import { NumberCell } from "./NumberCell";
import type { CalorieMealKey } from "../types";

const MEAL_COLUMNS: { key: CalorieMealKey; label: string }[] = [
  { key: "breakfast", label: "Matin" },
  { key: "lunch", label: "Midi" },
  { key: "dinner", label: "Soir" },
  { key: "other", label: "Autre" },
];

export function CaloriesTable({ year, month }: { year: number; month: number }) {
  const data = useStore((s) => s.data);
  const setCalorieValue = useStore((s) => s.setCalorieValue);
  const profile = data.profile;

  const nDays = daysInMonth(year, month);
  const dates = Array.from({ length: nDays }, (_, i) => toDateKey(year, month, i + 1));

  const monthlyWeight = average(dates.map((d) => data.calories[d]?.weight ?? null));
  const monthlyMetabolism = average(dates.map((d) => tdee(data.calories[d]?.weight ?? null, profile, data.calories[d]?.activityLevel)));
  const monthlyTotals = average(dates.map((d) => totalCalories(data.calories[d])));
  const monthlyTarget = average(dates.map((d) => calorieTarget(data.calories[d], profile)));
  const monthlyDeficit = average(dates.map((d) => calorieDeficit(data.calories[d], profile)));
  const monthlyProtein = average(dates.map((d) => data.calories[d]?.protein ?? null));
  const monthlyProteinTarget = average(dates.map((d) => proteinTarget(data.calories[d]?.weight ?? null, profile)));

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
            <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-left font-medium min-w-[110px]">Jour</th>
            <th className="px-3 py-2 text-left font-medium min-w-[60px]">Date</th>
            <th className="px-2 py-2 text-right font-medium min-w-[70px]">Poids (kg)</th>
            <th className="px-2 py-2 text-right font-medium min-w-[110px]">Métabolisme</th>
            {MEAL_COLUMNS.map((m) => (
              <th key={m.key} className="px-2 py-2 text-right font-medium min-w-[70px]">
                {m.label}
              </th>
            ))}
            <th className="px-2 py-2 text-right font-medium min-w-[80px]">Total Cal</th>
            <th className="px-2 py-2 text-right font-medium min-w-[80px]">Objectif</th>
            <th className="px-2 py-2 text-right font-medium min-w-[90px]">Déficit / Surplus</th>
            <th className="px-2 py-2 text-right font-medium min-w-[70px]">Protéine</th>
            <th className="px-2 py-2 text-right font-medium min-w-[80px]">Obj. Prot.</th>
          </tr>
          <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-xs font-semibold">
            <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800/70 px-3 py-2 text-left">Moyenne du mois</th>
            <th className="px-3 py-2"></th>
            <th className="px-2 py-2 text-right tabular-nums font-normal">{formatNum(monthlyWeight, 1)}</th>
            <th className="px-2 py-2 text-right tabular-nums font-normal">{formatNum(monthlyMetabolism)}</th>
            <th className="px-2 py-2" colSpan={4}></th>
            <th className="px-2 py-2 text-right tabular-nums font-normal">{formatNum(monthlyTotals)}</th>
            <th className="px-2 py-2 text-right tabular-nums font-normal">{formatNum(monthlyTarget)}</th>
            <th className="px-2 py-2 text-right tabular-nums font-normal">{formatSigned(monthlyDeficit === null ? null : -monthlyDeficit)}</th>
            <th className="px-2 py-2 text-right tabular-nums font-normal">{formatNum(monthlyProtein)}</th>
            <th className="px-2 py-2 text-right tabular-nums font-normal">{formatNum(monthlyProteinTarget)}</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((date, idx) => {
            const day = idx + 1;
            const dName = dayNameFr(year, month, day);
            const isWeekend = dName === "dimanche" || dName === "samedi";
            const cal = data.calories[date];
            const today = isToday(date);
            const metabolism = tdee(cal?.weight ?? null, profile, cal?.activityLevel);
            const total = totalCalories(cal);
            const objectif = calorieTarget(cal, profile);
            const deficit = calorieDeficit(cal, profile);
            const objProt = proteinTarget(cal?.weight ?? null, profile);
            return (
              <tr
                key={date}
                className={`border-t border-slate-100 dark:border-slate-800 ${
                  isWeekend ? "bg-slate-50/60 dark:bg-slate-900/40" : ""
                } ${today ? "outline outline-2 outline-offset-[-2px] outline-blue-400/60" : ""}`}
              >
                <td className={`sticky left-0 z-10 px-3 py-1.5 capitalize text-slate-700 dark:text-slate-200 ${isWeekend ? "bg-slate-50/60 dark:bg-slate-900/40" : "bg-white dark:bg-slate-950"}`}>
                  {dName}
                </td>
                <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 tabular-nums">{day}</td>
                <td className="px-2 py-1.5">
                  <NumberCell value={cal?.weight ?? null} onChange={(v) => setCalorieValue(date, "weight", v)} step={0.1} />
                </td>
                <td className="px-2 py-1.5">
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="tabular-nums text-slate-700 dark:text-slate-200 font-medium">{formatNum(metabolism)}</span>
                    <select
                      value={cal?.activityLevel ?? ""}
                      onChange={(e) => setCalorieValue(date, "activityLevel", e.target.value === "" ? null : Number(e.target.value))}
                      title="Niveau d'activité de la journée (sinon niveau du profil)"
                      className="w-full rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-1 py-0.5 text-[10px] text-slate-500 dark:text-slate-400"
                    >
                      <option value="">Profil</option>
                      {ACTIVITY_LEVELS.map((a) => (
                        <option key={a.value} value={a.value}>
                          {a.short}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                {MEAL_COLUMNS.map((m) => (
                  <td key={m.key} className="px-2 py-1.5">
                    <NumberCell value={cal?.[m.key] ?? null} onChange={(v) => setCalorieValue(date, m.key, v)} step={50} />
                  </td>
                ))}
                <td className="px-2 py-1.5 text-right tabular-nums text-slate-700 dark:text-slate-200 font-medium">{formatNum(total)}</td>
                <td className="px-2 py-1.5 text-right tabular-nums text-slate-500 dark:text-slate-400">{formatNum(objectif)}</td>
                <td className={`px-2 py-1.5 text-right tabular-nums font-medium ${deficit !== null && deficit < 0 ? "text-rose-500 dark:text-rose-400" : "text-slate-700 dark:text-slate-200"}`}>
                  {/* Displayed inverted from calorieDeficit's raw sign: a deficit
                      (below maintenance) reads as negative, a surplus as positive. */}
                  {formatSigned(deficit === null ? null : -deficit)}
                </td>
                <td className="px-2 py-1.5">
                  <NumberCell value={cal?.protein ?? null} onChange={(v) => setCalorieValue(date, "protein", v)} step={5} />
                </td>
                <td className="px-2 py-1.5 text-right tabular-nums text-slate-500 dark:text-slate-400">{formatNum(objProt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
