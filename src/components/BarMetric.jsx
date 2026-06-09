import { useEffect, useState } from "react";

export default function BarMetric({ C, hex, label, value, color, maxW }) {
  const pct = Math.min(100, Math.max(0, typeof value === "number" ? value : 0));
  const c = color || (hex ? hex(pct) : C.gold);
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(pct), 100);
    return () => clearTimeout(timer);
  }, [pct]);

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
      <div
        style={{
          height: 5,
          borderRadius: 3,
          overflow: "hidden",
          background: `linear-gradient(to right,
            rgba(239,68,68,0.15) 0%,
            rgba(239,68,68,0.15) 40%,
            rgba(245,158,11,0.15) 40%,
            rgba(245,158,11,0.15) 65%,
            rgba(16,185,129,0.15) 65%,
            rgba(16,185,129,0.15) 100%
          )`,
        }}
      >
        <div
          style={{
            height: "100%",
            borderRadius: 3,
            background: c,
            width: `${animated}%`,
            transition: "width 0.7s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
