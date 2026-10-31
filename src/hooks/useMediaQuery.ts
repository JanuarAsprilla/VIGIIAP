import { useSyncExternalStore } from 'react'

/** Suscripción a una media query; sin `matchMedia` (pruebas, SSR) devuelve `porDefecto`. */
export function useMediaQuery(consulta: string, porDefecto = false): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const mq = typeof window !== 'undefined' ? window.matchMedia?.(consulta) : undefined
      mq?.addEventListener('change', avisar)
      return () => mq?.removeEventListener('change', avisar)
    },
    () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia(consulta).matches : porDefecto),
    () => porDefecto,
  )
}
