import { esGrupo, type Amenaza, type Grupo, type TipoConservacion } from '../types'
import { esAmenaza, esTipoConservacion } from './conservacion'
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
  municipio: string | null
  departamento: string | null
  pagina: number
  anioDesde: number | null
  anioHasta: number | null
  vista: Vista | null
  metrica: Metrica
  modo: ModoRegistros
  buscar: string
  conFoto: boolean
  conservacion: TipoConservacion | null
  amenaza: Amenaza | null
  especie: string | null
  nombreEspecie: string | null
  registro: string | null
  orden: 'registros' | 'nombre'
}

function entero(valor: string | null, min: number, max: number): number | null {
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

/** Lee y sanea los parámetros de la URL: cualquier valor fuera de rango se descarta. */
export function leerParametros(p: URLSearchParams): ParametrosVista {
  const grupo = p.get('grupo')
  const municipio = p.get('municipio')
  const departamento = p.get('departamento')
  const vista = p.get('vista')
  const metrica = p.get('metrica')
  const conservacion = p.get('conservacion')
  const amenaza = p.get('amenaza')
  const especie = p.get('especie')
  const registro = p.get('registro')
  const especieValida = especie && /^[A-Za-z0-9]{1,20}$/.test(especie) ? especie : null
  return {
    grupo: esGrupo(grupo) ? grupo : GRUPO_INICIAL,
    municipio: municipio && /^\d{5}$/.test(municipio) ? municipio : null,
    departamento: departamento && departamento.length >= 2 && departamento.length <= 60 ? departamento : null,
    pagina: entero(p.get('pagina'), 1, MAX_REGISTROS_CONSULTABLES / 10) ?? 1,
    anioDesde: entero(p.get('anio_desde'), 1900, 2100),
    anioHasta: entero(p.get('anio_hasta'), 1900, 2100),
    vista: (VISTAS as readonly string[]).includes(vista ?? '') ? (vista as Vista) : null,
    metrica: esMetrica(metrica) ? metrica : METRICA_INICIAL,
    modo: p.get('modo') === 'tabla' ? 'tabla' : 'tarjetas',
    buscar: sanearBusqueda(p.get('buscar')),
    conFoto: p.get('con_foto') === '1',
    conservacion: esTipoConservacion(conservacion) ? conservacion : null,
    amenaza: esAmenaza(amenaza) ? amenaza : null,
    especie: especieValida,
    nombreEspecie: especieValida ? sanearBusqueda(p.get('nombre_especie')) || null : null,
    registro: registro && /^[0-9]{1,20}$/.test(registro) ? registro : null,
    orden: p.get('orden') === 'nombre' ? 'nombre' : 'registros',
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
