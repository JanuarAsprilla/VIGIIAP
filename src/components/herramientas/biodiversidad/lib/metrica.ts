import type { MunicipioConteo } from '../types'
import { fmtNum } from './format'

export const METRICAS = ['registros', 'especies', 'sin_especie'] as const
export type Metrica = (typeof METRICAS)[number]
export const METRICA_INICIAL: Metrica = 'registros'

export const ETIQUETA_METRICA: Record<Metrica, string> = {
  registros: 'Registros',
  especies: 'Especies',
  sin_especie: '% sin especie',
}

export const TITULO_LEYENDA: Record<Metrica, string> = {
  registros: 'Registros por municipio',
  especies: 'Especies por municipio',
  sin_especie: 'Registros sin especie determinada',
}

export function esMetrica(v: unknown): v is Metrica {
  return typeof v === 'string' && (METRICAS as readonly string[]).includes(v)
}

/** Valor que se pinta en el mapa; null = sin datos para esa métrica. */
export function valorMetrica(m: MunicipioConteo | undefined, metrica: Metrica): number | null {
  if (!m || m.registros <= 0) return null
  if (metrica === 'registros') return m.registros
  if (metrica === 'especies') return m.especies > 0 ? m.especies : null
  return Math.round((m.sin_especie / m.registros) * 1000) / 10
}

export function fmtValorMetrica(valor: number | null, metrica: Metrica): string {
  if (valor === null) return 'Sin datos'
  if (metrica === 'sin_especie') return `${valor.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
  return fmtNum(valor)
}
