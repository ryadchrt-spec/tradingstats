import { useMemo, useState } from "react";
import { useStore } from "../store";
import { formatDateKey, parseDateKey, todayKey } from "../dateUtils";
import { average, dashboardDailyAverage, hasAnyDashboardData, healthDayAverage } from "../compute";
import { useDarkMode } from "../useDarkMode";

const MONTH_SHORT_FR = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const DAY_ROW_LABELS = ["Lun", "", "Mer", "", "Ven", "", "Dim"];

// One cell per day of the year, grouped into Monday-first weeks (columns),
// padded with nulls before Jan 1 / after Dec 31 so the grid stays rectangular.
function buildYearWeeks(year: number): (string | null)[][] {
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const dec31 = new Date(Date.UTC(year, 11, 31));
  const startDow = (jan1.getUTCDay() + 6) % 7; // 0 = Monday
  const gridStart = new Date(jan1);
  gridStart.setUTCDate(gridStart.getUTCDate() - startDow);
  const endDow = (dec31.getUTCDay() + 6) % 7;
  const gridEnd = new Date(dec31);
  gridEnd.setUTCDate(gridEnd.getUTCDate() + (6 - endDow));

  const weeks: (string | null)[][] = [];
  const cur = new Date(gridStart);
  while (cur <= gridEnd) {
    const week: (string | null)[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(cur.getUTCFullYear() === year ? formatDateKey(cur) : null);
      cur.setUTCDate(cur.getUTCDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}

function bucketColor(pct: number | null, colors: string[]): string {
  if (pct === null) return colors[0];
  if (pct < 25) return colors[1];
  if (pct < 50) return colors[2];
  if (pct < 75) return colors[3];
  return colors[4];
}

export function YearHeatmap() {
  const data = useStore((s) => s.data);
  const dark = useDarkMode();
  const [year, setYear] = useState(() => parseDateKey(todayKey()).getUTCFullYear());

  const colors = dark
    ? ["#26262380", "#1c3a5c", "#255488", "#2f6fb8", "#3987e5"]
    : ["#e7e5df", "#c7ddf5", "#8fbbe8", "#4f93d9", "#2a78d6"];

  const weeks = useMemo(() => buildYearWeeks(year), [year]);

  const dayPct = useMemo(() => {
    const map = new Map<string, number | null>();
    for (const week of weeks) {
      for (const date of week) {
        if (date === null || map.has(date)) continue;
        const d = data.dashboard[date];
        const hAvg = healthDayAverage(data.health[date], data.healthHabits);
        const avg = hasAnyDashboardData(d, data.dashboardHabits) ? dashboardDailyAverage(d, hAvg, data.dashboardHabits) : null;
        map.set(date, avg === null ? null : Math.round(avg * 100));
      }
    }
    return map;
  }, [weeks, data]);

  const yearAvg = average([...dayPct.values()].map((v) => (v === null ? null : v / 100)));
  const trackedDays = [...dayPct.values()].filter((v) => v !== null).length;

  const monthLabels = useMemo(() => {
    const labels: { weekIndex: number; label: string }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, wi) => {
      const firstValid = week.find((d) => d !== null);
      if (!firstValid) return;
      const m = parseDateKey(firstValid).getUTCMonth();
      if (m !== lastMonth) {
        labels.push({ weekIndex: wi, label: MONTH_SHORT_FR[m] });
        lastMonth = m;
      }
    });
    return labels;
  }, [weeks]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setYear((y) => y - 1)}
            className="h-8 w-8 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            aria-label="Année précédente"
          >
            ‹
          </button>
          <div className="min-w-[70px] text-center font-semibold text-slate-800 dark:text-slate-100 tabular-nums">{year}</div>
          <button
            onClick={() => setYear((y) => y + 1)}
            className="h-8 w-8 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
            aria-label="Année suivante"
          >
            ›
          </button>
        </div>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          {trackedDays} jour(s) suivis · moyenne {yearAvg === null ? "—" : `${Math.round(yearAvg * 100)}%`}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Vue par année — moyenne journalière</h3>
        {/* Week columns stretch to fill the card's full width (1fr each) instead
            of a fixed small cell size, so the grid uses the whole box. */}
        <div className="flex flex-col gap-1 w-full">
          <div className="flex gap-[3px] pl-8">
            <div className="grid flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
              {weeks.map((_, wi) => {
                const label = monthLabels.find((m) => m.weekIndex === wi)?.label;
                return (
                  <div key={wi} className="text-[9px] text-slate-400 dark:text-slate-500 whitespace-nowrap overflow-visible">
                    {label ?? ""}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-[3px] w-full">
            <div className="flex flex-col gap-[3px] w-7 shrink-0">
              {DAY_ROW_LABELS.map((label, i) => (
                <div key={i} className="flex-1 text-[9px] flex items-center text-slate-400 dark:text-slate-500">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid flex-1 gap-[3px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}>
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[3px]">
                  {week.map((date, di) => {
                    const pct = date ? dayPct.get(date) ?? null : null;
                    return (
                      <div
                        key={di}
                        title={date ? `${date} : ${pct === null ? "pas de données" : `${pct}%`}` : undefined}
                        className="w-full aspect-square rounded-sm"
                        style={{ background: date ? bucketColor(pct, colors) : "transparent" }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 text-[10px] text-slate-400 dark:text-slate-500">
          <span>Moins</span>
          {colors.map((col, i) => (
            <span key={i} className="h-[11px] w-[11px] rounded-sm" style={{ background: col }} />
          ))}
          <span>Plus</span>
        </div>
      </div>
    </div>
  );
}
