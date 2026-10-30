import type { Grupo, GrupoEstado, Metodo } from '../types'

export function etiquetaMetodo(m: Metodo | undefined): string {
  if (m === 'individual') return 'Registros individuales'
  if (m === 'agregado') return 'Inventario agregado'
  return 'Método por confirmar'
}

export function metodosPorGrupo(grupos: GrupoEstado[] | undefined): Partial<Record<Grupo, Metodo>> {
  return Object.fromEntries((grupos ?? []).map((g) => [g.grupo, g.metodo]))
}
