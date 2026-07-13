import type { CalorieDay, Profile } from "./types";
import { parseDateKey, addDaysToKey } from "./dateUtils";

export function totalCalories(day: CalorieDay | undefined): number | null {
  if (!day) return null;
  const meals = [day.breakfast, day.lunch, day.dinner, day.other];
  if (meals.every((m) => m === null)) return null;
  return meals.reduce((sum: number, m) => sum + (m ?? 0), 0);
}

// Mifflin-St Jeor basal metabolic rate — the calories burned at total rest,
// from weight/height/age/sex alone (no activity factored in yet).
export function bmr(weightKg: number | null, profile: Profile): number | null {
  if (weightKg === null) return null;
  return profile.sex === "M"
    ? 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5
    : 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161;
}

// BMR times an activity multiplier for TDEE (Total Daily Energy Expenditure) —
// the actual calorie target for that day's weight. Accepts an optional
// per-day activity override (that day's CalorieDay.activityLevel); falls
// back to the profile's default multiplier when not given.
export function tdee(weightKg: number | null, profile: Profile, activityOverride?: number | null): number | null {
  const base = bmr(weightKg, profile);
  if (base === null) return null;
  return base * (activityOverride ?? profile.activityMultiplier);
}

export function proteinTarget(weightKg: number | null, profile: Profile): number | null {
  if (weightKg === null) return null;
  return weightKg * profile.proteinPerKg;
}

// The calorie intake to actually aim for — TDEE adjusted by a deficit/surplus
// goal (e.g. TDEE - 500 to target a cut). This is what shows as "Objectif".
// Uses the day's locked-in goal snapshot when it has one (already filled in),
// falling back to the profile's live goal for a day that's still empty.
export function calorieTarget(day: CalorieDay | undefined, profile: Profile): number | null {
  const maintenance = tdee(day?.weight ?? null, profile, day?.activityLevel);
  if (maintenance === null) return null;
  const goal = day?.calorieGoalAtEntry ?? profile.calorieGoal;
  return maintenance + goal;
}

// Positive = calorie deficit (on track to lose fat), negative = surplus.
// Measured against true TDEE (maintenance), not the goal-adjusted target —
// this is what actually drives weight change, regardless of what was planned.
export function calorieDeficit(day: CalorieDay | undefined, profile: Profile): number | null {
  if (!day) return null;
  const target = tdee(day.weight, profile, day.activityLevel);
  const intake = totalCalories(day);
  if (target === null || intake === null) return null;
  return target - intake;
}

// 1 kg of fat ~ 7700 kcal — the standard rough conversion used to translate a
// calorie deficit into a projected weight change.
const KCAL_PER_KG = 7700;

// Sign matches "actual weight change": a calorie deficit (positive totalDeficit)
// translates into a negative kg change, i.e. weight lost — same convention as
// (last tracked weight - first tracked weight).
export function theoreticalKgChange(totalDeficit: number): number {
  return -totalDeficit / KCAL_PER_KG;
}

// Zooms a chart's Y-axis into the actual spread of its values (like the
// weight chart) instead of always anchoring at 0, so small variations stay
// readable regardless of the series' magnitude (kg, kcal, g).
export function chartDomain(values: number[], paddingRatio = 0.15, minPadding = 1): [number, number] {
  if (!values.length) return [0, 100];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(minPadding, (max - min) * paddingRatio);
  return [Math.floor(min - pad), Math.ceil(max + pad)];
}

export type GoalProjection =
  | { status: "no-target" }
  | { status: "not-enough-data" }
  | { status: "reached" }
  | { status: "diverging" }
  | { status: "projected"; date: string; daysAhead: number };

// Extrapolates the tracked weight trend (simple linear regression over the
// selected period, days-since-start vs weight — more robust against noisy
// day-to-day fluctuations than just comparing the first/last points) to
// estimate when the target weight will be reached.
export function projectGoalDate(weightPoints: { date: string; weight: number }[], targetWeightKg: number | null): GoalProjection {
  if (targetWeightKg === null) return { status: "no-target" };
  if (weightPoints.length < 2) return { status: "not-enough-data" };

  const firstMs = parseDateKey(weightPoints[0].date).getTime();
  const xs = weightPoints.map((p) => (parseDateKey(p.date).getTime() - firstMs) / 86_400_000);
  const ys = weightPoints.map((p) => p.weight);
  const lastWeight = ys[ys.length - 1];
  if (Math.abs(lastWeight - targetWeightKg) < 0.1) return { status: "reached" };

  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (ys[i] - meanY);
    den += (xs[i] - meanX) ** 2;
  }
  const slope = den === 0 ? 0 : num / den; // kg/day
  if (slope === 0) return { status: "diverging" };

  const daysAhead = (targetWeightKg - lastWeight) / slope;
  if (daysAhead <= 0) return { status: "diverging" };

  const date = addDaysToKey(weightPoints[weightPoints.length - 1].date, Math.round(daysAhead));
  return { status: "projected", date, daysAhead: Math.round(daysAhead) };
}

export function formatNum(v: number | null, decimals = 0): string {
  if (v === null || Number.isNaN(v)) return "—";
  return v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatSigned(v: number | null, decimals = 0): string {
  if (v === null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${formatNum(v, decimals)}`;
}

// NAP = Niveau d'Activité Physique, the multiplier at the end of the TDEE
// formula (BMR × NAP). Matches the presets used in the source spreadsheet.
export const ACTIVITY_LEVELS: { value: number; label: string; short: string }[] = [
  { value: 1.35, label: "NAP 1,35", short: "1,35" },
  { value: 1.45, label: "NAP 1,45", short: "1,45" },
  { value: 1.55, label: "NAP 1,55", short: "1,55" },
  { value: 1.65, label: "NAP 1,65", short: "1,65" },
  { value: 1.75, label: "NAP 1,75", short: "1,75" },
];

export const CALORIE_GOAL_PRESETS: number[] = [-750, -500, -250, 0, 250, 500];
