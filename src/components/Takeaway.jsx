export default function Takeaway({ C, icon, title, items, color }) {
  const c = color || C.cyan;
  if (!items || items.length === 0) return null;
  return (
    <div
      style={{
        background: C.s1,
        border: "1px solid " + c + "33",
        borderRadius: 14,
        padding: 28,
        marginTop: 24,
        borderLeft: "4px solid " + c,
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: c,
          marginBottom: 14,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <span style={{ fontSize: 20 }}>{icon || "💡"}</span>
        {title || "Key Takeaway"}
      </div>
      {items.map(function (item, i) {
        return (
          <div
            key={i}
            style={{
              display: "flex",
              gap: 12,
              marginBottom: i < items.length - 1 ? 12 : 0,
              alignItems: "flex-start",
            }}
          >
            <span
              style={{
                color: c,
                fontWeight: 800,
                fontSize: 14,
                marginTop: 2,
                flexShrink: 0,
              }}
            >
              {item.type === "do"
                ? "✅"
                : item.type === "fix"
                  ? "🔧"
                  : item.type === "warn"
                    ? "⚠️"
                    : item.type === "win"
                      ? "🏆"
                      : "→"}
            </span>
            <span style={{ fontSize: 14, color: C.dim, lineHeight: 1.7 }}>
              <b style={{ color: C.text }}>{item.label}</b> {item.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
