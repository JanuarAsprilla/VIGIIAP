import type { EspecieResumen, Foto } from '../types'
import { urlImagenValida } from './foto'

export function taxonomiaBreve(e: EspecieResumen): string {
  return [e.orden, e.familia].filter(Boolean).join(' · ')
}

/** Foto de la especie solo si su URL es de la caché de GBIF; el crédito se muestra únicamente junto a una foto válida. */
export function fotoValida(e: EspecieResumen): Foto | null {
  return e.foto && urlImagenValida(e.foto.imagen) ? e.foto : null
}
