export type Score = 0 | 0.5 | 1 | null;

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
  task1: TaskEntry;
  task2: TaskEntry;
  task3: TaskEntry;
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
}

export type DashboardKey =
  | "sleepOnTime"
  | "wakeOnTime"
  | "sport"
  | "workMorning"
  | "workAfternoon"
  | "controlEmotion"
  | "reading"
  | "training";

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

export interface AppData {
  dashboard: Record<string, DashboardDay>;
  health: Record<string, HealthDay>;
}
