export interface PuntoAnio {
  anio: number
  registros: number
}

/** Años consecutivos de menor a mayor: los que la API no trae no tuvieron registros y se dibujan en cero, no se comprimen. */
export function completarAnios(datos: PuntoAnio[]): PuntoAnio[] {
  if (datos.length === 0) return []
  const porAnio = new Map(datos.map((d) => [d.anio, d.registros]))
  let primero = datos[0].anio
  let ultimo = primero
  for (const d of datos) { if (d.anio < primero) primero = d.anio; if (d.anio > ultimo) ultimo = d.anio }
  return Array.from({ length: ultimo - primero + 1 }, (_, i) => ({ anio: primero + i, registros: porAnio.get(primero + i) ?? 0 }))
}
