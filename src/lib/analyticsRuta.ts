// VIGIIAP — Normaliza lo que el beacon de analítica envía, para que ningún token de enlace viaje al servidor.

const SEGMENTOS_CON_TOKEN = new Set(['reset-password', 'verificar-email'])
const TOKEN_HEX = /^[A-Fa-f0-9]{32,}$/

/** Cambia por `:token` el segmento que sigue a una ruta de enlace único y cualquier segmento hexadecimal largo. */
export function rutaParaAnalitica(pathname: string): string {
  const segmentos = pathname.split('/')
  return segmentos
    .map((s, i) => (TOKEN_HEX.test(s) || SEGMENTOS_CON_TOKEN.has(segmentos[i - 1] ?? '') ? ':token' : s))
    .join('/')
}

/** Origen y ruta normalizada del referrer, sin consulta ni fragmento; null si no es una URL. */
export function referrerParaAnalitica(referrer: string): string | null {
  if (!referrer) return null
  try {
    const url = new URL(referrer)
    return `${url.origin}${rutaParaAnalitica(url.pathname)}`
  } catch {
    return null
  }
}
