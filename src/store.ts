import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AppData,
  CalorieDay,
  DashboardDay,
  DashboardKey,
  HealthDay,
  HealthKey,
  Profile,
  Score,
  TaskEntry,
} from "./types";
import { buildSeedData } from "./seedData";
import { emptyDashboardDay, emptyHealthDay, emptyCalorieDay, defaultProfile } from "./emptyRecords";

interface Store {
  data: AppData;
  setDashboardValue: (date: string, key: DashboardKey, value: Score) => void;
  setHealthValue: (date: string, key: HealthKey, value: Score) => void;
  setTask: (date: string, taskIndex: 1 | 2 | 3, entry: Partial<TaskEntry>) => void;
  setCalorieValue: (date: string, key: keyof Omit<CalorieDay, "date">, value: number | null) => void;
  setProfile: (partial: Partial<Profile>) => void;
  getDashboardDay: (date: string) => DashboardDay;
  getHealthDay: (date: string) => HealthDay;
  getCalorieDay: (date: string) => CalorieDay;
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

      setCalorieValue: (date, key, value) =>
        set((state) => {
          const day = state.data.calories[date] ?? emptyCalorieDay(date);
          // Lock the calorie goal in on first fill so later profile changes
          // don't retroactively rewrite this day's "Objectif".
          const calorieGoalAtEntry = day.calorieGoalAtEntry ?? state.data.profile.calorieGoal;
          return {
            data: {
              ...state.data,
              calories: {
                ...state.data.calories,
                [date]: { ...day, [key]: value, calorieGoalAtEntry },
              },
            },
          };
        }),

      setProfile: (partial) =>
        set((state) => ({
          data: { ...state.data, profile: { ...state.data.profile, ...partial } },
        })),

      getDashboardDay: (date) => get().data.dashboard[date] ?? emptyDashboardDay(date),
      getHealthDay: (date) => get().data.health[date] ?? emptyHealthDay(date),
      getCalorieDay: (date) => get().data.calories[date] ?? emptyCalorieDay(date),

      importData: (data) => set({ data }),

      // Upserts by date key instead of replacing everything — used for importing
      // one month's Excel workbook at a time without wiping out other months.
      mergeData: (incoming) =>
        set((state) => ({
          data: {
            dashboard: { ...state.data.dashboard, ...(incoming.dashboard ?? {}) },
            health: { ...state.data.health, ...(incoming.health ?? {}) },
            calories: { ...state.data.calories, ...(incoming.calories ?? {}) },
            profile: { ...state.data.profile, ...(incoming.profile ?? {}) },
          },
        })),

      resetAll: () => set({ data: { dashboard: {}, health: {}, calories: {}, profile: defaultProfile() } }),
    }),
    {
      name: "tradingstats-productivity-v1",
      // Persisted state from before the calories/profile fields existed only has
      // `dashboard`/`health` — a shallow merge would otherwise wipe the new
      // defaults out entirely, so merge `data` (and `profile` beneath it) one
      // level deeper instead. Same reasoning applies every time a new field is
      // added to `profile` (e.g. calorieGoal) after users already have one saved.
      merge: (persisted, current) => {
        const persistedState = (persisted ?? {}) as Partial<Store>;
        return {
          ...current,
          ...persistedState,
          data: {
            ...current.data,
            ...(persistedState.data ?? {}),
            profile: {
              ...current.data.profile,
              ...(persistedState.data?.profile ?? {}),
            },
          },
        };
      },
    }
  )
);
