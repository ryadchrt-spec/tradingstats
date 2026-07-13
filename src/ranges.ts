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

// Zooms a 0-100 percentage axis tightly into the data's actual range, adding
// only a couple points of breathing room on each side (not a "nice round
// number" margin) so the curve fills the chart. Ticks are evenly spaced
// across that exact domain, computed ourselves rather than left to recharts'
// automatic tick generation — its own nice-tick rounding can otherwise pad
// the visible range well past what was asked for, leaving an empty band.
export function niceAxisDomain(values: number[], padding = 2, tickCount = 5): { domain: [number, number]; ticks: number[] } {
  if (!values.length) return { domain: [0, 100], ticks: [0, 25, 50, 75, 100] };
  const min = Math.max(0, Math.floor(Math.min(...values) - padding));
  const max = Math.min(100, Math.ceil(Math.max(...values) + padding));
  const step = (max - min) / (tickCount - 1);
  const ticks = [...new Set(Array.from({ length: tickCount }, (_, i) => Math.round(min + step * i)))];
  return { domain: [min, max], ticks };
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
