import { esGrupo, type Grupo } from '../types'

export const GRUPO_INICIAL: Grupo = 'aves'
export const TAMANO_PAGINA = 25
export const MAX_REGISTROS_CONSULTABLES = 10_000

export type Vista = 'municipios' | 'registros'

export interface ParametrosVista {
  grupo: Grupo
  municipio: string | null
  departamento: string | null
  pagina: number
  anioDesde: number | null
  anioHasta: number | null
  vista: Vista | null
}

function entero(valor: string | null, min: number, max: number): number | null {
  if (valor === null || !/^\d{1,5}$/.test(valor)) return null
  const n = Number(valor)
  return n >= min && n <= max ? n : null
}

/** Lee y sanea los parámetros de la URL: cualquier valor fuera de rango se descarta. */
export function leerParametros(p: URLSearchParams): ParametrosVista {
  const grupo = p.get('grupo')
  const municipio = p.get('municipio')
  const departamento = p.get('departamento')
  const vista = p.get('vista')
  return {
    grupo: esGrupo(grupo) ? grupo : GRUPO_INICIAL,
    municipio: municipio && /^\d{5}$/.test(municipio) ? municipio : null,
    departamento: departamento && departamento.length <= 60 ? departamento : null,
    pagina: entero(p.get('pagina'), 1, MAX_REGISTROS_CONSULTABLES / TAMANO_PAGINA) ?? 1,
    anioDesde: entero(p.get('anio_desde'), 1900, 2100),
    anioHasta: entero(p.get('anio_hasta'), 1900, 2100),
    vista: vista === 'municipios' || vista === 'registros' ? vista : null,
  }
}

/** Aplica cambios a los parámetros conservando los ajenos (p. ej. `herramienta`). Un valor
 *  null/undefined/'' elimina la clave. */
export function actualizarParametros(
  actuales: URLSearchParams, cambios: Record<string, string | number | null | undefined>,
): URLSearchParams {
  const siguiente = new URLSearchParams(actuales)
  for (const [clave, valor] of Object.entries(cambios)) {
    if (valor === null || valor === undefined || valor === '') siguiente.delete(clave)
    else siguiente.set(clave, String(valor))
  }
  return siguiente
}
