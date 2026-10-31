import { useEffect, useState } from 'react'

/** Devuelve `valor` tras `demoraMs` sin cambios: evita una consulta por cada tecla o cada ajuste de un control. */
export function useDebounced<T>(valor: T, demoraMs = 300): T {
  const [estable, setEstable] = useState(valor)
  useEffect(() => {
    const t = window.setTimeout(() => setEstable(valor), demoraMs)
    return () => window.clearTimeout(t)
  }, [valor, demoraMs])
  return estable
}
