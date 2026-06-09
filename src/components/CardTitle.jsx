export default function CardTitle({ C, label, sub, children, style }) {
  return (
    <div
      style={{
        marginBottom: 20,
        ...style,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 3,
            height: 16,
            borderRadius: 2,
            background: C.gold,
            boxShadow: "0 0 8px rgba(245,158,11,0.5)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 10,
            color: C.dim,
            fontFamily: "monospace",
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            fontWeight: 600,
          }}
        >
          {children || label}
        </span>
      </div>
      {sub && (
        <p style={{ fontSize: 12, color: C.muted, margin: "5px 0 0 13px", lineHeight: 1.5 }}>
          {sub}
        </p>
      )}
    </div>
  );
}
