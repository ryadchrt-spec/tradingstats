import type { AppData } from "./types";
import { addMonthsToKey, addDaysToKey, enumerateDateKeys, todayKey, monthShortLabel } from "./dateUtils";

export type RangePreset = "month" | "3m" | "6m" | "9m" | "1y" | "all" | "previous";

export const RANGE_PRESETS: { key: RangePreset; label: string }[] = [
  { key: "month", label: "Ce mois" },
  { key: "3m", label: "3 mois" },
  { key: "6m", label: "6 mois" },
  { key: "9m", label: "9 mois" },
  { key: "1y", label: "1 an" },
  { key: "all", label: "Tout" },
];

export const COMPARE_PRESETS: { key: RangePreset | "none"; label: string }[] = [
  { key: "none", label: "Aucune" },
  { key: "previous", label: "Période précédente" },
  ...RANGE_PRESETS,
];

export interface DateRange {
  start: string;
  end: string;
}

function dataBounds(data: AppData): DateRange | null {
  const keys = [...Object.keys(data.dashboard), ...Object.keys(data.health)];
  if (keys.length === 0) return null;
  let min = keys[0];
  let max = keys[0];
  for (const k of keys) {
    if (k < min) min = k;
    if (k > max) max = k;
  }
  return { start: min, end: max };
}

export function resolveRange(
  preset: RangePreset,
  data: AppData,
  monthAnchor: { year: number; month: number },
  primaryRange?: DateRange
): DateRange {
  const end = todayKey();
  switch (preset) {
    case "month": {
      const start = `${monthAnchor.year}-${String(monthAnchor.month + 1).padStart(2, "0")}-01`;
      const lastDay = new Date(monthAnchor.year, monthAnchor.month + 1, 0).getDate();
      const monthEnd = `${monthAnchor.year}-${String(monthAnchor.month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
      return { start, end: monthEnd < end ? monthEnd : end };
    }
    case "3m":
      return { start: addMonthsToKey(end, -3), end };
    case "6m":
      return { start: addMonthsToKey(end, -6), end };
    case "9m":
      return { start: addMonthsToKey(end, -9), end };
    case "1y":
      return { start: addMonthsToKey(end, -12), end };
    case "all": {
      const bounds = dataBounds(data);
      return bounds ? { start: bounds.start, end } : { start: end, end };
    }
    case "previous": {
      if (!primaryRange) return { start: end, end };
      const spanDays = enumerateDateKeys(primaryRange.start, primaryRange.end).length;
      const prevEnd = addDaysToKey(primaryRange.start, -1);
      const prevStart = addDaysToKey(prevEnd, -(spanDays - 1));
      return { start: prevStart, end: prevEnd };
    }
    default:
      return { start: end, end };
  }
}

export function presetLabel(preset: RangePreset): string {
  return RANGE_PRESETS.find((p) => p.key === preset)?.label ?? preset;
}

// Splits a values array into up to `targetPoints` contiguous chunks and
// averages each — used to keep long ranges (6mo/1yr/all) readable on a chart
// while short ranges (a month) stay at daily resolution untouched.
export function chunkAverage(values: (number | null)[], targetPoints: number): (number | null)[] {
  const n = values.length;
  if (n === 0) return [];
  const points = Math.min(targetPoints, n);
  const out: (number | null)[] = [];
  for (let i = 0; i < points; i++) {
    const start = Math.floor((i * n) / points);
    const end = Math.max(start + 1, Math.floor(((i + 1) * n) / points));
    const slice = values.slice(start, end);
    const nums = slice.filter((v): v is number => v !== null);
    out.push(nums.length === 0 ? null : nums.reduce((a, b) => a + b, 0) / nums.length);
  }
  return out;
}

// Same chunking, but returns the representative (middle) date key of each
// chunk instead of the averaged value — used for x-axis labels.
export function chunkDates(dates: string[], targetPoints: number): string[] {
  const n = dates.length;
  if (n === 0) return [];
  const points = Math.min(targetPoints, n);
  const out: string[] = [];
  for (let i = 0; i < points; i++) {
    const start = Math.floor((i * n) / points);
    const end = Math.max(start + 1, Math.floor(((i + 1) * n) / points));
    out.push(dates[Math.floor((start + end - 1) / 2)]);
  }
  return out;
}

export function rangeDates(range: DateRange): string[] {
  return enumerateDateKeys(range.start, range.end);
}

// Recharts' XAxis `interval` prop is a skip-count ("show every Nth tick"),
// not a target label count — this converts "I want roughly `target` labels
// visible" into that skip-count, so a chart stays readable whether it's
// covering 6 months or several years of monthly buckets.
export function tickIntervalFor(count: number, target: number): number {
  return count > target ? Math.ceil(count / target) - 1 : 0;
}

export interface MonthBucket {
  key: string; // YYYY-MM
  label: string; // "Juil. 2026"
  dates: string[];
}

// Groups a flat list of date keys by calendar month — a bucket only contains
// the dates that are actually in range, so a partial month at either edge of
// the selection shows a partial (not misleadingly full) average.
export function monthBuckets(dates: string[]): MonthBucket[] {
  const map = new Map<string, string[]>();
  for (const date of dates) {
    const key = date.slice(0, 7);
    const list = map.get(key);
    if (list) list.push(date);
    else map.set(key, [date]);
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, ds]) => ({ key, label: monthShortLabel(ds[0]), dates: ds }));
}
