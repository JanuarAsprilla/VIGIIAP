import type { Grupo, Metodo } from '../types'
import { NOMBRE_NIVEL, NIVELES_TAXON, hayConservacion, hayFuente, hayTaxonomia, type CambiosUrl, type Filtros } from './filtros'

/** Método de publicación de cada grupo, para decidir qué filtros admite la API antes de que lleguen los datos. */
export const METODO_DE_GRUPO: Record<Grupo, Metodo> = {
  aves: 'agregado', insectos: 'agregado', plantas: 'agregado',
  mamiferos: 'individual', anfibios: 'individual', reptiles: 'individual', hongos: 'individual',
}

export const MOTIVO_AGREGADO = 'Este grupo se publica como inventario agregado: no tiene registros individuales con año, evidencia, fotografía ni ubicación.'
export const MOTIVO_FUENTE_CON_TAXON = 'En inventarios agregados la fuente no se combina con taxonomía, especie ni conservación. Quita esos filtros para usarla.'
export const MOTIVO_TAXON_CON_FUENTE = 'En inventarios agregados no se puede combinar con la fuente. Quita la entidad o el conjunto para usarlo.'

export interface Aplicabilidad {
  individual: boolean
  taxonomia: boolean
  conservacion: boolean
  fuente: boolean
  tiempo: boolean
  evidencia: boolean
  calidad: boolean
  motivoTaxonomia: string | null
  motivoConservacion: string | null
  motivoFuente: string | null
  motivoRegistro: string | null
}

/** Qué secciones de filtro admite la API para el método y los filtros actuales. */
export function aplicabilidad(metodo: Metodo, f: Filtros): Aplicabilidad {
  if (metodo === 'individual') {
    return {
      individual: true, taxonomia: true, conservacion: true, fuente: true, tiempo: true, evidencia: true, calidad: true,
      motivoTaxonomia: null, motivoConservacion: null, motivoFuente: null, motivoRegistro: null,
    }
  }
  const conFuente = hayFuente(f)
  const conTaxon = hayTaxonomia(f) || hayConservacion(f)
  return {
    individual: false,
    taxonomia: !conFuente,
    conservacion: !conFuente,
    fuente: !conTaxon,
    tiempo: false, evidencia: false, calidad: false,
    motivoTaxonomia: conFuente ? MOTIVO_TAXON_CON_FUENTE : null,
    motivoConservacion: conFuente ? MOTIVO_TAXON_CON_FUENTE : null,
    motivoFuente: conTaxon ? MOTIVO_FUENTE_CON_TAXON : null,
    motivoRegistro: MOTIVO_AGREGADO,
  }
}

export interface Reconciliacion {
  /** Filtros que sí se pueden enviar a la API. */
  efectivos: Filtros
  /** Etiquetas legibles de los filtros ignorados. */
  descartados: string[]
  /** Cambios de URL que eliminan los filtros ignorados. */
  limpieza: CambiosUrl
}

function sin(f: Filtros, campos: Partial<Filtros>): Filtros {
  return { ...f, ...campos }
}

/** Quita de un conjunto de filtros lo que el método no admite (sin tocar el original). */
export function reconciliar(f: Filtros, metodo: Metodo): Reconciliacion {
  if (metodo === 'individual') return { efectivos: f, descartados: [], limpieza: {} }
  let efectivos = f
  const descartados: string[] = []
  let limpieza: CambiosUrl = {}
  const quitar = (etiqueta: string, campos: Partial<Filtros>, urls: CambiosUrl) => {
    efectivos = sin(efectivos, campos)
    limpieza = { ...limpieza, ...urls }
    descartados.push(etiqueta)
  }
  if (f.anioDesde !== null || f.anioHasta !== null) quitar('Años', { anioDesde: null, anioHasta: null }, { anio_desde: null, anio_hasta: null })
  if (f.evidencia) quitar('Tipo de evidencia', { evidencia: null }, { evidencia: null })
  if (f.conFoto) quitar('Solo con foto', { conFoto: false }, { con_foto: null })
  if (f.conUbicacion) quitar('Solo con ubicación visible', { conUbicacion: false }, { con_ubicacion: null })
  if (hayFuente(efectivos) && (hayTaxonomia(efectivos) || hayConservacion(efectivos))) {
    quitar('Fuente de datos', { entidad: null, nombreEntidad: null, conjunto: null, nombreConjunto: null },
      { entidad: null, nombre_entidad: null, conjunto: null, nombre_conjunto: null })
  }
  return { efectivos, descartados, limpieza }
}

/** Filtros que sobreviven al cambiar de grupo: territorio, conservación, años, evidencia, calidad y fuente. */
export function alCambiarGrupo(f: Filtros, metodoNuevo: Metodo): Reconciliacion {
  const descartados: string[] = []
  const limpieza: CambiosUrl = {}
  const etiquetas: string[] = []
  NIVELES_TAXON.forEach((n) => { if (f[n]) etiquetas.push(`${NOMBRE_NIVEL[n]} ${f[n]}`); limpieza[n] = null })
  if (f.especie) etiquetas.push(`Especie ${f.nombreEspecie ?? f.especie}`)
  if (f.buscar) etiquetas.push(`Búsqueda «${f.buscar}»`)
  Object.assign(limpieza, { especie: null, nombre_especie: null, buscar: null, registro: null })
  descartados.push(...etiquetas)
  const base = sin(f, {
    reino: null, division: null, clase: null, orden_taxon: null, familia: null, genero: null, especie: null, nombreEspecie: null, buscar: '',
  })
  const r = reconciliar(base, metodoNuevo)
  return { efectivos: r.efectivos, descartados: [...descartados, ...r.descartados], limpieza: { ...limpieza, ...r.limpieza } }
}
