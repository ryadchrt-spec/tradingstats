import type { PeriodAnnotation } from "./types";

export function isAnnotatedDate(date: string, annotations: PeriodAnnotation[]): boolean {
  return annotations.some((a) => date >= a.start && date <= a.end);
}

// Drops any date that falls inside an annotated (excluded) period — used
// wherever an average/comparison is computed, so a marked vacation/illness
// period doesn't skew the numbers while the underlying data stays intact
// and editable in Dashboard/Health/Calories.
export function excludeAnnotated(dates: string[], annotations: PeriodAnnotation[]): string[] {
  if (!annotations.length) return dates;
  return dates.filter((d) => !isAnnotatedDate(d, annotations));
}
