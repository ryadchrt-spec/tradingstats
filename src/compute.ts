import type { DashboardDay, DashboardHabitDef, HealthDay, HealthHabitDef, Score } from "./types";

export function average(values: (number | null | undefined)[]): number | null {
  const nums = values.filter((v): v is number => v !== null && v !== undefined);
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// Converts a Score to a plain number for averaging. "na" (explicitly excluded)
// and null (not filled in) both drop out of the calculation.
export function scoreToNum(v: Score | null | undefined): number | null {
  if (v === null || v === undefined || v === "na") return null;
  return v;
}

// Builtin habits live on their own DashboardDay field (named after the habit
// id); custom ones live in customHabits[id]. This is the single place that
// knows how to read either, so callers never need to branch on `builtin`.
export function dashboardHabitValue(d: DashboardDay | undefined, habit: DashboardHabitDef): Score {
  if (!d) return null;
  if (habit.builtin) return (d as unknown as Record<string, Score>)[habit.id] ?? null;
  return d.customHabits?.[habit.id] ?? null;
}

// Same idea as dashboardHabitValue, for Health's habit columns.
export function healthHabitValue(h: HealthDay | undefined, habit: HealthHabitDef): Score {
  if (!h) return null;
  if (habit.builtin) return (h as unknown as Record<string, Score>)[habit.id] ?? null;
  return h.customHabits?.[habit.id] ?? null;
}

export function healthDayAverage(h: HealthDay | undefined, habits: HealthHabitDef[]): number | null {
  if (!h) return null;
  return average(habits.map((habit) => scoreToNum(healthHabitValue(h, habit))));
}

// Mirrors the spreadsheet's Average = AVERAGE(D:R): habits + health + task scores.
// Deliberately excludes "dayWin" (col S in the source), which sits outside that range.
export function dashboardDailyAverage(
  d: DashboardDay | undefined,
  healthAvg: number | null,
  habits: DashboardHabitDef[]
): number | null {
  if (!d) return null;
  const values: (number | null)[] = habits.map((habit) => scoreToNum(dashboardHabitValue(d, habit)));
  values.push(healthAvg);
  values.push(scoreToNum(d.task1.score), scoreToNum(d.task2.score), scoreToNum(d.task3.score));
  return average(values);
}

export function hasAnyDashboardData(d: DashboardDay | undefined, habits: DashboardHabitDef[]): boolean {
  if (!d) return false;
  return (
    habits.some((h) => dashboardHabitValue(d, h) !== null) ||
    d.task1.score !== null ||
    d.task2.score !== null ||
    d.task3.score !== null ||
    d.task1.label.trim() !== "" ||
    d.task2.label.trim() !== "" ||
    d.task3.label.trim() !== "" ||
    d.dayWin !== null
  );
}

export function hasAnyHealthData(h: HealthDay | undefined, habits: HealthHabitDef[]): boolean {
  if (!h) return false;
  return habits.some((habit) => healthHabitValue(h, habit) !== null);
}

export function formatPct(v: number | null): string {
  if (v === null) return "—";
  return `${Math.round(v * 100)}%`;
}

export function scoreLabel(v: Score): string {
  if (v === null) return "";
  if (v === "na") return "N/A";
  if (v === 1) return "1";
  if (v === 0.5) return "½";
  return "0";
}

export const SCORE_CYCLE: Score[] = [null, 1, 0.5, 0, "na"];

export function nextScore(v: Score): Score {
  const idx = SCORE_CYCLE.indexOf(v);
  return SCORE_CYCLE[(idx + 1) % SCORE_CYCLE.length];
}

export interface HabitStat {
  label: string;
  value: number | null;
}

export function currentStreak(dayWins: (number | null)[], threshold = 0.5): number {
  let streak = 0;
  let started = false;
  for (let i = dayWins.length - 1; i >= 0; i--) {
    const v = dayWins[i];
    if (!started) {
      if (v === null) continue; // skip untracked trailing (future) days
      started = true;
    }
    if (v !== null && v >= threshold) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function daysTracked(dayWins: (number | null)[]): number {
  return dayWins.filter((v) => v !== null).length;
}

export interface DiffPair {
  primary: number | null; // rounded percentage, 0-100
  compareVal: number | null;
  diffLabel: string;
}

// Turns two 0-1 ratios into rounded percentages plus a "+N%"/"-N%" delta label —
// shared by every comparison-aware chart (habit bars, monthly bars).
export function toDiffPair(primaryRatio: number | null, compareRatio: number | null): DiffPair {
  const primary = primaryRatio === null ? null : Math.round(primaryRatio * 100);
  const compareVal = compareRatio === null ? null : Math.round(compareRatio * 100);
  const diff = primary !== null && compareVal !== null ? primary - compareVal : null;
  return { primary, compareVal, diffLabel: diff === null ? "" : `${diff > 0 ? "+" : ""}${diff}%` };
}
