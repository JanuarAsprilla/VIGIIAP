/** Formatea ISO timestamp → "15 Mar 2026" */
export function formatDate(iso) {
  if (!iso) return ''
  return new Intl.DateTimeFormat('es-CO', {
    day:   '2-digit',
    month: 'short',
    year:  'numeric',
  }).format(new Date(iso))
}

/** Tiempo relativo → "hace 3 días" */
export function timeAgo(iso) {
  if (!iso) return ''
  const diff = Date.now() - new Date(iso).getTime()
  const mins  = Math.floor(diff / 60_000)
  if (mins < 60)   return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24)  return `hace ${hours}h`
  const days  = Math.floor(hours / 24)
  if (days < 30)   return `hace ${days} días`
  return formatDate(iso)
}
