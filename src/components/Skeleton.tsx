/** Bloque gris pulsante para pantallas que están cargando. */
export default function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-2xl bg-black/[.07] ${className}`} />;
}
