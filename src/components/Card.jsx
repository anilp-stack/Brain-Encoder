export default function Card({ C, children, style, delay = 0, ...p }) {
  return (
    <div
      style={{
        background: C.s1,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        padding: 24,
        animation: `fadeUp 0.4s ease ${delay}ms both`,
        ...style,
      }}
      {...p}
    >
      {children}
    </div>
  );
}
