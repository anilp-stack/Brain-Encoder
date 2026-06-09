import { useEffect, useState } from "react";

const getStatus = (score, C) => {
  if (score >= 75) return { label: "STRONG", color: C.green };
  if (score >= 60) return { label: "AVERAGE", color: C.amber };
  if (score >= 40) return { label: "WEAK", color: C.orange };
  return { label: "RISK", color: C.red };
};

export default function ScoreCard({ C, hex, label, value, note, pct, benchmark }) {
  const score = typeof value === "number" ? value : 0;
  const [displayed, setDisplayed] = useState(0);
  const [hovered, setHovered] = useState(false);
  const c = hex ? hex(score) : C.gold;
  const barValue = Math.min(100, Math.max(0, typeof pct === "number" ? pct : score));
  const status = getStatus(score, C);

  useEffect(() => {
    let start = 0;
    const duration = 900;
    const step = 16;
    const increment = score / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= score) {
        setDisplayed(score);
        clearInterval(timer);
      } else {
        setDisplayed(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? C.s2 : C.s1,
        border: `1px solid ${hovered ? `${c}88` : C.border}`,
        borderRadius: 12,
        padding: "20px 18px 16px",
        position: "relative",
        overflow: "visible",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? `0 8px 24px ${c}22` : "none",
        animation: "fadeUp 0.4s ease both",
      }}
    >
      {hovered && benchmark && (
        <div
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 8,
            padding: "6px 10px",
            background: C.s3,
            border: `1px solid ${C.border2}`,
            borderRadius: 6,
            fontSize: 10,
            color: C.dim,
            whiteSpace: "nowrap",
            zIndex: 10,
            fontFamily: "monospace",
            letterSpacing: "0.06em",
          }}
        >
          Benchmark: {benchmark}+
        </div>
      )}
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
          letterSpacing: 0,
          transition: "color 0.3s",
          animation: "countUp 0.35s ease both",
        }}
      >
        {displayed}
      </div>
      {note && <div style={{ fontSize: 11, color: C.dim, marginBottom: 12, lineHeight: 1.5, minHeight: 16 }}>{note}</div>}
      <div style={{ height: 3, borderRadius: 2, background: C.border, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            borderRadius: 2,
            background: c,
            width: `${Math.min(barValue, displayed)}%`,
            opacity: 0.65,
            transition: "width 0.05s linear",
          }}
        />
      </div>
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          marginTop: 10,
          padding: "2px 8px",
          borderRadius: 100,
          background: `${status.color}18`,
          border: `1px solid ${status.color}44`,
          fontSize: 8,
          fontWeight: 700,
          color: status.color,
          fontFamily: "monospace",
          letterSpacing: "0.1em",
        }}
      >
        {status.label}
      </div>
    </div>
  );
}
