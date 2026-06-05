export default function Card({ C, children, style, ...p }) {
  return (
    <div
      style={{
        background: C.s1,
        border: `1px solid ${C.border}`,
        borderRadius: 16,
        padding: 28,
        ...style,
      }}
      {...p}
    >
      {children}
    </div>
  );
}
