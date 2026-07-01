import { useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api'

/** URL del endpoint de descarga con tracking de auditoría. */
export function descargarUrl(tipo: 'mapa' | 'documento', id: string, campo?: string): string {
  const base = `${API_BASE}/descargar/${tipo}/${id}`
  return campo ? `${base}?campo=${campo}` : base
}

export const ALLOWED_ORIGINS = [
  window.location.origin,
  import.meta.env.VITE_R2_PUBLIC_URL || '',
  import.meta.env.VITE_API_URL        || '',
].filter(Boolean)

export function isTrustedUrl(url) {
  try {
    const parsed = new URL(url)
    return ALLOWED_ORIGINS.some((o) => {
      try { return parsed.origin === new URL(o).origin } catch { return false }
    })
  } catch { return false }
}

export async function forceDownload(url, filename) {
  if (!url) return
  if (!isTrustedUrl(url)) {
    if (import.meta.env.DEV) console.error('[VIGIIAP] Descarga bloqueada — origen no permitido:', url)
    return
  }
  const name = filename || url.split('?')[0].split('/').pop() || 'archivo'
  try {
    const res  = await fetch(url)
    const blob = await res.blob()
    const tmp  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = tmp
    a.download = name
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(tmp)
  } catch {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

export function useClickOutside(ref, handler) {
  useEffect(() => {
    const listener = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}
