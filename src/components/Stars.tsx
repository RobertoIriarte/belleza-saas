/** Calificación en estrellas (1 a 5). Decorativa: el valor va en el texto accesible. */
export default function Stars({ value, size = 18 }: { value: number; size?: number }) {
  const full = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span role="img" aria-label={`${value} de 5 estrellas`} className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg
          key={i}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill={i < full ? 'var(--accent)' : 'none'}
          stroke="var(--accent)"
          strokeWidth="1.6"
          strokeLinejoin="round"
          opacity={i < full ? 1 : 0.35}
        >
          <path d="M12 2.8l2.7 5.8 6.3.7-4.7 4.3 1.3 6.3L12 16.7 6.4 19.9l1.3-6.3L3 9.3l6.3-.7L12 2.8z" />
        </svg>
      ))}
    </span>
  );
}
