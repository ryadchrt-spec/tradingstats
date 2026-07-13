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
import {
  emptyDashboardDay,
  emptyHealthDay,
  emptyCalorieDay,
  defaultProfile,
  defaultDashboardHabits,
  defaultHealthHabits,
} from "./emptyRecords";

function makeHabitId(): string {
  return `custom_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

interface Store {
  data: AppData;
  setDashboardValue: (date: string, key: DashboardKey, value: Score) => void;
  setDashboardHabitValue: (date: string, habitId: string, value: Score) => void;
  addDashboardHabit: (short: string) => void;
  removeDashboardHabit: (id: string) => void;
  renameDashboardHabit: (id: string, short: string) => void;
  moveDashboardHabit: (id: string, direction: "up" | "down") => void;
  setDashboardHabitTarget: (id: string, target: number | null) => void;
  setHealthValue: (date: string, key: HealthKey, value: Score) => void;
  setHealthHabitValue: (date: string, habitId: string, value: Score) => void;
  addHealthHabit: (short: string) => void;
  removeHealthHabit: (id: string) => void;
  renameHealthHabit: (id: string, short: string) => void;
  moveHealthHabit: (id: string, direction: "up" | "down") => void;
  setHealthHabitTarget: (id: string, target: number | null) => void;
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

      setDashboardHabitValue: (date, habitId, value) =>
        set((state) => {
          const habit = state.data.dashboardHabits.find((h) => h.id === habitId);
          if (!habit) return {};
          const day = state.data.dashboard[date] ?? emptyDashboardDay(date);
          const updatedDay = habit.builtin
            ? { ...day, [habitId]: value }
            : { ...day, customHabits: { ...(day.customHabits ?? {}), [habitId]: value } };
          return {
            data: {
              ...state.data,
              dashboard: { ...state.data.dashboard, [date]: updatedDay },
            },
          };
        }),

      addDashboardHabit: (short) =>
        set((state) => ({
          data: {
            ...state.data,
            dashboardHabits: [...state.data.dashboardHabits, { id: makeHabitId(), short: short.trim() || "Habitude", builtin: false, target: null }],
          },
        })),

      removeDashboardHabit: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            dashboardHabits: state.data.dashboardHabits.filter((h) => h.id !== id),
          },
        })),

      renameDashboardHabit: (id, short) =>
        set((state) => ({
          data: {
            ...state.data,
            dashboardHabits: state.data.dashboardHabits.map((h) => (h.id === id ? { ...h, short } : h)),
          },
        })),

      moveDashboardHabit: (id, direction) =>
        set((state) => {
          const list = [...state.data.dashboardHabits];
          const idx = list.findIndex((h) => h.id === id);
          const swapWith = direction === "up" ? idx - 1 : idx + 1;
          if (idx === -1 || swapWith < 0 || swapWith >= list.length) return {};
          [list[idx], list[swapWith]] = [list[swapWith], list[idx]];
          return { data: { ...state.data, dashboardHabits: list } };
        }),

      setDashboardHabitTarget: (id, target) =>
        set((state) => ({
          data: {
            ...state.data,
            dashboardHabits: state.data.dashboardHabits.map((h) => (h.id === id ? { ...h, target } : h)),
          },
        })),

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

      setHealthHabitValue: (date, habitId, value) =>
        set((state) => {
          const habit = state.data.healthHabits.find((h) => h.id === habitId);
          if (!habit) return {};
          const day = state.data.health[date] ?? emptyHealthDay(date);
          const updatedDay = habit.builtin
            ? { ...day, [habitId]: value }
            : { ...day, customHabits: { ...(day.customHabits ?? {}), [habitId]: value } };
          return {
            data: {
              ...state.data,
              health: { ...state.data.health, [date]: updatedDay },
            },
          };
        }),

      addHealthHabit: (short) =>
        set((state) => ({
          data: {
            ...state.data,
            healthHabits: [...state.data.healthHabits, { id: makeHabitId(), short: short.trim() || "Habitude", builtin: false, target: null }],
          },
        })),

      removeHealthHabit: (id) =>
        set((state) => ({
          data: {
            ...state.data,
            healthHabits: state.data.healthHabits.filter((h) => h.id !== id),
          },
        })),

      renameHealthHabit: (id, short) =>
        set((state) => ({
          data: {
            ...state.data,
            healthHabits: state.data.healthHabits.map((h) => (h.id === id ? { ...h, short } : h)),
          },
        })),

      moveHealthHabit: (id, direction) =>
        set((state) => {
          const list = [...state.data.healthHabits];
          const idx = list.findIndex((h) => h.id === id);
          const swapWith = direction === "up" ? idx - 1 : idx + 1;
          if (idx === -1 || swapWith < 0 || swapWith >= list.length) return {};
          [list[idx], list[swapWith]] = [list[swapWith], list[idx]];
          return { data: { ...state.data, healthHabits: list } };
        }),

      setHealthHabitTarget: (id, target) =>
        set((state) => ({
          data: {
            ...state.data,
            healthHabits: state.data.healthHabits.map((h) => (h.id === id ? { ...h, target } : h)),
          },
        })),

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
            dashboardHabits: incoming.dashboardHabits ?? state.data.dashboardHabits,
            healthHabits: incoming.healthHabits ?? state.data.healthHabits,
          },
        })),

      resetAll: () =>
        set({
          data: {
            dashboard: {},
            health: {},
            calories: {},
            profile: defaultProfile(),
            dashboardHabits: defaultDashboardHabits(),
            healthHabits: defaultHealthHabits(),
          },
        }),
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
