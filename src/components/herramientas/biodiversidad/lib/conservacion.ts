import type { Amenaza, Conservacion, Grupo, TipoConservacion } from '../types'

export const CATEGORIAS_AMENAZA: Amenaza[] = ['CR', 'EN', 'VU']

export const NOMBRE_AMENAZA: Record<Amenaza, string> = {
  CR: 'En peligro crítico',
  EN: 'En peligro',
  VU: 'Vulnerable',
}

/** Solo existen listas nacionales de endemismo para estos grupos: en los demás un 0 no es un dato. */
export const GRUPOS_CON_LISTA_ENDEMISMO: readonly Grupo[] = ['aves', 'plantas', 'mamiferos']

export function tieneListaEndemismo(grupo: Grupo): boolean {
  return GRUPOS_CON_LISTA_ENDEMISMO.includes(grupo)
}

export const AYUDA_ENDEMICA = 'Endémica de Colombia (listas nacionales de aves, plantas y mamíferos) o del Chocó (lista del IIAP, 2011, histórica y parcial).'
export const AVISO_SIN_MARCA = 'Que una especie no tenga marca solo significa «sin evidencia en estas listas»: no implica que sea nativa ni que no esté amenazada.'

export const TIPOS_CONSERVACION: TipoConservacion[] = ['amenazada', 'endemica', 'introducida', 'invasora']

export const NOMBRE_TIPO: Record<TipoConservacion, string> = {
  amenazada: 'Amenazadas',
  endemica: 'Endémicas',
  introducida: 'Introducidas',
  invasora: 'Invasoras',
}

export function esAmenaza(v: unknown): v is Amenaza {
  return v === 'CR' || v === 'EN' || v === 'VU'
}

export function esTipoConservacion(v: unknown): v is TipoConservacion {
  return typeof v === 'string' && (TIPOS_CONSERVACION as string[]).includes(v)
}

export interface Insignia {
  clave: string
  texto: string
  clase: string
  ayuda?: string
}

/** Insignias de un registro o especie, en orden de relevancia. */
export function insigniasDe(c: Conservacion): Insignia[] {
  const r: Insignia[] = []
  if (c.amenaza && esAmenaza(c.amenaza)) r.push({ clave: c.amenaza, texto: `${c.amenaza} · ${NOMBRE_AMENAZA[c.amenaza]}`, clase: `bio-uicn-${c.amenaza}` })
  if (c.endemica_colombia) r.push({ clave: 'endemica_colombia', texto: 'Endémica de Colombia', clase: 'bio-cons-endemica', ayuda: 'Incluida en una lista nacional de endemismo (aves, plantas o mamíferos).' })
  if (c.endemica_choco) r.push({ clave: 'endemica_choco', texto: 'Endémica del Chocó (IIAP, 2011)', clase: 'bio-cons-endemica', ayuda: 'Reportada como endémica del Chocó por el IIAP en 2011 (lista histórica y parcial).' })
  if (c.invasora) r.push({ clave: 'invasora', texto: 'Invasora', clase: 'bio-cons-exotica' })
  else if (c.introducida) r.push({ clave: 'introducida', texto: 'Introducida', clase: 'bio-cons-exotica' })
  return r
}
