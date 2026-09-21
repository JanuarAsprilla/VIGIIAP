import { useCallback, useState } from 'react'

// Sube la versión si el shape de algún dataset cambia de forma incompatible —
// invalida cualquier override guardado en localStorage de versiones anteriores
// (mismo mecanismo que DATA_VERSION en el dashboard original).
const VERSION = 'v1'

function storageKey(datasetId: string): string {
  return `panel_choco_${datasetId}_${VERSION}`
}

/** Guarda/lee un override local (subido por Excel) para un dataset del panel, con
 * fallback al dataset por defecto embebido. El override vive solo en el navegador
 * de quien lo sube — no hay persistencia de servidor todavía (ver TODO en TitulacionColectiva). */
export function useDatasetVersionado<T>(datasetId: string, datasetPorDefecto: T) {
  const key = storageKey(datasetId)

  const [{ valor, esPersonalizado }, setEstado] = useState(() => {
    try {
      const raw = localStorage.getItem(key)
      if (raw) return { valor: JSON.parse(raw) as T, esPersonalizado: true }
    } catch {
      // localStorage bloqueado o JSON corrupto — se ignora y se usa el default
    }
    return { valor: datasetPorDefecto, esPersonalizado: false }
  })

  const actualizar = useCallback((next: T) => {
    setEstado({ valor: next, esPersonalizado: true })
    try {
      localStorage.setItem(key, JSON.stringify(next))
    } catch {
      // cuota excedida — el estado en memoria sigue reflejando el cambio de esta sesión
    }
  }, [key])

  const restaurarDefault = useCallback(() => {
    setEstado({ valor: datasetPorDefecto, esPersonalizado: false })
    try {
      localStorage.removeItem(key)
    } catch {
      // no-op
    }
  }, [key, datasetPorDefecto])

  return { valor, esPersonalizado, actualizar, restaurarDefault }
}
