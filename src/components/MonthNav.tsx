import { FR_MONTHS } from "../habits";

export function MonthNav({
  year,
  month,
  onChange,
}: {
  year: number;
  month: number;
  onChange: (year: number, month: number) => void;
}) {
  function shift(delta: number) {
    let m = month + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    onChange(y, m);
  }

  function goToday() {
    const now = new Date();
    onChange(now.getFullYear(), now.getMonth());
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => shift(-1)}
        className="h-8 w-8 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
        aria-label="Mois précédent"
      >
        ‹
      </button>
      <div className="min-w-[150px] text-center font-semibold text-slate-800 dark:text-slate-100 tabular-nums">
        {FR_MONTHS[month]} {year}
      </div>
      <button
        onClick={() => shift(1)}
        className="h-8 w-8 rounded-md border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center"
        aria-label="Mois suivant"
      >
        ›
      </button>
      <button
        onClick={goToday}
        className="h-8 px-3 rounded-md border border-slate-300 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Aujourd'hui
      </button>
    </div>
  );
}
