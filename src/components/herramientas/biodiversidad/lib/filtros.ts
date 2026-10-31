import type { Amenaza, TipoConservacion } from '../types'
import { esAmenaza, esTipoConservacion } from './conservacion'
import { entero, sanearBusqueda } from './parametros'

export const NIVELES_TAXON = ['reino', 'division', 'clase', 'orden_taxon', 'familia', 'genero'] as const
export type NivelTaxon = (typeof NIVELES_TAXON)[number]

export const NOMBRE_NIVEL: Record<NivelTaxon | 'especie', string> = {
  reino: 'Reino', division: 'Filo', clase: 'Clase', orden_taxon: 'Orden', familia: 'Familia', genero: 'Género', especie: 'Especie',
}

/** Campo de `/opciones` que corresponde a cada nivel (el orden taxonómico viaja como `orden_taxon` en el resto de rutas). */
export const CAMPO_DE_NIVEL: Record<NivelTaxon, 'reino' | 'division' | 'clase' | 'orden' | 'familia' | 'genero'> = {
  reino: 'reino', division: 'division', clase: 'clase', orden_taxon: 'orden', familia: 'familia', genero: 'genero',
}

export interface Filtros {
  departamento: string | null
  municipio: string | null
  reino: string | null
  division: string | null
  clase: string | null
  orden_taxon: string | null
  familia: string | null
  genero: string | null
  especie: string | null
  nombreEspecie: string | null
  buscar: string
  conservacion: TipoConservacion | null
  amenaza: Amenaza | null
  entidad: string | null
  nombreEntidad: string | null
  conjunto: string | null
  nombreConjunto: string | null
  anioDesde: number | null
  anioHasta: number | null
  evidencia: string | null
  conFoto: boolean
  conUbicacion: boolean
}

/** Cambios sobre la URL: clave → valor (null elimina la clave). */
export type CambiosUrl = Record<string, string | number | null>

