import { useCallback, useState } from 'react'
import { leerFilasExcel } from '../lib/leerFilasExcel'
import type { FilaExcel } from '../types'

type EstadoCarga = 'idle' | 'cargando' | 'error' | 'listo'

/** Sube y valida un Excel contra las columnas que esa capa requiere (equivalente a
 * COLS_REQ del dashboard original) antes de entregar las filas al llamador. */
export function useCargaExcel(columnasRequeridas: readonly string[]) {
  const [estado, setEstado] = useState<EstadoCarga>('idle')
  const [error, setError] = useState<string | null>(null)

  const cargarArchivo = useCallback(async (file: File): Promise<FilaExcel[] | null> => {
    setEstado('cargando')
    setError(null)
    try {
      const filas = await leerFilasExcel(file)
      if (filas.length === 0) throw new Error('El archivo no tiene filas de datos')

      const columnas = new Set(Object.keys(filas[0]))
      const faltantes = columnasRequeridas.filter((c) => !columnas.has(c))
      if (faltantes.length > 0) {
        throw new Error(`Faltan columnas requeridas: ${faltantes.join(', ')}`)
      }

      setEstado('listo')
      return filas
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el archivo')
      setEstado('error')
      return null
    }
  }, [columnasRequeridas])

  const reset = useCallback(() => {
    setEstado('idle')
    setError(null)
  }, [])

  return { estado, error, cargarArchivo, reset }
}
