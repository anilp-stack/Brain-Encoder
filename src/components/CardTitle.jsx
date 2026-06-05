export default function CardTitle({ C, label, children }) {
  const accent = label || C.gold;
  return (
    <div
      style={{
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: 1.5,
        color: accent,
        textTransform: "uppercase",
        marginBottom: 20,
        fontFamily: "'DM Mono',monospace",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}
    >
      <span
        style={{
          width: 3,
          height: 16,
          borderRadius: 2,
          background: accent,
          display: "inline-block",
        }}
      />
      {children}
    </div>
  );
}
