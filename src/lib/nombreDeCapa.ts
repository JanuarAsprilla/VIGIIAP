/**
 * Nombre para mostrar de una capa. Si el backend solo pudo devolver el id
 * ("workspace:capa_con_guiones"), se deduce un nombre legible a partir de él en
 * vez de mostrarle el código interno al administrador.
 */
export function nombreLegibleDeCapa(capa: { capaId: string; nombre: string }): string {
  const nombre = capa.nombre.trim()
  if (nombre && nombre !== capa.capaId) return nombre
  const sinWorkspace = capa.capaId.split(':').pop() ?? capa.capaId
  return sinWorkspace.replace(/_/g, ' ')
}
