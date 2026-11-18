import type { MunicipioConteo } from '../types'
import { fmtNum } from './format'
import { valorMetrica, type Metrica } from './metrica'
import { MIN_REGISTROS_PORCENTAJE } from './ranking'

export const NUM_CLASES = 5

/** Cortes por cuantiles sobre los valores > 0 (la distribución es muy sesgada: de 0 a cientos de
 *  miles). Devuelve los límites superiores de las clases 1..n-1; la última llega al máximo. */
export function calcularCortes(valores: number[], clases = NUM_CLASES): number[] {
  const pos = valores.filter((v) => v > 0).sort((a, b) => a - b)
  if (pos.length === 0) return []
  const cortes: number[] = []
  for (let i = 1; i < clases; i++) {
    const idx = Math.min(pos.length - 1, Math.max(0, Math.ceil((i * pos.length) / clases) - 1))
    const corte = pos[idx]
    if (corte < pos[pos.length - 1] && (cortes.length === 0 || corte > cortes[cortes.length - 1])) cortes.push(corte)
  }
  return cortes
}

/** Valores que definen cortes y máximo: el porcentaje exige el mismo mínimo de registros que el ranking. */
export function valoresDeEscala(municipios: MunicipioConteo[], metrica: Metrica): number[] {
  return municipios
    .filter((m) => metrica !== 'sin_especie' || m.registros >= MIN_REGISTROS_PORCENTAJE)
    .map((m) => valorMetrica(m, metrica))
    .filter((v): v is number => v !== null)
}

/** 0 = sin datos; 1..n = clase por cortes. Un valor 0 con datos (p. ej. 0 % sin especie) cae en la clase 1. */
export function claseDe(valor: number | null, cortes: number[]): number {
  if (valor === null || Number.isNaN(valor)) return 0
  const i = cortes.findIndex((c) => valor <= c)
  return i === -1 ? cortes.length + 1 : i + 1
}

export interface TramoLeyenda {
  clase: number
  desde: number
  hasta: number
}

/** Rangos de cada clase 1..n para la leyenda. En métricas enteras los tramos no se solapan (desde = anterior + 1). */
export function tramosLeyenda(cortes: number[], maximo: number, entero = true): TramoLeyenda[] {
  if (maximo <= 0) return []
  const limites = [...cortes, maximo]
  return limites.map((hasta, i) => ({
    clase: i + 1,
    desde: i === 0 ? (entero ? 1 : 0) : entero ? limites[i - 1] + 1 : limites[i - 1],
    hasta,
  }))
}

/** En porcentajes el valor del corte pertenece al tramo inferior, así que los superiores se rotulan «más de». */
export function etiquetaTramo(t: TramoLeyenda, metrica: Metrica, esUltimo = false): string {
  if (metrica === 'sin_especie') {
    const f = (n: number) => n.toLocaleString('es-CO', { maximumFractionDigits: 1 })
    if (t.clase === 1) return `${f(t.desde)} – ${f(t.hasta)} %`
    return esUltimo ? `más de ${f(t.desde)} %` : `más de ${f(t.desde)} hasta ${f(t.hasta)} %`
  }
  return t.desde === t.hasta ? fmtNum(t.hasta) : `${fmtNum(t.desde)} – ${fmtNum(t.hasta)}`
}
