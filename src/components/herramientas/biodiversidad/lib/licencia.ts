export interface LicenciaInfo {
  etiqueta: string
  href: string | null
}

const GENERICA: LicenciaInfo = { etiqueta: 'Licencia del conjunto', href: null }
const TIPOS_CC = new Set(['by', 'by-nc', 'by-sa', 'by-nd', 'by-nc-sa', 'by-nc-nd'])
const PATRON_CC = /^https?:\/\/(?:www\.)?creativecommons\.org\/licenses\/([a-z-]+)\/([1-4]\.0)(?:\/(?:legalcode(?:\.[a-z-]+)?|deed(?:\.[a-z-]+)?))?\/?$/i
const PATRON_CC0 = /^https?:\/\/(?:www\.)?creativecommons\.org\/publicdomain\/zero\/1\.0(?:\/(?:legalcode(?:\.[a-z-]+)?|deed(?:\.[a-z-]+)?))?\/?$/i

/** Deduce una etiqueta corta de una URL de licencia con una tabla cerrada; el enlace se
 *  reconstruye desde las partes reconocidas, nunca se reutiliza la URL recibida. */
export function etiquetarLicencia(url: string | null): LicenciaInfo {
  if (!url) return GENERICA
  const candidata = url.trim()
  if (PATRON_CC0.test(candidata)) {
    return { etiqueta: 'CC0', href: 'https://creativecommons.org/publicdomain/zero/1.0/deed.es' }
  }
  const m = PATRON_CC.exec(candidata)
  if (!m) return GENERICA
  const tipo = m[1].toLowerCase()
  if (!TIPOS_CC.has(tipo)) return GENERICA
  return {
    etiqueta: `CC ${tipo.toUpperCase()}`,
    href: `https://creativecommons.org/licenses/${tipo}/${m[2]}/deed.es`,
  }
}
