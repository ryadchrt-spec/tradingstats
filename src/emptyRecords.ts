import type { CalorieDay, DashboardDay, DashboardHabitDef, HealthDay, HealthHabitDef, Profile } from "./types";
import { DASHBOARD_HABITS, HEALTH_HABITS } from "./habits";

export function emptyDashboardDay(date: string): DashboardDay {
  return {
    date,
    sleepOnTime: null,
    wakeOnTime: null,
    sport: null,
    workMorning: null,
    workAfternoon: null,
    controlEmotion: null,
    reading: null,
    training: null,
    customHabits: {},
    task1: { label: "", score: null },
    task2: { label: "", score: null },
    task3: { label: "", score: null },
    dayWin: null,
  };
}

export function defaultDashboardHabits(): DashboardHabitDef[] {
  return DASHBOARD_HABITS.map((h) => ({ id: h.key, short: h.short, builtin: true, target: null }));
}

export function emptyHealthDay(date: string): HealthDay {
  return {
    date,
    shower: null,
    teeth: null,
    oil: null,
    healthy: null,
    supplement: null,
    walk: null,
    noFap: null,
    tracking: null,
    morningRoutine: null,
    noSmoke: null,
    customHabits: {},
  };
}

export function defaultHealthHabits(): HealthHabitDef[] {
  return HEALTH_HABITS.map((h) => ({ id: h.key, short: h.short, builtin: true, target: null }));
}

export function emptyCalorieDay(date: string): CalorieDay {
  return {
    date,
    weight: null,
    activityLevel: null,
    breakfast: null,
    lunch: null,
    dinner: null,
    other: null,
    protein: null,
    calorieGoalAtEntry: null,
  };
}

export function defaultProfile(): Profile {
  return {
    heightCm: 170,
    age: 25,
    sex: "M",
    activityMultiplier: 1.55,
    proteinPerKg: 2,
    calorieGoal: 0,
  };
}
