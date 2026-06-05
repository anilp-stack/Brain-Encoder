export default function BarMetric({ C, hex, label, value, color, maxW }) {
  const c = color || hex(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 11 }}>
      <div
        style={{
          width: maxW || 140,
          fontSize: 12,
          fontWeight: 600,
          color: C.dim,
          textTransform: "capitalize",
          flexShrink: 0,
          fontFamily: "'DM Sans',sans-serif",
        }}
      >
        {label.replace(/_/g, " ")}
      </div>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: C.s3, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 4,
            background: `linear-gradient(90deg,${c}77,${c})`,
            width: `${value}%`,
            transition: "width 1s ease",
          }}
        />
      </div>
      <div
        style={{
          width: 40,
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "'DM Mono',monospace",
          color: c,
          textAlign: "right",
        }}
      >
        {value}
      </div>
    </div>
  );
}
