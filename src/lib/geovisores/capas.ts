import type { CapaGeoserver } from '@/types'

export function nombreCapa(capa: Pick<CapaGeoserver, 'nombre' | 'titulo'>): string {
  return capa.titulo?.trim() || capa.nombre
}

/** Ayuda al pasar el cursor: título y resumen, solo si GeoServer los trae. */
export function ayudaCapa(capa: Pick<CapaGeoserver, 'nombre' | 'titulo' | 'resumen'>): string | undefined {
  const resumen = capa.resumen?.trim()
  return resumen ? `${nombreCapa(capa)}: ${resumen}` : undefined
}
