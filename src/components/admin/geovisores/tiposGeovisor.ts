import { Map as MapIcon, Images, type LucideIcon } from 'lucide-react'

export type TipoGeovisor = 'estandar' | 'fichas'

export interface TipoGeovisorDef {
  id: TipoGeovisor
  label: string
  desc: string
  Icon: LucideIcon
}

/**
 * Tipos de geovisor que el administrador puede elegir al crearlo. Un tipo nuevo
 * se agrega aquí y en `tipoDeGeovisor`; el selector y el formulario lo recogen
 * sin más cambios.
 */
export const TIPOS_GEOVISOR: readonly TipoGeovisorDef[] = [
  {
    id: 'estandar',
    label: 'Geovisor estándar',
    desc: 'Mapa con capas y popup de atributos.',
    Icon: MapIcon,
  },
  {
    id: 'fichas',
    label: 'Con fichas por punto',
    desc: 'Cada punto lleva foto o video y descripción. Se exigen para publicar.',
    Icon: Images,
  },
]

/** El tipo no se guarda: se deduce de si alguna capa del geovisor exige fichas. */
export function tipoDeGeovisor(capasConFicha: readonly string[]): TipoGeovisor {
  return capasConFicha.length > 0 ? 'fichas' : 'estandar'
}

/** Ids de las capas seleccionadas que admiten fichas (solo las vectoriales). */
export function capasVectorialesSeleccionadas(
  seleccionadas: readonly string[],
  catalogo: readonly { id: string; tipo: string }[],
): string[] {
  const vectoriales = new Set(catalogo.filter((c) => c.tipo === 'vectorial').map((c) => c.id))
  return seleccionadas.filter((id) => vectoriales.has(id))
}
