import type { AppData, DashboardDay, HealthDay, Score } from "./types";
import { emptyDashboardDay, emptyHealthDay } from "./emptyRecords";

function normalize(s: string): string {
  return s
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

// A summary/average row sometimes has a bare year number (e.g. 2026) sitting in the
// date column — that's a plausible-looking small serial, not an actual date. Reject
// anything outside a sane calendar-year window so it doesn't get parsed as ~1905.
function plausibleYear(y: number): boolean {
  return y >= 2000 && y <= 2100;
}

// Excel's date epoch is 1899-12-30; 25569 is the day-count offset to the Unix epoch.
function excelSerialToKey(serial: number): string | null {
  if (!Number.isFinite(serial) || serial <= 0) return null;
  const ms = Math.round((serial - 25569) * 86400 * 1000);
  const d = new Date(ms);
  if (Number.isNaN(d.getTime()) || !plausibleYear(d.getUTCFullYear())) return null;
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function cellToDateKey(value: unknown): string | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime()) || !plausibleYear(value.getUTCFullYear())) return null;
    return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}-${String(value.getUTCDate()).padStart(2, "0")}`;
  }
  if (typeof value === "number") return excelSerialToKey(value);
  return null;
}

function toScore(value: unknown): Score {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : parseFloat(String(value).replace(",", "."));
  if (Number.isNaN(n)) return null;
  if (n <= 0.25) return 0;
  if (n <= 0.75) return 0.5;
  return 1;
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

// The user marks "same as the row above" with a run of quote characters
// (a personal shorthand seen in the source spreadsheets) — carry the label forward.
const DITTO_RE = /^"+\s*"+$/;

interface ColumnMap {
  dateCol: number;
  fields: Record<string, number>;
}

function findHeaderRow(rows: unknown[][]): number {
  for (let r = 0; r < Math.min(rows.length, 10); r++) {
    const row = rows[r] ?? [];
    const hasJour = row.some((c) => normalize(String(c ?? "")).startsWith("jour"));
    const hasDate = row.some((c) => normalize(String(c ?? "")) === "date");
    if (hasJour && hasDate) return r;
  }
  return -1;
}

function buildColumnMap(headerRow: unknown[], matchers: Record<string, string[]>): ColumnMap {
  const fields: Record<string, number> = {};
  let dateCol = -1;
  headerRow.forEach((cell, colIdx) => {
    const text = normalize(String(cell ?? ""));
    if (!text) return;
    if (text === "date") {
      dateCol = colIdx;
      return;
    }
    for (const [key, keywords] of Object.entries(matchers)) {
      if (fields[key] !== undefined) continue;
      if (keywords.some((kw) => text.includes(kw))) fields[key] = colIdx;
    }
  });
  return { dateCol, fields };
}

const DASHBOARD_MATCHERS: Record<string, string[]> = {
  sleepOnTime: ["dormir"],
  wakeOnTime: ["reveil"],
  sport: ["sport"],
  workMorning: ["matin"],
  workAfternoon: ["aprem", "apres"],
  controlEmotion: ["emotion"],
  reading: ["lecture"],
  training: ["formation"],
  task1Label: ["tache 1", "tache1"],
  task2Label: ["tache 2", "tache2"],
  task3Label: ["tache 3", "tache3"],
};

const HEALTH_MATCHERS: Record<string, string[]> = {
  shower: ["douche"],
  teeth: ["dent"],
  oil: ["huile", "dermaroller"],
  healthy: ["healthy"],
  supplement: ["complement", "minoxidil"],
  walk: ["marche"],
  noFap: ["no fap", "nofap"],
  tracking: ["tracking"],
  morningRoutine: ["routine"],
  noSmoke: ["smoke"],
};

function parseDashboardSheet(rows: unknown[][]): Record<string, DashboardDay> {
  const out: Record<string, DashboardDay> = {};
  const headerIdx = findHeaderRow(rows);
  if (headerIdx === -1) return out;
  const map = buildColumnMap(rows[headerIdx], DASHBOARD_MATCHERS);
  if (map.dateCol === -1) return out;

  const lastLabels: Record<string, string> = {};

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const dateKey = cellToDateKey(row[map.dateCol]);
    if (!dateKey) continue;

    const day = emptyDashboardDay(dateKey);
    const simpleFields: (keyof typeof DASHBOARD_MATCHERS)[] = [
      "sleepOnTime",
      "wakeOnTime",
      "sport",
      "workMorning",
      "workAfternoon",
      "controlEmotion",
      "reading",
      "training",
    ];
    for (const key of simpleFields) {
      const col = map.fields[key];
      if (col !== undefined) (day as unknown as Record<string, Score>)[key] = toScore(row[col]);
    }

    ([1, 2, 3] as const).forEach((n) => {
      const labelCol = map.fields[`task${n}Label`];
      if (labelCol === undefined) return;
      let label = cellText(row[labelCol]);
      if (DITTO_RE.test(label)) label = lastLabels[`task${n}`] ?? "";
      else if (label) lastLabels[`task${n}`] = label;
      const score = toScore(row[labelCol + 1]);
      const taskKey = `task${n}` as "task1" | "task2" | "task3";
      day[taskKey] = { label, score };
    });

    out[dateKey] = day;
  }
  return out;
}

function parseHealthSheet(rows: unknown[][]): Record<string, HealthDay> {
  const out: Record<string, HealthDay> = {};
  const headerIdx = findHeaderRow(rows);
  if (headerIdx === -1) return out;
  const map = buildColumnMap(rows[headerIdx], HEALTH_MATCHERS);
  if (map.dateCol === -1) return out;

  for (let r = headerIdx + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row) continue;
    const dateKey = cellToDateKey(row[map.dateCol]);
    if (!dateKey) continue;

    const day = emptyHealthDay(dateKey);
    for (const key of Object.keys(HEALTH_MATCHERS)) {
      const col = map.fields[key];
      if (col !== undefined) (day as unknown as Record<string, Score>)[key] = toScore(row[col]);
    }
    out[dateKey] = day;
  }
  return out;
}

export interface ImportSummary {
  dashboardDays: number;
  healthDays: number;
  sheets: string[];
}

export async function parseWorkbookFile(file: File): Promise<{ data: Partial<AppData>; summary: ImportSummary }> {
  // Loaded on demand so the ~300kb parser only ships to users who actually import a workbook.
  const XLSX = await import("xlsx");
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array", cellDates: true });

  const dashboardSheetName = wb.SheetNames.find((n) => normalize(n).includes("dashboard"));
  const healthSheetName = wb.SheetNames.find((n) => normalize(n).includes("health"));

  const data: Partial<AppData> = {};
  const summary: ImportSummary = { dashboardDays: 0, healthDays: 0, sheets: [] };

  if (dashboardSheetName) {
    const ws = wb.Sheets[dashboardSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });
    const parsed = parseDashboardSheet(rows);
    data.dashboard = parsed;
    summary.dashboardDays = Object.keys(parsed).length;
    summary.sheets.push(dashboardSheetName);
  }

  if (healthSheetName) {
    const ws = wb.Sheets[healthSheetName];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: true, defval: null });
    const parsed = parseHealthSheet(rows);
    data.health = parsed;
    summary.healthDays = Object.keys(parsed).length;
    summary.sheets.push(healthSheetName);
  }

  return { data, summary };
}
