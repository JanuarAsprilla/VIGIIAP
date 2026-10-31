import { createElement, type ReactNode } from 'react'

const ETIQUETAS = new Set(['g', 'path', 'circle', 'ellipse', 'rect', 'line', 'polyline', 'polygon'])
const ATRIBUTOS = new Set([
  'd', 'cx', 'cy', 'r', 'rx', 'ry', 'x', 'y', 'x1', 'x2', 'y1', 'y2', 'width', 'height', 'points', 'fill', 'stroke',
  'stroke-width', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity', 'fill-opacity', 'opacity', 'transform',
])
const TOKEN = /<(\/?)([a-zA-Z0-9]+)((?:\s+[a-zA-Z-]+="[^"]*")*)\s*(\/?)>/g
const ATRIBUTO = /([a-zA-Z-]+)="([^"]*)"/g

const aCamel = (n: string) => n.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())

interface Nodo { etiqueta: string; atributos: Record<string, string>; hijos: Nodo[] }

/** Convierte el cuerpo de un icono SVG de una librería de confianza en elementos de React, sin innerHTML:
 *  solo admite formas básicas y atributos conocidos; cualquier otra cosa se descarta. */
export function cuerpoSvgAElementos(cuerpo: string): ReactNode[] {
  const raiz: Nodo = { etiqueta: 'raiz', atributos: {}, hijos: [] }
  const pila: Nodo[] = [raiz]
  for (const m of cuerpo.matchAll(TOKEN)) {
    const [, cierre, nombre, texto, autocierre] = m
    const etiqueta = nombre.toLowerCase()
    if (cierre) {
      if (pila.length > 1) pila.pop()
      continue
    }
    const atributos: Record<string, string> = {}
    for (const a of texto.matchAll(ATRIBUTO)) if (ATRIBUTOS.has(a[1])) atributos[a[1]] = a[2]
    const nodo: Nodo = { etiqueta, atributos, hijos: [] }
    pila[pila.length - 1].hijos.push(nodo)
    if (!autocierre) pila.push(nodo)
  }
  const dibujar = (n: Nodo, clave: number): ReactNode => {
    if (!ETIQUETAS.has(n.etiqueta)) return null
    const props: Record<string, string | number> = { key: clave }
    for (const [k, v] of Object.entries(n.atributos)) props[aCamel(k)] = v
    return createElement(n.etiqueta, props, ...n.hijos.map(dibujar))
  }
  return raiz.hijos.map(dibujar)
}
