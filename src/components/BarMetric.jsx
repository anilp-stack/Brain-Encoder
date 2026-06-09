export default function BarMetric({ C, hex, label, value, color, maxW }) {
  const pct = Math.min(100, Math.max(0, typeof value === "number" ? value : 0));
  const c = color || (hex ? hex(pct) : C.gold);
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span
          style={{
            maxWidth: maxW || "none",
            fontSize: 9,
            color: C.muted,
            fontFamily: "monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {String(label).replace(/_/g, " ")}
        </span>
        <span style={{ fontSize: 14, fontWeight: 700, color: c }}>{pct}</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: C.border, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 3,
            background: c,
            width: `${pct}%`,
          }}
        />
      </div>
    </div>
  );
}
