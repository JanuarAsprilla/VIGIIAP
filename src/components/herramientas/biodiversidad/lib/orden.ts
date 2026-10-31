export const ORDENES_ESPECIES = {
  registros: 'Más registros',
  municipios: 'Más municipios',
  nombre: 'Nombre (A–Z)',
} as const
export type OrdenEspecies = keyof typeof ORDENES_ESPECIES

export const ORDENES_REGISTROS = {
  anio_desc: 'Más recientes',
  anio_asc: 'Más antiguos',
  especie: 'Especie (A–Z)',
} as const
export type OrdenRegistros = keyof typeof ORDENES_REGISTROS

export const ORDEN_ESPECIES_INICIAL: OrdenEspecies = 'registros'
export const ORDEN_REGISTROS_INICIAL: OrdenRegistros = 'anio_desc'

export function ordenEspecies(valor: string | null): OrdenEspecies {
  return valor !== null && valor in ORDENES_ESPECIES ? (valor as OrdenEspecies) : ORDEN_ESPECIES_INICIAL
}

export function ordenRegistros(valor: string | null): OrdenRegistros {
  return valor !== null && valor in ORDENES_REGISTROS ? (valor as OrdenRegistros) : ORDEN_REGISTROS_INICIAL
}
