import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppData, DashboardDay, DashboardKey, HealthDay, HealthKey, Score, TaskEntry } from "./types";
import { buildSeedData } from "./seedData";
import { emptyDashboardDay, emptyHealthDay } from "./emptyRecords";

interface Store {
  data: AppData;
  setDashboardValue: (date: string, key: DashboardKey, value: Score) => void;
  setHealthValue: (date: string, key: HealthKey, value: Score) => void;
  setTask: (date: string, taskIndex: 1 | 2 | 3, entry: Partial<TaskEntry>) => void;
  getDashboardDay: (date: string) => DashboardDay;
  getHealthDay: (date: string) => HealthDay;
  importData: (data: AppData) => void;
  mergeData: (data: Partial<AppData>) => void;
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

      // Upserts by date key instead of replacing everything — used for importing
      // one month's Excel workbook at a time without wiping out other months.
      mergeData: (incoming) =>
        set((state) => ({
          data: {
            dashboard: { ...state.data.dashboard, ...(incoming.dashboard ?? {}) },
            health: { ...state.data.health, ...(incoming.health ?? {}) },
          },
        })),

      resetAll: () => set({ data: { dashboard: {}, health: {} } }),
    }),
    {
      name: "tradingstats-productivity-v1",
    }
  )
);
