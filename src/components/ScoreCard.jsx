export default function ScoreCard({ C, hex, label, value, note, pct }) {
  const c = hex(value);
  return (
    <div
      style={{
        background: `linear-gradient(135deg,${C.s2},${C.s1})`,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: "22px 20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg,${c},${c}88)`,
        }}
      />
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: 2.5,
          color: C.muted,
          textTransform: "uppercase",
          marginBottom: 8,
          fontFamily: "'DM Mono',monospace",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 42,
          fontWeight: 700,
          fontFamily: "'DM Mono',monospace",
          color: c,
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.dim, marginTop: 8, lineHeight: 1.5, minHeight: 16 }}>
        {note}
      </div>
      <div style={{ height: 4, borderRadius: 2, background: C.s3, marginTop: 14, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: `linear-gradient(90deg,${c}aa,${c})`,
            width: `${pct || value}%`,
            transition: "width 1.5s ease",
          }}
        />
      </div>
    </div>
  );
}
