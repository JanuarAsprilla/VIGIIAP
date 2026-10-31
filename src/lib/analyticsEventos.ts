// VIGIIAP — Eventos de analítica: acciones concretas del visitante (descargar, abrir un
// geovisor, usar una herramienta). Anónimo, igual que el pageview; nunca desde el panel admin.
import { obtenerSessionId } from '@/lib/analyticsSession'
import { enviarEventoBeacon, type NombreEvento } from '@/lib/analyticsBeacon'

// En una carga directa el efecto del hijo corre antes que el del AnalyticsTracker: sin este
// retraso el evento llegaría al servidor antes de que exista la sesión y se descartaría.
export const RETRASO_EVENTO_MS = 1500
const RECURSO_MAX = 200

export function registrarEvento(nombre: NombreEvento, recurso?: string | null): void {
  const ruta = window.location.pathname
  if (ruta.startsWith('/admin')) return
  const recursoAcotado = recurso ? recurso.slice(0, RECURSO_MAX) : null
  setTimeout(() => {
    enviarEventoBeacon({ sessionId: obtenerSessionId(), nombre, recurso: recursoAcotado, ruta })
  }, RETRASO_EVENTO_MS)
}

const PATRON_DESCARGA = /\/descargar\/(mapa|documento)\/([^/?#]+)/

/** Registra la descarga si la URL es del endpoint de descargas de la plataforma. */
export function registrarDescargaDeUrl(url: string, nombreArchivo?: string): void {
  const coincidencia = PATRON_DESCARGA.exec(url)
  if (!coincidencia) return
  const [, tipo, id] = coincidencia
  registrarEvento(tipo === 'mapa' ? 'descarga_mapa' : 'descarga_documento', nombreArchivo || id)
}
