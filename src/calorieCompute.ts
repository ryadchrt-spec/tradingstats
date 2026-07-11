import type { CalorieDay, Profile } from "./types";

export function totalCalories(day: CalorieDay | undefined): number | null {
  if (!day) return null;
  const meals = [day.breakfast, day.lunch, day.dinner, day.other];
  if (meals.every((m) => m === null)) return null;
  return meals.reduce((sum: number, m) => sum + (m ?? 0), 0);
}

export function hasAnyCalorieData(day: CalorieDay | undefined): boolean {
  if (!day) return false;
  return (
    day.weight !== null ||
    day.breakfast !== null ||
    day.lunch !== null ||
    day.dinner !== null ||
    day.other !== null ||
    day.protein !== null
  );
}

// Mifflin-St Jeor basal metabolic rate, times an activity multiplier for TDEE
// (Total Daily Energy Expenditure) — the calorie target for that day's weight.
export function tdee(weightKg: number | null, profile: Profile): number | null {
  if (weightKg === null) return null;
  const bmr =
    profile.sex === "M"
      ? 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age + 5
      : 10 * weightKg + 6.25 * profile.heightCm - 5 * profile.age - 161;
  return bmr * profile.activityMultiplier;
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
  const maintenance = tdee(day?.weight ?? null, profile);
  if (maintenance === null) return null;
  const goal = day?.calorieGoalAtEntry ?? profile.calorieGoal;
  return maintenance + goal;
}

// Positive = calorie deficit (on track to lose fat), negative = surplus.
// Measured against true TDEE (maintenance), not the goal-adjusted target —
// this is what actually drives weight change, regardless of what was planned.
export function calorieDeficit(day: CalorieDay | undefined, profile: Profile): number | null {
  if (!day) return null;
  const target = tdee(day.weight, profile);
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

export function formatNum(v: number | null, decimals = 0): string {
  if (v === null || Number.isNaN(v)) return "—";
  return v.toLocaleString("fr-FR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function formatSigned(v: number | null, decimals = 0): string {
  if (v === null || Number.isNaN(v)) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${formatNum(v, decimals)}`;
}

export const ACTIVITY_LEVELS: { value: number; label: string }[] = [
  { value: 1.2, label: "Sédentaire (peu ou pas de sport)" },
  { value: 1.375, label: "Légèrement actif (1-3j/semaine)" },
  { value: 1.55, label: "Modérément actif (3-5j/semaine)" },
  { value: 1.725, label: "Très actif (6-7j/semaine)" },
  { value: 1.9, label: "Extrêmement actif (sport intense/physique)" },
];

export const CALORIE_GOAL_PRESETS: number[] = [-750, -500, -250, 0, 250, 500];
