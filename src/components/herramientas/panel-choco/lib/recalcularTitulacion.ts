import { DEPTO_MAP, DEPTO_IDS, DEFAULT_LIMITES_MUNIS } from '../data/limites.generated'
import type { DeptoTitulacion, MunicipioTitulacion, FilaExcel } from '../types'

const MAPA_DEPTO = DEPTO_MAP as Record<string, string>
const MAPA_ID = DEPTO_IDS as Record<string, string>
const LIMITES_MUNIS = DEFAULT_LIMITES_MUNIS as Record<string, { name: string; area: number }[]>

function idParaDepto(nombre: string): string {
  return MAPA_ID[nombre] ?? nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-')
}

function nombreParaId(id: string): string {
  return Object.keys(MAPA_ID).find((nombre) => MAPA_ID[nombre] === id) ?? id
}

function areaBaseMunicipio(deptoId: string, municipio: string): number {
  return (LIMITES_MUNIS[deptoId] ?? []).find((m) => m.name === municipio)?.area ?? 0
}

interface AcumuladoMunicipio {
  cc: number
  ri: number
  ccNombres: Map<string, number>
  riNombres: Map<string, number>
}

function acumularFilas(
  filas: FilaExcel[],
  tipo: 'cc' | 'ri',
  acumuladoPorDepto: Map<string, Map<string, AcumuladoMunicipio>>,
): void {
  for (const fila of filas) {
    const deptoCrudo = String(fila.DeptoNom ?? '').trim()
    const depto = MAPA_DEPTO[deptoCrudo] ?? deptoCrudo
    const deptoId = idParaDepto(depto)
    const municipio = String(fila.MpNombre ?? '').trim()
    const area = Number(fila.Area_ha)
    const nombrePredio = String(fila.NOMBRE ?? fila.ID ?? '').trim() || `${tipo.toUpperCase()} sin nombre`
    if (!municipio || !Number.isFinite(area)) continue

    if (!acumuladoPorDepto.has(deptoId)) acumuladoPorDepto.set(deptoId, new Map())
    const porMunicipio = acumuladoPorDepto.get(deptoId)!
    if (!porMunicipio.has(municipio)) {
      porMunicipio.set(municipio, { cc: 0, ri: 0, ccNombres: new Map(), riNombres: new Map() })
    }
    const acumulado = porMunicipio.get(municipio)!
    if (tipo === 'cc') {
      acumulado.cc += area
      acumulado.ccNombres.set(nombrePredio, (acumulado.ccNombres.get(nombrePredio) ?? 0) + area)
    } else {
      acumulado.ri += area
      acumulado.riNombres.set(nombrePredio, (acumulado.riNombres.get(nombrePredio) ?? 0) + area)
    }
  }
}

/** Recalcula titulación colectiva desde registros crudos de Consejos Comunitarios (CC)
 * y Resguardos Indígenas (RI) — mismas columnas que el original (DeptoNom/MpNombre/Area_ha,
 * NOMBRE u ID opcional). Simplificación consciente: el área base de cada municipio para
 * calcular "sin titular" usa siempre DEFAULT_LIMITES_MUNIS, no un override de límites que
 * el usuario haya cargado en la sección "Resumen territorial" (secciones independientes). */
export function recalcularTitulacion(
  filasCC: FilaExcel[],
  filasRI: FilaExcel[],
): { deptos: DeptoTitulacion[]; munis: Record<string, MunicipioTitulacion[]> } {
  const porDepto = new Map<string, Map<string, AcumuladoMunicipio>>()
  acumularFilas(filasCC, 'cc', porDepto)
  acumularFilas(filasRI, 'ri', porDepto)

  const munis: Record<string, MunicipioTitulacion[]> = {}
  const deptosSinPct: Omit<DeptoTitulacion, 'pct'>[] = []

  porDepto.forEach((porMunicipio, deptoId) => {
    let areaDepto = 0, ccDepto = 0, riDepto = 0, numCc = 0, numRi = 0
    const listaMunicipios: MunicipioTitulacion[] = []

    porMunicipio.forEach((acumulado, municipio) => {
      const areaBase = areaBaseMunicipio(deptoId, municipio)
      const areaTotal = areaBase > 0 ? areaBase : acumulado.cc + acumulado.ri
      const st = Math.max(0, areaTotal - acumulado.cc - acumulado.ri)

      areaDepto += areaTotal
      ccDepto += acumulado.cc
      riDepto += acumulado.ri
      numCc += acumulado.ccNombres.size
      numRi += acumulado.riNombres.size

      listaMunicipios.push({
        name: municipio,
        area: areaTotal,
        cc: acumulado.cc,
        ri: acumulado.ri,
        st,
        num_cc: acumulado.ccNombres.size,
        num_ri: acumulado.riNombres.size,
        cc_nombres: [...acumulado.ccNombres.entries()].map(([nombre, area]) => ({ nombre, area })),
        ri_nombres: [...acumulado.riNombres.entries()].map(([nombre, area]) => ({ nombre, area })),
      })
    })

    munis[deptoId] = listaMunicipios.sort((a, b) => b.area - a.area)
    deptosSinPct.push({
      id: deptoId,
      name: nombreParaId(deptoId),
      municipios: listaMunicipios.length,
      area: areaDepto,
      cc: ccDepto,
      ri: riDepto,
      st: Math.max(0, areaDepto - ccDepto - riDepto),
      num_cc: numCc,
      num_ri: numRi,
    })
  })

  const totalGeneral = deptosSinPct.reduce((acc, d) => acc + d.area, 0)
  const deptos = deptosSinPct
    .map((d) => ({ ...d, pct: totalGeneral > 0 ? (d.area / totalGeneral) * 100 : 0 }))
    .sort((a, b) => b.area - a.area)

  return { deptos, munis }
}