const PATRON_TAXON = /^[\p{L}\p{M}][\p{L}\p{M} .'()-]{1,79}$/u
const PATRON_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const PATRON_EVIDENCIA = /^[A-Z_]{3,40}$/
const PATRON_ESPECIE = /^[A-Za-z0-9]{1,20}$/
const PATRON_MUNICIPIO = /^\d{5}$/

function taxon(valor: string | null): string | null {
  const limpio = valor?.trim() ?? ''
  return PATRON_TAXON.test(limpio) ? limpio : null
}

function uuid(valor: string | null): string | null {
  return valor && PATRON_UUID.test(valor) ? valor.toLowerCase() : null
}

function rotulo(valor: string | null): string | null {
  return sanearBusqueda(valor) || null
}

export const FILTROS_VACIOS: Filtros = {
  departamento: null, municipio: null, reino: null, division: null, clase: null, orden_taxon: null, familia: null, genero: null,
  especie: null, nombreEspecie: null, buscar: '', conservacion: null, amenaza: null, entidad: null, nombreEntidad: null,
  conjunto: null, nombreConjunto: null, anioDesde: null, anioHasta: null, evidencia: null, conFoto: false, conUbicacion: false,
}

/** Lee los filtros de la URL descartando cualquier valor con forma inválida. */
export function leerFiltros(p: URLSearchParams): Filtros {
  const departamento = p.get('departamento')
  const municipio = p.get('municipio')
  const especie = p.get('especie')
  const entidad = uuid(p.get('entidad'))
  const conjunto = uuid(p.get('conjunto'))
  const evidencia = p.get('evidencia')
  const conservacion = p.get('conservacion')
  const amenaza = p.get('amenaza')
  const especieValida = especie && PATRON_ESPECIE.test(especie) ? especie : null
  return {
    departamento: departamento && departamento.length >= 2 && departamento.length <= 60 ? departamento : null,
    municipio: municipio && PATRON_MUNICIPIO.test(municipio) ? municipio : null,
    reino: taxon(p.get('reino')),
    division: taxon(p.get('division')),
    clase: taxon(p.get('clase')),
    orden_taxon: taxon(p.get('orden_taxon')),
    familia: taxon(p.get('familia')),
    genero: taxon(p.get('genero')),
    especie: especieValida,
    nombreEspecie: especieValida ? rotulo(p.get('nombre_especie')) : null,
    buscar: sanearBusqueda(p.get('buscar')),
    conservacion: esTipoConservacion(conservacion) ? conservacion : null,
    amenaza: esAmenaza(amenaza) ? amenaza : null,
    entidad,
    nombreEntidad: entidad ? rotulo(p.get('nombre_entidad')) : null,
    conjunto,
    nombreConjunto: conjunto ? rotulo(p.get('nombre_conjunto')) : null,
    anioDesde: entero(p.get('anio_desde'), 1900, 2100),
    anioHasta: entero(p.get('anio_hasta'), 1900, 2100),
    evidencia: evidencia && PATRON_EVIDENCIA.test(evidencia) ? evidencia : null,
    conFoto: p.get('con_foto') === '1',
    conUbicacion: p.get('con_ubicacion') === '1',
  }
}

/** Cambios de URL que dejan todos los filtros en blanco. */
export const QUITAR_TODOS: CambiosUrl = {
  municipio: null, departamento: null, reino: null, division: null, clase: null, orden_taxon: null, familia: null, genero: null,
  especie: null, nombre_especie: null, buscar: null, conservacion: null, amenaza: null, entidad: null, nombre_entidad: null,
  conjunto: null, nombre_conjunto: null, anio_desde: null, anio_hasta: null, evidencia: null, con_foto: null, con_ubicacion: null,
  registro: null,
}

/** Fija un nivel taxonómico y limpia los inferiores (y la especie): nunca queda una combinación incoherente. */
export function cambiosTaxon(nivel: NivelTaxon, valor: string | null): CambiosUrl {
  const desde = NIVELES_TAXON.indexOf(nivel)
  const cambios: CambiosUrl = { especie: null, nombre_especie: null }
  NIVELES_TAXON.forEach((n, i) => { if (i > desde) cambios[n] = null })
  cambios[nivel] = valor
  return cambios
}

export function cambiosEspecie(clave: string | null, nombre: string | null): CambiosUrl {
  return { especie: clave, nombre_especie: clave ? nombre?.slice(0, 60) ?? null : null, buscar: null }
}

export function cambiosEntidad(valor: string | null, nombre: string | null): CambiosUrl {
  return { entidad: valor, nombre_entidad: valor ? nombre?.slice(0, 60) ?? null : null, conjunto: null, nombre_conjunto: null }
}

export function cambiosConjunto(valor: string | null, nombre: string | null): CambiosUrl {
  return { conjunto: valor, nombre_conjunto: valor ? nombre?.slice(0, 60) ?? null : null }
}

export function cambiosConservacion(c: TipoConservacion | null, a: Amenaza | null): CambiosUrl {
  return { conservacion: c, amenaza: c === 'amenazada' ? a : null }
}

export function hayTaxonomia(f: Filtros): boolean {
  return NIVELES_TAXON.some((n) => f[n] !== null) || f.especie !== null || f.buscar !== ''
}

export function hayConservacion(f: Filtros): boolean {
  return f.conservacion !== null
}

export function hayFuente(f: Filtros): boolean {
  return f.entidad !== null || f.conjunto !== null
}

export function contarFiltros(f: Filtros): number {
  return NIVELES_TAXON.filter((n) => f[n] !== null).length
    + [f.departamento, f.municipio, f.especie, f.buscar || null, f.conservacion, f.entidad, f.conjunto, f.anioDesde, f.anioHasta, f.evidencia]
      .filter((v) => v !== null).length
    + (f.conFoto ? 1 : 0) + (f.conUbicacion ? 1 : 0)
}
