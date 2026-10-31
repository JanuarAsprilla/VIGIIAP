import type { MunicipioConteo } from '../types'

export interface Indicadores {
  registros: number
  municipiosConRegistros: number
  totalMunicipios: number
  departamentos: number
  sinEspecie: number
}

export interface ResumenDepartamento {
  departamento: string
  registros: number
  municipiosConRegistros: number
  totalMunicipios: number
  sinEspecie: number
}

export function calcularIndicadores(municipios: MunicipioConteo[]): Indicadores {
  const deptos = new Set<string>()
  let registros = 0
  let sinEspecie = 0
  let conRegistros = 0
  for (const m of municipios) {
    registros += m.registros
    sinEspecie += m.sin_especie
    if (m.registros > 0) {
      conRegistros += 1
      deptos.add(m.departamento)
    }
  }
  return { registros, municipiosConRegistros: conRegistros, totalMunicipios: municipios.length, departamentos: deptos.size, sinEspecie }
}

export function topMunicipios(municipios: MunicipioConteo[], n: number): MunicipioConteo[] {
  return [...municipios]
    .filter((m) => m.registros > 0)
    .sort((a, b) => b.registros - a.registros || a.municipio.localeCompare(b.municipio, 'es'))
    .slice(0, n)
}

export function resumenPorDepartamento(municipios: MunicipioConteo[]): ResumenDepartamento[] {
  const mapa = new Map<string, ResumenDepartamento>()
  for (const m of municipios) {
    const previo = mapa.get(m.departamento) ?? {
      departamento: m.departamento, registros: 0, municipiosConRegistros: 0, totalMunicipios: 0, sinEspecie: 0,
    }
    mapa.set(m.departamento, {
      ...previo,
      registros: previo.registros + m.registros,
      sinEspecie: previo.sinEspecie + m.sin_especie,
      totalMunicipios: previo.totalMunicipios + 1,
      municipiosConRegistros: previo.municipiosConRegistros + (m.registros > 0 ? 1 : 0),
    })
  }
  return [...mapa.values()].sort((a, b) => b.registros - a.registros || a.departamento.localeCompare(b.departamento, 'es'))
}

export function listarDepartamentos(municipios: MunicipioConteo[]): string[] {
  return [...new Set(municipios.map((m) => m.departamento))].sort((a, b) => a.localeCompare(b, 'es'))
}

export type ColumnaMunicipios = 'municipio' | 'departamento' | 'registros' | 'especies' | 'sin_especie'

export function ordenarMunicipios(
  municipios: MunicipioConteo[], columna: ColumnaMunicipios, descendente: boolean,
): MunicipioConteo[] {
  const factor = descendente ? -1 : 1
  return [...municipios].sort((a, b) => {
    const va = a[columna]
    const vb = b[columna]
    const cmp = typeof va === 'number' && typeof vb === 'number' ? va - vb : String(va).localeCompare(String(vb), 'es')
    return cmp * factor || a.municipio.localeCompare(b.municipio, 'es')
  })
}
