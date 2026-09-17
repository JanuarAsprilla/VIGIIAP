import { useCallback, useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import * as L from 'leaflet'
import 'leaflet-draw'

/**
 * Coordina Área de interés y Medición para que nunca haya dos handlers de dibujo activos a la vez
 * -- sin esto, pintar un área mientras Medir sigue habilitado corrompe el estado del mapa y borra
 * capas ya pintadas (bug real, visto primero en producto6-reportes-vigia).
 */
export function useCoordinadorDibujo() {
  const map = useMap()
  const activoRef = useRef<L.Draw.Feature | null>(null)

  useEffect(() => {
    const onDrawStop = () => { activoRef.current = null }
    map.on(L.Draw.Event.DRAWSTOP, onDrawStop)
    return () => { map.off(L.Draw.Event.DRAWSTOP, onDrawStop) }
  }, [map])

  const iniciarDibujo = useCallback((handler: L.Draw.Feature) => {
    activoRef.current?.disable()
    activoRef.current = handler
    handler.enable()
  }, [])

  return { map, iniciarDibujo }
}
