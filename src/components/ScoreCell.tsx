import type { Score } from "../types";
import { nextScore } from "../compute";

const STYLES: Record<string, string> = {
  "1": "bg-[#0ca30c] border-[#0ca30c] text-white",
  "0.5": "bg-[#fab219] border-[#fab219] text-white",
  "0": "bg-[#d03b3b] border-[#d03b3b] text-white",
  na: "bg-slate-400 border-slate-400 dark:bg-slate-600 dark:border-slate-600 text-white",
  null: "bg-transparent border-slate-300 dark:border-slate-600 text-transparent hover:border-slate-400 dark:hover:border-slate-500",
};

const LABELS: Record<string, string> = {
  "1": "Fait",
  "0.5": "Partiel",
  "0": "Non fait",
  na: "Exclu du calcul (N/A)",
  null: "Non renseigné — clique pour saisir",
};

export function ScoreCell({
  value,
  onChange,
  disabled,
}: {
  value: Score;
  onChange: (v: Score) => void;
  disabled?: boolean;
}) {
  const key = value === null ? "null" : String(value);
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(nextScore(value))}
      aria-label={LABELS[key]}
      title={LABELS[key]}
      className={`h-7 w-7 shrink-0 rounded-md border text-xs font-bold flex items-center justify-center transition-colors ${STYLES[key]} ${
        disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer hover:opacity-85"
      }`}
    >
      {value === 1 ? "✓" : value === 0.5 ? "½" : value === 0 ? "✕" : value === "na" ? "–" : ""}
    </button>
  );
}
