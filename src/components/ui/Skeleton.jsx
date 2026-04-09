/**
 * Skeleton — primitivo de carga.
 * Usa `aria-hidden="true"` porque es puramente decorativo.
 */

/** @param {{ className?: string }} props */
export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-border rounded-lg ${className}`}
    />
  )
}

/** Grupo de skeletons de texto con anchos variables */
export function SkeletonText({ lines = 3, className = '' }) {
  const widths = ['w-full', 'w-5/6', 'w-4/5', 'w-3/4', 'w-2/3', 'w-1/2']
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={`h-3.5 ${widths[i % widths.length]}`} />
      ))}
    </div>
  )
}

/** Tarjeta skeleton genérica */
export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white border border-border rounded-2xl p-5 space-y-3 ${className}`} aria-hidden="true">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  )
}
