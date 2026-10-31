import type { RegistroBiodiversidad } from '../types'

export function textoAlt(r: RegistroBiodiversidad): string {
  const quien = r.especie ?? 'especie sin determinar'
  return `Fotografía de ${quien} registrada en ${r.municipio}${r.anio ? ` en ${r.anio}` : ''}`
}
