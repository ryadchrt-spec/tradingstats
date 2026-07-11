export function NumberCell({
  value,
  onChange,
  step = 1,
}: {
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
}) {
  return (
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw === "" ? null : Number(raw));
      }}
      placeholder="—"
      className="w-full min-w-[56px] rounded border border-transparent hover:border-slate-200 dark:hover:border-slate-700 focus:border-blue-400 focus:outline-none bg-transparent px-1.5 py-1 text-right text-slate-700 dark:text-slate-200 placeholder:text-slate-400 tabular-nums [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
    />
  );
}
