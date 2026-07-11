import type { DashboardKey, HealthKey } from "./types";

export interface HabitDef<K extends string> {
  key: K;
  label: string;
  short: string;
}

export const DASHBOARD_HABITS: HabitDef<DashboardKey>[] = [
  { key: "sleepOnTime", label: "Dormir 00:00", short: "Dormir" },
  { key: "wakeOnTime", label: "Réveil 08:00", short: "Réveil" },
  { key: "sport", label: "Sport", short: "Sport" },
  { key: "workMorning", label: "Session Work Matin", short: "Work Matin" },
  { key: "workAfternoon", label: "Session Work Aprem", short: "Work Aprem" },
  { key: "controlEmotion", label: "Control Emotion", short: "Émotion" },
  { key: "reading", label: "Lecture", short: "Lecture" },
  { key: "training", label: "Formation", short: "Formation" },
];

export const HEALTH_HABITS: HabitDef<HealthKey>[] = [
  { key: "shower", label: "Douche", short: "Douche" },
  { key: "teeth", label: "Dents", short: "Dents" },
  { key: "oil", label: "Huile / Dermaroller", short: "Huile" },
  { key: "healthy", label: "Healthy", short: "Healthy" },
  { key: "supplement", label: "Complément / Minoxidil", short: "Complément" },
  { key: "walk", label: "Marche", short: "Marche" },
  { key: "noFap", label: "No Fap", short: "No Fap" },
  { key: "tracking", label: "Tracking", short: "Tracking" },
  { key: "morningRoutine", label: "Morning Routine", short: "Routine" },
  { key: "noSmoke", label: "No Smoke", short: "No Smoke" },
];

export const FR_DAYS = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

export const FR_MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];
