// "na" marks a cell as explicitly excluded from every average/Day Win calculation
// (distinct from null, which just means "not filled in yet").
export type Score = 0 | 0.5 | 1 | null | "na";

export interface TaskEntry {
  label: string;
  score: Score;
}

export interface DashboardDay {
  date: string; // YYYY-MM-DD
  sleepOnTime: Score;
  wakeOnTime: Score;
  sport: Score;
  workMorning: Score;
  workAfternoon: Score;
  controlEmotion: Score;
  reading: Score;
  training: Score;
  // Values for user-added custom habit columns (see DashboardHabitDef),
  // keyed by habit id. The 8 built-in habits above stay on their own fixed
  // fields for backward compatibility with existing data/imports.
  customHabits: Record<string, Score>;
  task1: TaskEntry;
  task2: TaskEntry;
  task3: TaskEntry;
  // Manually selected — "was this a winning trading day?". Not part of the
  // computed daily/monthly average (mirrors the source spreadsheet, where
  // this column sits outside the AVERAGE() range).
  dayWin: Score;
}

// Describes one habit column on the Dashboard, in display order. Builtin
// habits store their value on DashboardDay's own field named `id`; custom
// ones (added by the user) store it in DashboardDay.customHabits[id].
export interface DashboardHabitDef {
  id: string;
  short: string;
  builtin: boolean;
  // Personal target for this habit, as a 0-100 percentage. null = no target set.
  target: number | null;
}

export interface HealthDay {
  date: string; // YYYY-MM-DD
  shower: Score;
  teeth: Score;
  oil: Score;
  healthy: Score;
  supplement: Score;
  walk: Score;
  noFap: Score;
  tracking: Score;
  morningRoutine: Score;
  noSmoke: Score;
  // Values for user-added custom habit columns (see HealthHabitDef), keyed
  // by habit id. The 10 built-in habits above stay on their own fixed
  // fields for backward compatibility with existing data/imports.
  customHabits: Record<string, Score>;
}

// Describes one habit column on Health, in display order. Builtin habits
// store their value on HealthDay's own field named `id`; custom ones
// (added by the user) store it in HealthDay.customHabits[id].
export interface HealthHabitDef {
  id: string;
  short: string;
  builtin: boolean;
  // Personal target for this habit, as a 0-100 percentage. null = no target set.
  target: number | null;
}

export type DashboardKey =
  | "sleepOnTime"
  | "wakeOnTime"
  | "sport"
  | "workMorning"
  | "workAfternoon"
  | "controlEmotion"
  | "reading"
  | "training"
  | "dayWin";

export type HealthKey =
  | "shower"
  | "teeth"
  | "oil"
  | "healthy"
  | "supplement"
  | "walk"
  | "noFap"
  | "tracking"
  | "morningRoutine"
  | "noSmoke";

export interface CalorieDay {
  date: string; // YYYY-MM-DD
  weight: number | null; // kg
  // Per-day activity multiplier (Mifflin-St Jeor style, e.g. 1.375) — how
  // active this specific day was (rest day vs. a walk vs. walk + sport).
  // Falls back to the profile's default activityMultiplier when null.
  activityLevel: number | null;
  breakfast: number | null; // kcal — "Matin"
  lunch: number | null; // kcal — "Midi"
  dinner: number | null; // kcal — "Soir"
  other: number | null; // kcal — "Autre" (snacks, etc.)
  protein: number | null; // g consumed
  // Snapshot of the profile's calorieGoal the first time this day was
  // edited — locked in so later changes to the goal don't retroactively
  // rewrite the "Objectif" of days already filled in.
  calorieGoalAtEntry: number | null;
}

export type CalorieMealKey = "breakfast" | "lunch" | "dinner" | "other";

export type Sex = "M" | "F";

export interface Profile {
  heightCm: number;
  age: number;
  sex: Sex;
  // Mifflin-St Jeor activity multiplier: 1.2 sedentary … 1.9 very active.
  activityMultiplier: number;
  // Protein target in grams per kg of bodyweight.
  proteinPerKg: number;
  // Daily calorie goal relative to TDEE: negative = deficit (cutting),
  // positive = surplus (bulking), 0 = maintenance.
  calorieGoal: number;
}

export interface AppData {
  dashboard: Record<string, DashboardDay>;
  health: Record<string, HealthDay>;
  calories: Record<string, CalorieDay>;
  profile: Profile;
  // Ordered list of Dashboard habit columns — add/remove/rename/reorder.
  dashboardHabits: DashboardHabitDef[];
  // Same, for Health.
  healthHabits: HealthHabitDef[];
}
