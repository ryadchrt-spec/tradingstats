import { useStore } from "../store";
import { DASHBOARD_HABITS } from "../habits";
import { daysInMonth, dayNameFr, toDateKey, isToday } from "../dateUtils";
import { average, dashboardDailyAverage, healthDayAverage, formatPct, hasAnyDashboardData, scoreToNum } from "../compute";
import { ScoreCell } from "./ScoreCell";
import type { DashboardKey } from "../types";

export function DashboardTable({ year, month }: { year: number; month: number }) {
  const data = useStore((s) => s.data);
  const setDashboardValue = useStore((s) => s.setDashboardValue);
  const setTask = useStore((s) => s.setTask);

  const nDays = daysInMonth(year, month);
  const dates = Array.from({ length: nDays }, (_, i) => toDateKey(year, month, i + 1));

  const dailyAverages = dates.map((date) => {
    const d = data.dashboard[date];
    const hAvg = healthDayAverage(data.health[date]);
    return hasAnyDashboardData(d) ? dashboardDailyAverage(d, hAvg) : null;
  });
  const monthlyAverage = average(dailyAverages);

  const monthlyHabitAverages = DASHBOARD_HABITS.map((habit) =>
    average(dates.map((date) => scoreToNum(data.dashboard[date]?.[habit.key])))
  );
  const monthlyHealthAvg = average(dates.map((date) => healthDayAverage(data.health[date])));
  const monthlyTaskAverages = [1, 2, 3].map((i) =>
    average(
      dates.map((date) => {
        const t = data.dashboard[date]?.[`task${i}` as "task1" | "task2" | "task3"];
        return t ? scoreToNum(t.score) : null;
      })
    )
  );
  const monthlyDayWin = average(dates.map((date) => scoreToNum(data.dashboard[date]?.dayWin)));

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="min-w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-300 text-xs uppercase tracking-wide">
            <th className="sticky left-0 z-10 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-left font-medium min-w-[110px]">Jour</th>
            <th className="px-3 py-2 text-left font-medium min-w-[70px]">Date</th>
            <th className="px-3 py-2 text-left font-medium min-w-[70px]">Moyenne</th>
            {DASHBOARD_HABITS.map((h) => (
              <th key={h.key} className="px-2 py-2 text-center font-medium min-w-[80px]">
                {h.short}
              </th>
            ))}
            <th className="px-2 py-2 text-center font-medium min-w-[80px]">Health</th>
            <th className="px-2 py-2 text-left font-medium min-w-[220px]">Tâche 1</th>
            <th className="px-2 py-2 text-left font-medium min-w-[220px]">Tâche 2</th>
            <th className="px-2 py-2 text-left font-medium min-w-[220px]">Tâche 3</th>
            <th className="px-2 py-2 text-center font-medium min-w-[80px]">Day Win</th>
          </tr>
          <tr className="bg-slate-100 dark:bg-slate-800/70 text-slate-700 dark:text-slate-200 text-xs font-semibold">
            <th className="sticky left-0 z-10 bg-slate-100 dark:bg-slate-800/70 px-3 py-2 text-left">Moyenne du mois</th>
            <th className="px-3 py-2"></th>
            <th className="px-3 py-2 text-left tabular-nums">{formatPct(monthlyAverage)}</th>
            {monthlyHabitAverages.map((v, i) => (
              <th key={i} className="px-2 py-2 text-center tabular-nums font-normal">
                {formatPct(v)}
              </th>
            ))}
            <th className="px-2 py-2 text-center tabular-nums font-normal">{formatPct(monthlyHealthAvg)}</th>
            {monthlyTaskAverages.map((v, i) => (
              <th key={i} className="px-2 py-2 text-left tabular-nums font-normal">
                {formatPct(v)}
              </th>
            ))}
            <th className="px-2 py-2 text-center tabular-nums font-normal">{formatPct(monthlyDayWin)}</th>
          </tr>
        </thead>
        <tbody>
          {dates.map((date, idx) => {
            const day = idx + 1;
            const dName = dayNameFr(year, month, day);
            const isWeekend = dName === "dimanche" || dName === "samedi";
            const d = data.dashboard[date];
            const hAvg = healthDayAverage(data.health[date]);
            const dailyAvg = hasAnyDashboardData(d) ? dashboardDailyAverage(d, hAvg) : null;
            const today = isToday(date);
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
                <td className="px-3 py-1.5 tabular-nums text-slate-700 dark:text-slate-200 font-medium">{formatPct(dailyAvg)}</td>
                {DASHBOARD_HABITS.map((h) => (
                  <td key={h.key} className="px-2 py-1.5 text-center">
                    <div className="flex justify-center">
                      <ScoreCell
                        value={d?.[h.key] ?? null}
                        onChange={(v) => setDashboardValue(date, h.key as DashboardKey, v)}
                      />
                    </div>
                  </td>
                ))}
                <td className="px-2 py-1.5 text-center tabular-nums text-slate-500 dark:text-slate-400">
                  {formatPct(hAvg)}
                </td>
                {[1, 2, 3].map((i) => {
                  const taskKey = `task${i}` as "task1" | "task2" | "task3";
                  const task = d?.[taskKey];
                  return (
                    <td key={i} className="px-2 py-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={task?.label ?? ""}
                          onChange={(e) => setTask(date, i as 1 | 2 | 3, { label: e.target.value })}
                          placeholder="Tâche..."
                          className="w-full min-w-[130px] rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-400 focus:outline-none bg-transparent px-1.5 py-1 text-slate-700 dark:text-slate-200 placeholder:text-slate-400"
                        />
                        <ScoreCell
                          value={task?.score ?? null}
                          onChange={(v) => setTask(date, i as 1 | 2 | 3, { score: v })}
                        />
                      </div>
                    </td>
                  );
                })}
                <td className="px-2 py-1.5 text-center">
                  <div className="flex justify-center">
                    <ScoreCell
                      value={d?.dayWin ?? null}
                      onChange={(v) => setDashboardValue(date, "dayWin", v)}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
