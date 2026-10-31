import { esGrupo, type Grupo } from '../types'
import { esMetrica, METRICA_INICIAL, type Metrica } from './metrica'

export const GRUPO_INICIAL: Grupo = 'aves'
export const TAMANO_PAGINA = 24
export const TAMANO_PAGINA_ESPECIES = 20
export const MAX_REGISTROS_CONSULTABLES = 10_000

export const VISTAS = ['resumen', 'registros', 'especies', 'municipios'] as const
export type Vista = (typeof VISTAS)[number]
export type ModoRegistros = 'tarjetas' | 'tabla'

export interface ParametrosVista {
  grupo: Grupo
  pagina: number
  vista: Vista | null
  metrica: Metrica
  modo: ModoRegistros
  registro: string | null
  /** Ordenamiento pedido en la URL (se valida contra las opciones de cada sección). */
  ordenar: string | null
  /** Capa de puntos de registros activa en el mapa. */
  puntos: boolean
}

export function entero(valor: string | null, min: number, max: number): number | null {
  if (valor === null || !/^\d{1,5}$/.test(valor)) return null
  const n = Number(valor)
  return n >= min && n <= max ? n : null
}

/** Texto de búsqueda: 2 a 60 caracteres, sin caracteres de control. */
export function sanearBusqueda(valor: string | null): string {
  if (!valor) return ''
  // eslint-disable-next-line no-control-regex
  const limpio = valor.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 60)
  return limpio.length >= 2 ? limpio : ''
}

/** Lee y sanea los parámetros de la vista; los de filtro los lee `leerFiltros`. */
export function leerParametros(p: URLSearchParams): ParametrosVista {
  const grupo = p.get('grupo')
  const vista = p.get('vista')
  const metrica = p.get('metrica')
  const registro = p.get('registro')
  const ordenar = p.get('ordenar') ?? p.get('orden')
  return {
    grupo: esGrupo(grupo) ? grupo : GRUPO_INICIAL,
    pagina: entero(p.get('pagina'), 1, MAX_REGISTROS_CONSULTABLES / 10) ?? 1,
    vista: (VISTAS as readonly string[]).includes(vista ?? '') ? (vista as Vista) : null,
    metrica: esMetrica(metrica) ? metrica : METRICA_INICIAL,
    modo: p.get('modo') === 'tabla' ? 'tabla' : 'tarjetas',
    registro: registro && /^[0-9]{1,20}$/.test(registro) ? registro : null,
    ordenar: ordenar && /^[a-z_]{3,20}$/.test(ordenar) ? ordenar : null,
    puntos: p.get('puntos') === '1',
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
