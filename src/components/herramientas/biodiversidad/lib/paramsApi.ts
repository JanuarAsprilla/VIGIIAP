import type { Metodo, ParamsApi } from '../types'
import { NIVELES_TAXON, hayConservacion, hayFuente, hayTaxonomia, type Filtros } from './filtros'

export type RutaFiltrada = 'municipios' | 'resumen' | 'series' | 'especies' | 'registros' | 'puntos' | 'opciones'

function territorio(f: Filtros, p: ParamsApi) {
  if (f.municipio) p.codigo_municipal = f.municipio
  else if (f.departamento) p.departamento = f.departamento
}

function taxonomia(f: Filtros, p: ParamsApi, conEspecie: boolean) {
  for (const n of NIVELES_TAXON) if (f[n]) p[n] = f[n]
  if (conEspecie && f.especie) p.especie_clave = f.especie
  if (conEspecie && f.buscar) p.buscar = f.buscar
  if (f.conservacion) p.conservacion = f.conservacion
  if (f.conservacion === 'amenazada' && f.amenaza) p.amenaza = f.amenaza
}

function fuente(f: Filtros, p: ParamsApi) {
  if (f.entidad) p.entidad_clave = f.entidad
  if (f.conjunto) p.dataset_key = f.conjunto
}

function registro(f: Filtros, p: ParamsApi) {
  if (f.anioDesde !== null) p.anio_desde = f.anioDesde
  if (f.anioHasta !== null) p.anio_hasta = f.anioHasta
  if (f.evidencia) p.tipo_evidencia = f.evidencia
  if (f.conFoto) p.con_foto = 'true'
  if (f.conUbicacion) p.con_ubicacion = 'true'
}

/** Parámetros de una ruta a partir de los filtros. Los valores se envían como pares clave/valor (axios los codifica),
 *  nunca concatenados. En inventarios agregados solo viajan los filtros que la API admite en esa ruta. */
export function paramsApi(ruta: RutaFiltrada, f: Filtros, metodo: Metodo): ParamsApi {
  const p: ParamsApi = {}
  if (ruta !== 'municipios') territorio(f, p)
  if (metodo === 'individual') {
    taxonomia(f, p, true)
    fuente(f, p)
    registro(f, p)
    return p
  }
  if (ruta === 'series') return p
  const tax = hayTaxonomia(f) || hayConservacion(f)
  if (tax) taxonomia(f, p, true)
  else if ((ruta === 'municipios' || ruta === 'resumen' || ruta === 'opciones') && hayFuente(f)) fuente(f, p)
  return p
}

/** Parámetros para sugerir especies: todos los filtros salvo la especie y el texto, que se sustituyen por la búsqueda. */
export function paramsSugerencias(f: Filtros, metodo: Metodo, texto: string): ParamsApi {
  const base = paramsApi('especies', { ...f, especie: null, nombreEspecie: null, buscar: '' }, metodo)
  return { ...base, buscar: texto, tamano: 6, orden: 'registros' }
}
