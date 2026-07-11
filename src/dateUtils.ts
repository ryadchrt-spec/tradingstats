import { FR_DAYS } from "./habits";

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${pad2(month + 1)}-${pad2(day)}`;
}

export function monthKey(year: number, month: number): string {
  return `${year}-${pad2(month + 1)}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function dayNameFr(year: number, month: number, day: number): string {
  const d = new Date(year, month, day);
  return FR_DAYS[d.getDay()];
}

export function isToday(dateKey: string): boolean {
  const now = new Date();
  return dateKey === toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

export function isFutureDate(dateKey: string): boolean {
  const now = new Date();
  const todayKey = toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
  return dateKey > todayKey;
}
