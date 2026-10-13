/**
 * Skeleton — primitivo de carga.
 * Usa `aria-hidden="true"` porque es puramente decorativo.
 */

export function Skeleton({ className = '' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse bg-border rounded-lg ${className}`}
    />
  )
}

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

/** Lista de tarjetas-fila (icono, dos líneas y una etiqueta) mientras cargan listados de administración. */
export function SkeletonLista({ filas = 5, className = '' }: { filas?: number; className?: string }) {
  return (
    <div role="status" aria-busy="true" className={`space-y-3 ${className}`}>
      <span className="sr-only">Cargando…</span>
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} aria-hidden="true" className="flex items-center gap-4 bg-[var(--card-bg)] border border-border/70 rounded-xl p-4">
          <Skeleton className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-3.5 w-2/5" />
            <Skeleton className="h-3 w-3/5" />
          </div>
          <Skeleton className="hidden sm:block h-6 w-20 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  )
}

const ANCHOS_CELDA = ['w-24', 'w-32', 'w-20', 'w-28', 'w-16', 'w-24']

/** Filas de relleno para el `<tbody>` de una tabla mientras carga: conserva el alto y las columnas. */
export function SkeletonFilasTabla({ filas = 6, columnas }: { filas?: number; columnas: number }) {
  return (
    <>
      <tr className="sr-only"><td colSpan={columnas} role="status">Cargando…</td></tr>
      {Array.from({ length: filas }, (_, fila) => (
        <tr key={fila} aria-hidden="true" className="border-b border-border last:border-b-0">
          {Array.from({ length: columnas }, (_, col) => (
            <td key={col} className="px-5 py-4">
              <Skeleton className={`h-3.5 ${ANCHOS_CELDA[(fila + col) % ANCHOS_CELDA.length]}`} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
