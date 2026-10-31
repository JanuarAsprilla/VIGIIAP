import { fmtNum } from './format'
import type { CambiosUrl, Filtros } from './filtros'
import type { MunicipioConteo } from '../types'

/** Cambios de URL que dejan el territorio coherente, o null si ya lo es. El municipio manda: su departamento es
 *  el único posible; un municipio o departamento que no existe se descarta. No actúa sin lista (aún cargando). */
export function corregirTerritorio(f: Filtros, municipios: MunicipioConteo[]): CambiosUrl | null {
  if (municipios.length === 0 || (!f.municipio && !f.departamento)) return null
  const cambios: CambiosUrl = {}
  const municipio = f.municipio ? municipios.find((m) => m.codigo_municipal === f.municipio) : undefined
  if (f.municipio && !municipio) cambios.municipio = null
  if (municipio) {
    if (f.departamento !== municipio.departamento) cambios.departamento = municipio.departamento
  } else if (f.departamento && !municipios.some((m) => m.departamento === f.departamento)) {
    cambios.departamento = null
  }
  return Object.keys(cambios).length > 0 ? cambios : null
}

/** «Chocó › Quibdó»: lo elegido, de lo general a lo específico (para la cabecera de la sección plegada). */
export function resumenTerritorio(f: Filtros, municipios: MunicipioConteo[]): string | null {
  const m = f.municipio ? municipios.find((x) => x.codigo_municipal === f.municipio) : undefined
  const partes = [m?.departamento ?? f.departamento, m?.municipio].filter((p): p is string => Boolean(p))
  return partes.length > 0 ? partes.join(' › ') : null
}

export interface OpcionTerritorio {
  valor: string
  etiqueta: string
  detalle: string
}

/** «1.234» o «sin registros»: la cifra sigue los filtros activos. */
export function detalleRegistros(registros: number): string {
  return registros > 0 ? fmtNum(registros) : 'sin registros'
}

const porNombre = (a: OpcionTerritorio, b: OpcionTerritorio) => a.etiqueta.localeCompare(b.etiqueta, 'es')

/** Opciones de los dos selectores. Con departamento elegido, los municipios son solo los suyos; sin él, cada municipio
 *  indica su departamento para distinguir homónimos y dejar claro a dónde saltará el filtro. */
export function opcionesTerritorio(municipios: MunicipioConteo[], departamento: string | null) {
  const porDepto = new Map<string, number>()
  for (const m of municipios) porDepto.set(m.departamento, (porDepto.get(m.departamento) ?? 0) + m.registros)
  const departamentos: OpcionTerritorio[] = [...porDepto]
    .map(([d, registros]) => ({ valor: d, etiqueta: d, detalle: detalleRegistros(registros) }))
    .sort(porNombre)
  const municipiosOpc: OpcionTerritorio[] = municipios
    .filter((m) => !departamento || m.departamento === departamento)
    .map((m) => ({
      valor: m.codigo_municipal, etiqueta: m.municipio,
      detalle: departamento ? detalleRegistros(m.registros) : `${detalleRegistros(m.registros)} · ${m.departamento}`,
    }))
    .sort(porNombre)
  return { departamentos, municipios: municipiosOpc }
}
