import type { DashboardDay, HealthDay } from "./types";

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
    task1: { label: "", score: null },
    task2: { label: "", score: null },
    task3: { label: "", score: null },
    dayWin: null,
  };
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
  };
}
