const PATRON_IMAGEN = /^https:\/\/api\.gbif\.org\/v1\/image\/cache\/[0-9]+x\/occurrence\/[0-9]+\/media\/[a-f0-9]{32}$/
const MAX_URL = 400

/** La imagen solo se acepta si es de la caché de imágenes de GBIF (nunca la URL original del publicador). */
export function urlImagenValida(url: string | null | undefined): string | null {
  if (typeof url !== 'string' || url.length > MAX_URL) return null
  return PATRON_IMAGEN.test(url) ? url : null
}

/** Enlace de referencia de la foto: solo https y sin credenciales. */
export function urlReferenciaValida(url: string | null | undefined): string | null {
  if (typeof url !== 'string' || url.length > 600) return null
  try {
    const u = new URL(url)
    if (u.protocol !== 'https:' || u.username || u.password || !u.hostname.includes('.')) return null
    return u.href
  } catch {
    return null
  }
}

/** Tamaño de la miniatura en la caché de GBIF (el segmento `NNNx`). */
export function conAncho(url: string, ancho: number): string {
  return url.replace(/\/cache\/[0-9]+x\//, `/cache/${ancho}x/`)
}
