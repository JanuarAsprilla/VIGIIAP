/** Plantilla institucional que entrega el servidor (la misma que se edita en Administración → Informes). */
export interface PlantillaInforme {
  institucion: string
  subtitulo: string | null
  pie: string | null
  aviso: string | null
  colorPrimario: string
  colorAcento: string
  logoUrl: string | null
}

export type Celda = string | number | null

export interface Cifra {
  etiqueta: string
  valor: string
  nota?: string
}

export interface TablaInforme {
  titulo: string
  columnas: string[]
  filas: Celda[][]
  /** Columnas numéricas (alineadas a la derecha en el PDF). */
  numericas?: number[]
  nota?: string
  /** La tabla que se exporta como CSV; si ninguna lo marca, la primera. */
  principal?: boolean
}

export interface SeccionInforme {
  titulo: string
  cifras?: Cifra[]
  tablas?: TablaInforme[]
  parrafos?: string[]
}

/** Contenido de un informe, independiente del formato: cada generador (PDF, Excel, CSV) lo dibuja a su manera. */
export interface DatosInforme {
  titulo: string
  subtitulo?: string
  generadoEn: Date
  /** Filtros aplicados, en texto legible. */
  filtros: string[]
  secciones: SeccionInforme[]
  /** Fuente, cita y licencias: aparecen al final de todo informe. */
  fuente: string[]
  /** Sin extensión; se limpia antes de guardar. */
  nombreArchivo: string
}

export type FormatoDescarga = 'pdf' | 'xlsx' | 'csv'

export interface LogoPdf {
  dataUrl: string
  formato: 'PNG' | 'JPEG'
  ancho: number
  alto: number
}
