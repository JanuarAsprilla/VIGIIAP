export type Direccion = 'izquierda' | 'derecha' | 'arriba' | 'abajo'

export interface Punto {
  id: string
  x: number
  y: number
}

/** Vecino más cercano en la dirección pedida (x = longitud, y = latitud). Penaliza el
 *  desvío lateral para que las flechas recorran el mapa de forma predecible. */
export function siguienteEnDireccion(actual: Punto, candidatos: Punto[], dir: Direccion): string | null {
  let mejor: string | null = null
  let mejorPuntaje = Infinity
  for (const c of candidatos) {
    if (c.id === actual.id) continue
    const dx = c.x - actual.x
    const dy = c.y - actual.y
    const avance = dir === 'derecha' ? dx : dir === 'izquierda' ? -dx : dir === 'arriba' ? dy : -dy
    if (avance <= 0) continue
    const lateral = Math.abs(dir === 'derecha' || dir === 'izquierda' ? dy : dx)
    const puntaje = avance + 2 * lateral
    if (puntaje < mejorPuntaje) {
      mejorPuntaje = puntaje
      mejor = c.id
    }
  }
  return mejor
}
