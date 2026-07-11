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

export function todayKey(): string {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

// All date-key arithmetic below uses UTC-anchored Date objects purely as a
// calendar calculator (no timezone reads), so "YYYY-MM-DD" round-trips exactly.
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

export function formatDateKey(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

export function addDaysToKey(key: string, days: number): string {
  const d = parseDateKey(key);
  d.setUTCDate(d.getUTCDate() + days);
  return formatDateKey(d);
}

export function addMonthsToKey(key: string, months: number): string {
  const d = parseDateKey(key);
  const targetMonth = d.getUTCMonth() + months;
  const targetDay = d.getUTCDate();
  const probe = new Date(Date.UTC(d.getUTCFullYear(), targetMonth, 1));
  const daysInTarget = new Date(Date.UTC(probe.getUTCFullYear(), probe.getUTCMonth() + 1, 0)).getUTCDate();
  probe.setUTCDate(Math.min(targetDay, daysInTarget));
  return formatDateKey(probe);
}

export function enumerateDateKeys(startKey: string, endKey: string): string[] {
  const out: string[] = [];
  let cur = startKey;
  let guard = 0;
  while (cur <= endKey && guard < 20000) {
    out.push(cur);
    cur = addDaysToKey(cur, 1);
    guard++;
  }
  return out;
}

export function daysBetweenKeys(startKey: string, endKey: string): number {
  return Math.round((parseDateKey(endKey).getTime() - parseDateKey(startKey).getTime()) / 86400000) + 1;
}

export function isoWeekLabel(key: string): string {
  const d = parseDateKey(key);
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  const week =
    1 + Math.round(((d.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
  return `S${week}`;
}

export function monthLabelFr(key: string): string {
  const d = parseDateKey(key);
  const short = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${short[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function shortDateLabelFr(key: string): string {
  const d = parseDateKey(key);
  const short = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
  return `${d.getUTCDate()} ${short[d.getUTCMonth()]}`;
}
