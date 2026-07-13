import { useStore } from "../store";
import { daysInMonth, dayNameFr, toDateKey, isToday, monthKey } from "../dateUtils";
import { average, healthDayAverage, healthHabitValue, formatPct, scoreToNum } from "../compute";
import { excludeAnnotated } from "../annotations";
import { ScoreCell } from "./ScoreCell";
import { HealthHabitManager } from "./HealthHabitManager";

export function HealthTable({ year, month }: { year: number; month: number }) {
  const data = useStore((s) => s.data);
  const setHealthHabitValue = useStore((s) => s.setHealthHabitValue);
  const habits = data.healthHabits;
  const mKey = monthKey(year, month);

  const nDays = daysInMonth(year, month);
  const dates = Array.from({ length: nDays }, (_, i) => toDateKey(year, month, i + 1));
  // Annotated (excluded) days stay visible/editable in the table body below,
  // but drop out of every "Moyenne du mois" figure in the header row.
  const statsDates = excludeAnnotated(dates, data.annotations);

  const monthlyHabitAverages = habits.map((habit) =>
    average(statsDates.map((date) => scoreToNum(healthHabitValue(data.health[date], habit))))
  );
  const monthlyOverall = average(statsDates.map((date) => healthDayAverage(data.health[date], habits)));

  return (
    <div className="flex flex-col gap-4">
      <HealthHabitManager year={year} month={month} />
      <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
            <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-left font-medium min-w-[110px]">Jour</th>
            <th className="px-3 py-2 text-left font-medium min-w-[70px]">Date</th>
            <th className="px-3 py-2 text-left font-medium min-w-[70px]">Moyenne</th>
            {habits.map((h) => (
              <th key={h.id} className="px-2 py-2 text-center font-medium min-w-[80px]">
                {h.short}
                {h.targets?.[mKey] != null && <span className="block text-[10px] font-normal normal-case text-slate-400">🎯 {h.targets[mKey]}%</span>}
              </th>
            ))}
          </tr>
          <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-xs font-semibold">
            <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800/70 px-3 py-2 text-left">Moyenne du mois</th>
            <th className="px-3 py-2"></th>
            <th className="px-3 py-2 text-left tabular-nums">{formatPct(monthlyOverall)}</th>
            {monthlyHabitAverages.map((v, i) => {
              const target = habits[i]?.targets?.[mKey];
              const pct = v === null ? null : Math.round(v * 100);
              const met = target != null && pct !== null ? pct >= target : null;
              return (
                <th
                  key={i}
                  className={`px-2 py-2 text-center tabular-nums font-normal ${
                    met === true ? "text-emerald-600 dark:text-emerald-400" : met === false ? "text-rose-500 dark:text-rose-400" : ""
                  }`}
                >
                  {formatPct(v)}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {dates.map((date, idx) => {
            const day = idx + 1;
            const dName = dayNameFr(year, month, day);
            const isWeekend = dName === "dimanche" || dName === "samedi";
            const h = data.health[date];
            const dayAvg = healthDayAverage(h, habits);
            const today = isToday(date);
            const annotation = data.annotations.find((a) => date >= a.start && date <= a.end);
            const rowBg = annotation ? "bg-amber-50/70 dark:bg-amber-950/20" : isWeekend ? "bg-slate-50/60 dark:bg-slate-900/40" : "";
            return (
              <tr
                key={date}
                className={`border-t border-slate-100 dark:border-slate-800 ${rowBg} ${today ? "outline outline-2 outline-offset-[-2px] outline-blue-400/60" : ""}`}
              >
                <td
                  className={`sticky left-0 z-10 px-3 py-1.5 capitalize text-slate-700 dark:text-slate-200 ${rowBg || "bg-white dark:bg-slate-950"}`}
                  title={annotation ? `Exclu des moyennes : ${annotation.label}` : undefined}
                >
                  {dName}
                  {annotation && <span className="ml-1 text-amber-500">●</span>}
                </td>
                <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400 tabular-nums">{day}</td>
                <td className="px-3 py-1.5 tabular-nums text-slate-700 dark:text-slate-200 font-medium">{formatPct(dayAvg)}</td>
                {habits.map((habit) => (
                  <td key={habit.id} className="px-2 py-1.5 text-center">
                    <div className="flex justify-center">
                      <ScoreCell
                        value={healthHabitValue(h, habit)}
                        onChange={(v) => setHealthHabitValue(date, habit.id, v)}
                      />
                    </div>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}
