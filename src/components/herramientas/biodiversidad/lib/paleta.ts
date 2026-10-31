import type { CSSProperties } from 'react'
import type { Grupo } from '../types'

/** Identidad cromática de cada grupo: rampa secuencial de un solo matiz (5 pasos) por tema.
 *  Validadas con validate_palette.js de la skill dataviz (--ordinal: luminosidad monótona, saltos de L >= 0,06,
 *  un matiz, extremo claro >= 2:1 sobre la superficie). Claro: de claro a oscuro; oscuro: de oscuro a claro. */
export const RAMPAS: Record<Grupo, { claro: readonly string[]; oscuro: readonly string[] }> = {
  aves: {
    claro: ['#7fafce', '#3e8fbe', '#086e9d', '#045075', '#00344f'],
    oscuro: ['#0c628c', '#107db2', '#3299d2', '#66bbf0', '#afdfff'],
  },
  mamiferos: {
    claro: ['#c69e87', '#b17652', '#945326', '#733809', '#4f2200'],
    oscuro: ['#804c2b', '#a46136', '#c27c50', '#e1a079', '#facdb2'],
  },
  anfibios: {
    claro: ['#80b5a0', '#40997b', '#06785b', '#025842', '#003a2a'],
    oscuro: ['#0b6b51', '#0e8968', '#33a582', '#68c6a4', '#abe7cf'],
  },
  reptiles: {
    claro: ['#a8ac7e', '#888c42', '#686c07', '#4c4f03', '#313300'],
    oscuro: ['#5c6018', '#777b18', '#91963a', '#b2b868', '#d8dda8'],
  },
  insectos: {
    claro: ['#c8a06d', '#b57713', '#8c5a03', '#674101', '#452a00'],
    oscuro: ['#7c5007', '#9e6708', '#c27f04', '#e5a243', '#fdce95'],
  },
  plantas: {
    claro: ['#8fb487', '#5f9753', '#357825', '#1a5a05', '#0c3b00'],
    oscuro: ['#36692b', '#448735', '#5fa350', '#87c479', '#bce5b3'],
  },
  hongos: {
    claro: ['#c199b8', '#ab6f9e', '#8d4a80', '#6d3061', '#4b1a42'],
    oscuro: ['#7a466f', '#9d598f', '#ba73ab', '#da98cb', '#f5c7ea'],
  },
}

export const SUPERFICIE = { claro: '#ffffff', oscuro: '#12201a' } as const
export const SIN_DATOS = { claro: '#e9e6df', oscuro: '#2b2e2c' } as const
/** Contorno doble y neutro de la selección: un borde claro y uno casi negro; al menos uno contrasta >= 3:1
 *  con cualquier paso de cualquier rampa. */
export const CONTORNO_SELECCION = { claro: '#ffffff', oscuro: '#0b0f0d' } as const

export const TRAZO_MUNICIPIO = { claro: '#5b726c', oscuro: '#9db8b0' } as const
export const BORDE_DEPARTAMENTO = { claro: '#0b2b2c', oscuro: '#e6f3ef' } as const

/** Paso usado para barras y gráficos (no texto) y para el acento tipográfico/de icono. */
const PASO_BARRA = 2
const PASO_ACENTO = 3

export function acentoDe(grupo: Grupo, modo: 'claro' | 'oscuro'): string {
  return RAMPAS[grupo][modo][PASO_ACENTO]
}

/** Variables CSS inline de un grupo; el CSS elige la variante clara u oscura con `.dark`. */
export function estiloGrupo(grupo: Grupo): CSSProperties {
  const r = RAMPAS[grupo]
  const v: Record<string, string> = {}
  r.claro.forEach((c, i) => { v[`--bio-c${i + 1}-l`] = c })
  r.oscuro.forEach((c, i) => { v[`--bio-c${i + 1}-d`] = c })
  v['--bio-barra-l'] = r.claro[PASO_BARRA]
  v['--bio-barra-d'] = r.oscuro[PASO_BARRA]
  v['--bio-acento-l'] = r.claro[PASO_ACENTO]
  v['--bio-acento-d'] = r.oscuro[PASO_ACENTO]
  return v as CSSProperties
}

function canal(v: number): number {
  const c = v / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

export function luminancia(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  return 0.2126 * canal((n >> 16) & 255) + 0.7152 * canal((n >> 8) & 255) + 0.0722 * canal(n & 255)
}

/** Razón de contraste WCAG entre dos colores hexadecimales (#rrggbb). */
export function contraste(a: string, b: string): number {
  const [x, y] = [luminancia(a), luminancia(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}
