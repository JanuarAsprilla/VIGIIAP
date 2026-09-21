import { DEPTO_MAP, DEPTO_IDS } from '../data/limites.generated'
import type { DeptoArea, MunicipioArea, FilaExcel } from '../types'

const MAPA_DEPTO = DEPTO_MAP as Record<string, string>
const MAPA_ID = DEPTO_IDS as Record<string, string>

function idParaDepto(nombre: string): string {
  return MAPA_ID[nombre] ?? nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
}

/** Reagrega el layer "límites" desde un Excel con columnas DeptoNom/MpNombre/AreaHa —
 * misma semántica de columnas que el dashboard original (ver COLS_REQ.limites). */
export function recalcularLimites(filas: FilaExcel[]): { deptos: DeptoArea[]; munis: Record<string, MunicipioArea[]> } {
  const porDepto = new Map<string, { area: number; municipios: Map<string, number> }>()

  for (const fila of filas) {
    const deptoCrudo = String(fila.DeptoNom ?? '').trim()
    const depto = MAPA_DEPTO[deptoCrudo] ?? deptoCrudo
    const municipio = String(fila.MpNombre ?? '').trim()
    const area = Number(fila.AreaHa)
    if (!depto || !municipio || !Number.isFinite(area)) continue

    if (!porDepto.has(depto)) porDepto.set(depto, { area: 0, municipios: new Map() })
    const entrada = porDepto.get(depto)!
    entrada.area += area
    entrada.municipios.set(municipio, (entrada.municipios.get(municipio) ?? 0) + area)
  }

  const totalGeneral = [...porDepto.values()].reduce((acc, d) => acc + d.area, 0)

  const deptos: DeptoArea[] = [...porDepto.entries()].map(([name, d]) => ({
    id: idParaDepto(name),
    name,
    municipios: d.municipios.size,
    area: d.area,
    pct: totalGeneral > 0 ? (d.area / totalGeneral) * 100 : 0,
  }))

  const munis: Record<string, MunicipioArea[]> = {}
  porDepto.forEach((d, name) => {
    munis[idParaDepto(name)] = [...d.municipios.entries()]
      .map(([municipioNombre, area]) => ({ name: municipioNombre, area }))
      .sort((a, b) => b.area - a.area)
  })

  return { deptos, munis }
}
