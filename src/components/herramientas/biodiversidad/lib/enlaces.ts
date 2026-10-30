const PATRON_GBIF_ID = /^\d{1,18}$/
const PATRON_DOI = /^10\.\d{4,9}\/[A-Za-z0-9._;()/:\-+]{1,200}$/

/** Enlace al registro en GBIF, solo si el identificador es numérico. */
export function urlRegistroGbif(id: string | null): string | null {
  if (!id || !PATRON_GBIF_ID.test(id)) return null
  return `https://www.gbif.org/occurrence/${encodeURIComponent(id)}`
}

/** Enlace al DOI del conjunto, solo si cumple el patrón de DOI (se codifica cada segmento). */
export function urlDoi(doi: string | null): string | null {
  if (!doi) return null
  const limpio = doi.trim()
  if (!PATRON_DOI.test(limpio)) return null
  return `https://doi.org/${limpio.split('/').map(encodeURIComponent).join('/')}`
}
