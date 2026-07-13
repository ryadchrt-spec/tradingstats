export function StatTile({
  label,
  value,
  sub,
  compareValue,
  compareColor,
}: {
  label: string;
  value: string;
  sub?: string;
  // Compare-period value shown next to the primary value (in the compare
  // series' color) when a comparison period is active.
  compareValue?: string;
  compareColor?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 flex flex-col gap-1">
      <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</div>
      <div className="flex items-baseline gap-2">
        <div className="text-2xl font-semibold text-slate-900 dark:text-white tabular-nums">{value}</div>
        {compareValue && (
          <div className="text-lg font-semibold tabular-nums" style={{ color: compareColor }}>
            {compareValue}
          </div>
        )}
      </div>
      {sub && <div className="text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );
}
