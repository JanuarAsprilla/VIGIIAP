export type FilaExcel = Record<string, string | number | undefined>

export type EstadoCoordenada = 'VÁLIDA' | 'SOSPECHOSA' | 'INVÁLIDA' | ''

/** Resultado de validación de una fila -- mismo índice que su fila en `rows`. */
export interface FilaResultado {
  estado: EstadoCoordenada
  tipoError: string
  observacion: string
  depDet: string
  muniDet: string
  codigoDivipola: string
  latIntercambiada: boolean
  distCentroideKm: number | null
  /** Número de fila en el Excel original (1-indexado + encabezado). Ausente si es manual. */
  filaExcel?: number
  /** Agregada haciendo clic en el mapa, no viene del Excel. */
  manual?: boolean
  /** Se movió su posición en el mapa después de cargada/agregada. */
  movido?: boolean
  latOriginalAntesDeMover?: string | number
  lonOriginalAntesDeMover?: string | number
  /** El usuario confirmó manualmente que una coordenada repetida es intencional. */
  confirmadoManual?: boolean
}

export type FormatoCoordenadas = 'dd' | 'dms' | 'utm'

export type OrigenPunto = '' | 'agregado' | 'movido' | 'confirmado'

export interface FiltrosState {
  estado: EstadoCoordenada | ''
  depto: string
  muni: string
  error: string
  filaDesde: number | null
  filaHasta: number | null
  origen: OrigenPunto
}

export const FILTROS_INICIALES: FiltrosState = {
  estado: '', depto: '', muni: '', error: '', filaDesde: null, filaHasta: null, origen: '',
}

export interface ItemFiltrado {
  idx: number
  r: FilaResultado
}

export interface ResumenMunicipio {
  dep: string
  muni: string
  reg: number
  val: number
  sos: number
  inv: number
  especial?: boolean
}

export interface UtmCoord {
  zone: number
  banda: 'N' | 'S'
  easting: number
  northing: number
}
