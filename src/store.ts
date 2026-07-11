import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppData, DashboardDay, DashboardKey, HealthDay, HealthKey, Score, TaskEntry } from "./types";
import { buildSeedData } from "./seedData";

function emptyDashboardDay(date: string): DashboardDay {
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
  };
}

function emptyHealthDay(date: string): HealthDay {
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

interface Store {
  data: AppData;
  setDashboardValue: (date: string, key: DashboardKey, value: Score) => void;
  setHealthValue: (date: string, key: HealthKey, value: Score) => void;
  setTask: (date: string, taskIndex: 1 | 2 | 3, entry: Partial<TaskEntry>) => void;
  getDashboardDay: (date: string) => DashboardDay;
  getHealthDay: (date: string) => HealthDay;
  importData: (data: AppData) => void;
  resetAll: () => void;
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      data: buildSeedData(),

      setDashboardValue: (date, key, value) =>
        set((state) => {
          const day = state.data.dashboard[date] ?? emptyDashboardDay(date);
          return {
            data: {
              ...state.data,
              dashboard: {
                ...state.data.dashboard,
                [date]: { ...day, [key]: value },
              },
            },
          };
        }),

      setHealthValue: (date, key, value) =>
        set((state) => {
          const day = state.data.health[date] ?? emptyHealthDay(date);
          return {
            data: {
              ...state.data,
              health: {
                ...state.data.health,
                [date]: { ...day, [key]: value },
              },
            },
          };
        }),

      setTask: (date, taskIndex, entry) =>
        set((state) => {
          const day = state.data.dashboard[date] ?? emptyDashboardDay(date);
          const taskKey = `task${taskIndex}` as "task1" | "task2" | "task3";
          return {
            data: {
              ...state.data,
              dashboard: {
                ...state.data.dashboard,
                [date]: {
                  ...day,
                  [taskKey]: { ...day[taskKey], ...entry },
                },
              },
            },
          };
        }),

      getDashboardDay: (date) => get().data.dashboard[date] ?? emptyDashboardDay(date),
      getHealthDay: (date) => get().data.health[date] ?? emptyHealthDay(date),

      importData: (data) => set({ data }),

      resetAll: () => set({ data: { dashboard: {}, health: {} } }),
    }),
    {
      name: "tradingstats-productivity-v1",
    }
  )
);
