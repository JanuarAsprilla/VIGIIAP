const PCT = new Intl.NumberFormat('es-CO', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const FECHA = new Intl.DateTimeFormat('es-CO', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

export function fmtNum(n: number): string {
  // Agrupación manual: Intl omite el separador en 4 cifras para es-*, y aquí se quiere uniforme (1.234).
  return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

/** Como `fmtNum`, pero un dato que la API no calcula (null) se muestra como raya. */
export function fmtNumONulo(n: number | null): string {
  return n === null ? '—' : fmtNum(n)
}

/** Proporción 0..1 como porcentaje con un decimal; 0 si el denominador es 0. */
export function fmtPct(parte: number | null, total: number): string {
  if (parte === null) return '—'
  return PCT.format(total > 0 ? parte / total : 0)
}

export function fmtFecha(iso: string | null): string {
  if (!iso) return 'Sin fecha'
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? 'Sin fecha' : FECHA.format(d)
}
