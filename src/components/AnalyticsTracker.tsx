import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  obtenerSessionId, esNuevaSesion, detectarDispositivo, parsearNavegador, extraerUtm,
} from '@/lib/analyticsSession'
import { enviarPageviewBeacon } from '@/lib/analyticsBeacon'

/**
 * Registra una vista de página anónima en cada navegación (incluida la
 * primera carga). No lee AuthContext a propósito: la analítica es anónima
 * incluso para usuarios con sesión iniciada, así que nunca debe depender de
 * quién está autenticado. Montado una sola vez en App.tsx, fuera del
 * ErrorBoundary con key={location.key} para no perder el estado de sesión en
 * cada navegación.
 */
export default function AnalyticsTracker() {
  const location = useLocation()
  const ultimaRutaEnviada = useRef<string | null>(null)

  useEffect(() => {
    const rutaActual = location.pathname + location.search
    if (ultimaRutaEnviada.current === rutaActual) return
    ultimaRutaEnviada.current = rutaActual

    const nueva = esNuevaSesion()
    const sessionId = obtenerSessionId()
    const { navegador, sistemaOperativo } = parsearNavegador(navigator.userAgent)

    const payload = {
      sessionId,
      ruta: location.pathname,
      titulo: document.title || null,
      dispositivo: detectarDispositivo(window.innerWidth),
      navegador,
      sistemaOperativo,
      esAreaAdmin: location.pathname.startsWith('/admin'),
      // referrer_inicial/UTM solo tienen sentido al crear la sesión -- el
      // backend los ignora si la sesión ya existía, pero evitamos incluso
      // calcularlos de más en navegaciones intermedias.
      ...(nueva
        ? { referrerInicial: document.referrer || null, ...extraerUtm(location.search) }
        : {}),
    }

    enviarPageviewBeacon(payload)
  }, [location.pathname, location.search])

  return null
}
