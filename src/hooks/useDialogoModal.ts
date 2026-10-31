import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react'

const FOCALIZABLES = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"]), select, input:not([disabled])'

/** Comportamiento de diálogo modal: bloquea el desplazamiento, atrapa el foco, Escape cierra y el foco regresa a `origen`. */
export function useDialogoModal(origen: RefObject<HTMLElement | null>, onCerrar: () => void) {
  const caja = useRef<HTMLDivElement>(null)
  const cierre = useRef(onCerrar)

  useEffect(() => { cierre.current = onCerrar }, [onCerrar])
  useEffect(() => {
    const devolver = origen.current
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    caja.current?.focus({ preventScroll: true })
    return () => {
      document.body.style.overflow = previo
      if (devolver?.isConnected) devolver.focus()
    }
  }, [origen])

  function alTeclear(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Escape') { e.stopPropagation(); cierre.current(); return }
    if (e.key !== 'Tab' || !caja.current) return
    const lista = [...caja.current.querySelectorAll<HTMLElement>(FOCALIZABLES)].filter((x) => !x.hasAttribute('disabled'))
    if (lista.length === 0) { e.preventDefault(); return }
    const [primero, ultimo] = [lista[0], lista[lista.length - 1]]
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === caja.current)) { e.preventDefault(); ultimo.focus() }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus() }
  }

  return { caja, alTeclear }
}
