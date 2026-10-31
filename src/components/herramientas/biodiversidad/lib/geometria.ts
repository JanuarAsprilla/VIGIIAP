export type Anillo = number[][]

function dentro(x: number, y: number, anillos: Anillo[]): boolean {
  let adentro = false
  for (const a of anillos) {
    for (let i = 0, j = a.length - 1; i < a.length; j = i++) {
      const [xi, yi] = a[i]
      const [xj, yj] = a[j]
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) adentro = !adentro
    }
  }
  return adentro
}

function distanciaASegmento(px: number, py: number, a: number[], b: number[]): number {
  const dx = b[0] - a[0]
  const dy = b[1] - a[1]
  const t = dx === 0 && dy === 0 ? 0 : Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / (dx * dx + dy * dy)))
  return Math.hypot(px - (a[0] + t * dx), py - (a[1] + t * dy))
}

function area(anillo: Anillo): number {
  const xs = anillo.map((p) => p[0])
  const ys = anillo.map((p) => p[1])
  return (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys))
}

/** Punto [lng, lat] dentro del polígono (el más alejado de su borde en una malla): sirve para colocar
 *  etiquetas incluso cuando el municipio tiene huecos o forma de anillo. Para multipolígonos usa la parte mayor. */
export function puntoInterior(tipo: 'Polygon' | 'MultiPolygon', coordenadas: unknown, malla = 28): [number, number] | null {
  const poligonos = (tipo === 'Polygon' ? [coordenadas] : coordenadas) as Anillo[][]
  if (!Array.isArray(poligonos) || poligonos.length === 0) return null
  const mayor = poligonos.reduce((a, b) => (area(b[0]) > area(a[0]) ? b : a))
  const [exterior] = mayor
  const xs = exterior.map((p) => p[0])
  const ys = exterior.map((p) => p[1])
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)]
  let mejor: [number, number] | null = null
  let mejorDistancia = -1
  for (let i = 0; i < malla; i++) {
    for (let j = 0; j < malla; j++) {
      const x = x0 + ((i + 0.5) / malla) * (x1 - x0)
      const y = y0 + ((j + 0.5) / malla) * (y1 - y0)
      if (!dentro(x, y, mayor)) continue
      let d = Infinity
      for (const a of mayor) for (let k = 0; k < a.length - 1; k++) d = Math.min(d, distanciaASegmento(x, y, a[k], a[k + 1]))
      if (d > mejorDistancia) { mejorDistancia = d; mejor = [x, y] }
    }
  }
  return mejor
}
