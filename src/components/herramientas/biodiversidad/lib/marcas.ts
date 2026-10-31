export type TonoMarca = 'info' | 'aviso'

export interface MarcaTraducida {
  codigo: string
  texto: string
  tono: TonoMarca
}

const MARCAS: Record<string, { texto: string; tono: TonoMarca }> = {
  GEODETIC_DATUM_ASSUMED_WGS84: { texto: 'El datum geodésico no se informó: se asumió WGS84', tono: 'info' },
  COORDINATE_ROUNDED: { texto: 'Coordenadas redondeadas por el publicador', tono: 'info' },
  TAXON_ID_NOT_FOUND: { texto: 'El identificador del taxón no se encontró en la fuente', tono: 'aviso' },
  SCIENTIFIC_NAME_ID_NOT_FOUND: { texto: 'El identificador del nombre científico no se encontró', tono: 'aviso' },
  INSTITUTION_MATCH_FUZZY: { texto: 'La institución se asoció de forma aproximada', tono: 'info' },
  COLLECTION_MATCH_FUZZY: { texto: 'La colección se asoció de forma aproximada', tono: 'info' },
  OCCURRENCE_STATUS_INFERRED_FROM_INDIVIDUAL_COUNT: { texto: 'La presencia se dedujo del número de individuos', tono: 'info' },
  CONTINENT_DERIVED_FROM_COORDINATES: { texto: 'El continente se dedujo de las coordenadas', tono: 'info' },
  SCIENTIFIC_NAME_AND_ID_INCONSISTENT: { texto: 'El nombre científico y su identificador no coinciden', tono: 'aviso' },
}

/** Traducción por tabla cerrada: el código desconocido se muestra como texto, nunca se interpreta. */
export function traducirMarca(codigo: string): MarcaTraducida {
  const limpio = String(codigo).slice(0, 80)
  const conocida = Object.prototype.hasOwnProperty.call(MARCAS, limpio) ? MARCAS[limpio] : null
  if (conocida) return { codigo: limpio, ...conocida }
  return { codigo: limpio, texto: `Marca de calidad de GBIF: ${limpio}`, tono: 'info' }
}

const MARCAS_LOCALES: Record<string, { texto: string; tono: TonoMarca }> = {
  incertidumbre_no_informada: { texto: 'El publicador no informó la incertidumbre de la coordenada', tono: 'aviso' },
  incertidumbre_mayor_umbral: { texto: 'La incertidumbre de la coordenada es grande: la ubicación es aproximada', tono: 'aviso' },
  incertidumbre_alcanza_borde_regional: { texto: 'La incertidumbre alcanza el borde de la región: el punto podría quedar fuera de ella', tono: 'aviso' },
  incertidumbre_alcanza_borde_municipal: { texto: 'La incertidumbre cruza el límite del municipio: el municipio asignado es aproximado', tono: 'info' },
}

/** Marcas de revisión propias de la plataforma (no son códigos de GBIF); tabla cerrada con texto genérico de respaldo. */
export function traducirMarcaLocal(codigo: string): MarcaTraducida {
  const limpio = String(codigo).slice(0, 80)
  const conocida = Object.prototype.hasOwnProperty.call(MARCAS_LOCALES, limpio) ? MARCAS_LOCALES[limpio] : null
  if (conocida) return { codigo: limpio, ...conocida }
  return { codigo: limpio, texto: `Marca de revisión de la plataforma: ${limpio}`, tono: 'info' }
}

/** Las marcas pueden llegar como elementos sueltos o unidas con «;»: se separan, limpian y sin repetir. */
export function separarMarcas(valores: readonly string[] | null | undefined): string[] {
  const salida = new Set<string>()
  for (const v of valores ?? []) {
    for (const parte of String(v).split(';')) {
      const limpia = parte.trim()
      if (limpia) salida.add(limpia)
    }
  }
  return [...salida]
}
