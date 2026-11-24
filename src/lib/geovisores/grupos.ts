import type { CapaGeoserver, GrupoCapas, TemaCapas } from '@/types'

export interface MiembroGrupo {
  capa: CapaGeoserver
  tema: string
}

export interface GrupoResuelto {
  grupo: GrupoCapas
  miembros: MiembroGrupo[]
}

export interface GruposPreparados {
  porTema: Record<string, GrupoResuelto[]>
  /** Grupos cuyo tema no aparece en el catálogo: se muestran aparte para no perderlos. */
  sinTema: GrupoResuelto[]
  /** Por tema, ids de capa que ya se muestran dentro de un grupo de ese tema. */
  agrupadasPorTema: Record<string, Set<string>>
}

export type EstadoGrupo = 'todas' | 'algunas' | 'ninguna'

export function prepararGrupos(temas: TemaCapas[], grupos: GrupoCapas[] | undefined): GruposPreparados {
  const resultado: GruposPreparados = { porTema: {}, sinTema: [], agrupadasPorTema: {} }
  if (!grupos?.length) return resultado

  const indice = new Map<string, MiembroGrupo>()
  for (const t of temas) for (const capa of t.capas) indice.set(capa.id, { capa, tema: t.id })
  const idsTemas = new Set(temas.map((t) => t.id))

  for (const grupo of grupos) {
    const miembros = grupo.capas.flatMap((id) => indice.get(id) ?? [])
    if (miembros.length === 0) continue
    const resuelto = { grupo, miembros }
    if (!idsTemas.has(grupo.tema)) {
      resultado.sinTema.push(resuelto)
      continue
    }
    resultado.porTema[grupo.tema] = [...(resultado.porTema[grupo.tema] ?? []), resuelto]
    const agrupadas = new Set(resultado.agrupadasPorTema[grupo.tema])
    for (const m of miembros) agrupadas.add(m.capa.id)
    resultado.agrupadasPorTema[grupo.tema] = agrupadas
  }
  return resultado
}

export function estadoDeGrupo(miembros: MiembroGrupo[], idsActivos: ReadonlySet<string>): EstadoGrupo {
  const encendidas = miembros.filter((m) => idsActivos.has(m.capa.id)).length
  if (encendidas === 0) return 'ninguna'
  return encendidas === miembros.length ? 'todas' : 'algunas'
}
