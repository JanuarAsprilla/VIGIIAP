import type { LogoPdf } from './tipos'

const LADO_MAXIMO_PX = 400

/**
 * Descarga el logo y lo convierte a PNG para incrustarlo en el PDF (jsPDF no lee WebP). El logo se sirve desde el mismo
 * dominio, así que el navegador lo puede leer. Si algo falla, el informe se genera igual, solo con el nombre de la institución.
 */
export async function cargarLogo(url: string | null, signal?: AbortSignal): Promise<LogoPdf | null> {
  if (!url) return null
  try {
    const destino = new URL(url, window.location.href)
    if (destino.protocol !== 'https:' && destino.protocol !== 'http:') return null
    const respuesta = await fetch(destino.href, { signal, credentials: 'omit' })
    if (!respuesta.ok) return null
    const imagen = await createImageBitmap(await respuesta.blob())
    const escala = Math.min(1, LADO_MAXIMO_PX / Math.max(imagen.width, imagen.height))
    const ancho = Math.max(1, Math.round(imagen.width * escala))
    const alto = Math.max(1, Math.round(imagen.height * escala))
    const lienzo = document.createElement('canvas')
    lienzo.width = ancho
    lienzo.height = alto
    const contexto = lienzo.getContext('2d')
    if (!contexto) return null
    contexto.drawImage(imagen, 0, 0, ancho, alto)
    imagen.close?.()
    return { dataUrl: lienzo.toDataURL('image/png'), formato: 'PNG', ancho, alto }
  } catch {
    return null
  }
}
