import { useState } from "react";

export default function Card({ C, children, style, delay = 0, ...p }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: `linear-gradient(180deg, rgba(255,255,255,0.025) 0%, rgba(255,255,255,0) 100%), ${C.s1}`,
        border: `1px solid ${C.border}`,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 12,
        padding: 24,
        boxShadow: hovered
          ? "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(245,158,11,0.12)"
          : "0 8px 32px rgba(0,0,0,0.35)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        animation: `fadeUp 0.4s ease ${delay}ms both`,
        ...style,
      }}
      {...p}
    >
      {children}
    </div>
  );
}
