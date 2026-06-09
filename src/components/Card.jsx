export default function Card({ C, children, style, ...p }) {
  return (
    <div
      style={{
        background: C.s1,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        ...style,
      }}
      {...p}
    >
      {children}
    </div>
  );
}
