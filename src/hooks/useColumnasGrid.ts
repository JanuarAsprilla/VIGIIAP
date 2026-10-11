import { useCallback, useState } from 'react'

export type Columnas = 1 | 2 | 3

/** En pantallas angostas la cuadrícula siempre cae a 1 columna sin importar la preferencia. */
export const CLASES_GRID_COLUMNAS: Record<Columnas, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-1 md:grid-cols-2',
  3: 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3',
}

function leerGuardado(clave: string, porDefecto: Columnas): Columnas {
  try {
    const crudo = Number(window.localStorage.getItem(clave))
    return crudo === 1 || crudo === 2 || crudo === 3 ? crudo : porDefecto
  } catch {
    return porDefecto
  }
}

/** Columnas de una cuadrícula elegibles por la persona y recordadas en este navegador. */
export function useColumnasGrid(claveStorage: string, porDefecto: Columnas = 3) {
  const [columnas, setColumnasEstado] = useState<Columnas>(() => leerGuardado(claveStorage, porDefecto))

  const setColumnas = useCallback((n: Columnas) => {
    setColumnasEstado(n)
    try { window.localStorage.setItem(claveStorage, String(n)) } catch { /* localStorage no disponible */ }
  }, [claveStorage])

  return { columnas, setColumnas }
}
