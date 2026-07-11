import { COLORS } from "../chartColors";

export function ChartTooltip({ active, payload, label, dark, unit }: any) {
  if (!active || !payload || !payload.length) return null;
  const c = dark ? COLORS.dark : COLORS.light;
  return (
    <div
      style={{
        background: c.surface,
        border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(11,11,11,0.10)"}`,
        borderRadius: 8,
        padding: "6px 10px",
        fontSize: 12,
        color: c.primary,
        boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
      }}
    >
      <div style={{ color: c.secondary, marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: p.color, display: "inline-block" }} />
          {p.value === null || p.value === undefined ? "—" : `${Math.round(p.value)}${unit}`}
        </div>
      ))}
    </div>
  );
}
