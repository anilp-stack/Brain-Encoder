import { useState } from "react";

export default function ScoreCard({ C, hex, label, value, note, pct }) {
  const [hovered, setHovered] = useState(false);
  const score = typeof value === "number" ? value : 0;
  const c = hex ? hex(score) : C.gold;
  const barValue = Math.min(100, Math.max(0, typeof pct === "number" ? pct : score));
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.s2 : C.s1,
        border: `1px solid ${hovered ? `${c}66` : C.border}`,
        borderRadius: 12,
        padding: "20px 18px 16px",
        position: "relative",
        overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: c,
          opacity: 0.75,
        }}
      />
      <div
        style={{
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.13em",
          color: C.muted,
          textTransform: "uppercase",
          marginBottom: 14,
          lineHeight: 1.4,
          fontFamily: "monospace",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 46,
          fontWeight: 800,
          fontFamily: "'Inter',-apple-system,sans-serif",
          color: c,
          lineHeight: 1,
          marginBottom: 14,
          letterSpacing: "-0.02em",
        }}
      >
        {score}
      </div>
      {note && <div style={{ fontSize: 11, color: C.dim, marginBottom: 12, lineHeight: 1.5, minHeight: 16 }}>{note}</div>}
      <div style={{ height: 3, borderRadius: 2, background: C.border, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: c,
            width: `${barValue}%`,
            opacity: 0.65,
          }}
        />
      </div>
    </div>
  );
}
