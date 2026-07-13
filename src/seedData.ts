import type { AppData, DashboardDay, HealthDay } from "./types";
import { defaultProfile, defaultDashboardHabits, defaultHealthHabits } from "./emptyRecords";

function d(
  date: string,
  partial: Partial<Omit<DashboardDay, "date" | "task1" | "task2" | "task3">> & {
    task1?: Partial<DashboardDay["task1"]>;
    task2?: Partial<DashboardDay["task2"]>;
    task3?: Partial<DashboardDay["task3"]>;
  }
): DashboardDay {
  const { task1, task2, task3, ...habits } = partial;
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
    dayWin: null,
    ...habits,
    task1: { label: "", score: null, ...task1 },
    task2: { label: "", score: null, ...task2 },
    task3: { label: "", score: null, ...task3 },
  };
}

function h(
  date: string,
  partial: Partial<Omit<HealthDay, "date">>
): HealthDay {
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
    ...partial,
  };
}

// Reconstructed from the user's original "Dashboard Productivité Juillet 2026" spreadsheet.
export function buildSeedData(): AppData {
  const dashboard: Record<string, DashboardDay> = {};
  const health: Record<string, HealthDay> = {};

  const dash: DashboardDay[] = [
    d("2026-07-01", {
      sleepOnTime: 0,
      wakeOnTime: 0,
      workMorning: 0,
      workAfternoon: 0,
      task1: { label: "Analyse Technique + Fondamental", score: 0 },
      task2: { label: "Logiciel TradingStats", score: 0 },
      task3: { label: "Refaire les stats de productivité", score: 0 },
    }),
    d("2026-07-02", {
      sleepOnTime: 1,
      wakeOnTime: 0,
      sport: 0,
      workMorning: 1,
      workAfternoon: 0.5,
      controlEmotion: 1,
      task1: { label: "Analyse Technique + Fondamental", score: 1 },
      task2: { label: "Logiciel TradingStats", score: 1 },
      task3: { label: "Ménage", score: 1 },
    }),
    d("2026-07-03", {
      sleepOnTime: 0.5,
      wakeOnTime: 1,
      sport: 0,
      workMorning: 1,
      workAfternoon: 0,
      controlEmotion: 1,
      task1: { label: "Analyse Technique + Fondamental", score: 1 },
      task2: { label: "Logiciel TradingStats", score: 0 },
      task3: { label: "Ménage", score: 1 },
    }),
    d("2026-07-04", {
      sleepOnTime: 1,
      wakeOnTime: 0,
      sport: 0,
      workMorning: 0,
      task1: { label: "Analyse Technique + Fondamental", score: null },
      task2: { label: "Logiciel TradingStats", score: 0 },
      task3: { label: "Ménage", score: 0 },
    }),
    d("2026-07-06", {
      wakeOnTime: 0,
      controlEmotion: 1,
      task1: { label: "Analyse Technique + Fondamental", score: null },
      task2: { label: "Ménage", score: null },
    }),
  ];
  for (const day of dash) dashboard[day.date] = day;

  const heal: HealthDay[] = [
    h("2026-07-01", { shower: 0, teeth: 0, oil: 0, healthy: 0.5, supplement: 0, walk: 0.5, noFap: 0, tracking: 0, morningRoutine: 0.5, noSmoke: 0 }),
    h("2026-07-02", { shower: 1, teeth: 0, healthy: 0, supplement: 0.5, walk: 0, noFap: 1, tracking: 1, morningRoutine: 0.5, noSmoke: 1 }),
    h("2026-07-03", { shower: 0, teeth: 0, healthy: 0, supplement: 0, walk: 0.5, noFap: 0, tracking: 1, morningRoutine: 0.5, noSmoke: 1 }),
    h("2026-07-04", { shower: 0, teeth: 0, oil: 0, healthy: 0, supplement: 0, walk: 0, noFap: 0, tracking: 0, morningRoutine: 0.5, noSmoke: 1 }),
    h("2026-07-05", { shower: 1, teeth: 0, healthy: 0, supplement: 0, walk: 0, noFap: 0, tracking: 1, morningRoutine: 0.5, noSmoke: 0 }),
    h("2026-07-06", { healthy: 1, walk: 0, noFap: 1, tracking: 1, morningRoutine: 0.5, noSmoke: 1 }),
  ];
  for (const day of heal) health[day.date] = day;

  return {
    dashboard,
    health,
    calories: {},
    profile: defaultProfile(),
    dashboardHabits: defaultDashboardHabits(),
    healthHabits: defaultHealthHabits(),
    annotations: [],
  };
}
