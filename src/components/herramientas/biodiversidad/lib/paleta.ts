/** Rampa secuencial de un solo matiz (verde azulado), validada con el validador de la skill dataviz
 *  (modo ordinal: luminosidad monótona, saltos de L >= 0.06, un matiz, extremo claro >= 2:1 sobre la superficie).
 *  Los valores se repiten en biodiversidad.css; aquí quedan para las pruebas de contraste. */
export const PALETA = {
  claro: {
    superficie: '#ffffff',
    sinDatos: '#e9e6df',
    rampa: ['#7ec3c3', '#44a3a9', '#21808a', '#0f5d6b', '#073d4d'],
    seleccion: '#b8480a',
    halo: '#ffffff',
    trazoMunicipio: '#5b726c',
    bordeDepartamento: '#0b2b2c',
  },
  oscuro: {
    superficie: '#12201a',
    sinDatos: '#2b2e2c',
    rampa: ['#175a66', '#1d7b84', '#37a5a8', '#6fcdc9', '#b4ece6'],
    seleccion: '#ffb547',
    halo: '#12201a',
    trazoMunicipio: '#9db8b0',
    bordeDepartamento: '#e6f3ef',
  },
} as const

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
