import type { MunicipioConteo } from '../types'
import { fmtNum } from './format'
import { fmtValorMetrica, valorMetrica, type Metrica } from './metrica'

/** Con muy pocos registros el porcentaje «sin especie» es ruido (1 de 2 = 50 %): se exige un mínimo. */
export const MIN_REGISTROS_PORCENTAJE = 30

export interface FilaRanking {
  clave: string
  nombre: string
  detalle: string
  valor: number
  texto: string
}

export const TITULO_RANKING: Record<Metrica, string> = {
  registros: 'Municipios con más registros',
  especies: 'Municipios con más especies',
  sin_especie: 'Municipios con mayor % sin especie determinada',
}

/** Las especies no se suman entre municipios (se repiten), así que no hay ranking departamental por especies. */
export function admiteDepartamentos(metrica: Metrica): boolean {
  return metrica !== 'especies'
}

export function rankingMunicipios(municipios: MunicipioConteo[], metrica: Metrica, n: number): FilaRanking[] {
  return municipios
    .filter((m) => metrica !== 'sin_especie' || m.registros >= MIN_REGISTROS_PORCENTAJE)
    .map((m) => ({ m, v: valorMetrica(m, metrica) }))
    .filter((x): x is { m: MunicipioConteo; v: number } => x.v !== null && x.v > 0)
    .sort((a, b) => b.v - a.v || a.m.municipio.localeCompare(b.m.municipio, 'es'))
    .slice(0, n)
    .map(({ m, v }) => ({
      clave: m.codigo_municipal,
      nombre: m.municipio,
      detalle: metrica === 'sin_especie' ? `${m.departamento} · ${fmtNum(m.registros)} registros` : m.departamento,
      valor: v,
      texto: fmtValorMetrica(v, metrica),
    }))
}

export interface DeptoAgregado {
  departamento: string
  registros: number
  sinEspecie: number
  municipiosConRegistros: number
  totalMunicipios: number
}

export function rankingDepartamentos(deptos: DeptoAgregado[], metrica: Metrica, n: number): FilaRanking[] {
  if (!admiteDepartamentos(metrica)) return []
  return deptos
    .filter((d) => d.registros > 0 && (metrica !== 'sin_especie' || d.registros >= MIN_REGISTROS_PORCENTAJE))
    .map((d) => ({ d, v: metrica === 'registros' ? d.registros : Math.round((d.sinEspecie / d.registros) * 1000) / 10 }))
    .filter((x) => x.v > 0)
    .sort((a, b) => b.v - a.v || a.d.departamento.localeCompare(b.d.departamento, 'es'))
    .slice(0, n)
    .map(({ d, v }) => ({
      clave: d.departamento,
      nombre: d.departamento,
      detalle: `${d.municipiosConRegistros} de ${d.totalMunicipios} municipios`,
      valor: v,
      texto: fmtValorMetrica(v, metrica),
    }))
}
