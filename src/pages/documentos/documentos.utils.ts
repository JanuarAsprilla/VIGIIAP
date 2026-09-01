import { useEffect } from 'react'
import type { RefObject } from 'react'
import { isTrustedUrl } from '@/lib/trustedUrl'

const API_BASE = import.meta.env.VITE_API_URL ?? '/api/v1'

// ─── Tipos compartidos del módulo Documentos ───────────────────────────────

/** Documento individual dentro de una categoría (vista de catálogo). */
export interface DocItem {
  id: string
  name: string
  type: string
  size: string
  updated: string
  dateISO: string
  url: string | null
  resumen: string
}

/** Categoría de documentos agrupados por nombre. */
export interface CategoryItem {
  id: string
  title: string
  icon: string
  thumbnail: string | null
  docs: DocItem[]
}

/** URL del endpoint de descarga con tracking de auditoría. */
export function descargarUrl(tipo: 'mapa' | 'documento', id: string, campo?: string): string {
  const base = `${API_BASE}/descargar/${tipo}/${id}`
  return campo ? `${base}?campo=${campo}` : base
}

export async function forceDownload(url: string | null | undefined, filename?: string): Promise<void> {
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

export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void): void {
  useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener('mousedown', listener)
    return () => document.removeEventListener('mousedown', listener)
  }, [ref, handler])
}
