export type FormatoInforme = 'pdf' | 'xlsx' | 'csv'
export type AccesoInforme = 'publico' | 'usuarios'

export const FORMATOS_INFORME: { clave: FormatoInforme; nombre: string; ayuda: string }[] = [
  { clave: 'pdf', nombre: 'PDF', ayuda: 'Informe con la plantilla de la institución, listo para leer o adjuntar.' },
  { clave: 'xlsx', nombre: 'Excel (.xlsx)', ayuda: 'Tablas con los datos y una hoja con los filtros y la cita de la fuente.' },
  { clave: 'csv', nombre: 'CSV', ayuda: 'Datos planos para otros programas, sin plantilla.' },
]

export const NOMBRE_FORMATO: Record<FormatoInforme, string> = { pdf: 'PDF', xlsx: 'Excel', csv: 'CSV' }

/** Herramientas que ya saben generar un informe; las demás aparecen en el panel pero no se pueden encender. */
export const HERRAMIENTAS_CON_INFORME: ReadonlySet<string> = new Set(['biodiversidad'])

export const LIMITE_FILAS = { minimo: 100, maximo: 50000 } as const
export const LOGO_TIPOS = ['image/png', 'image/jpeg', 'image/webp'] as const
export const LOGO_MAX_BYTES = 2 * 1024 * 1024
export const COLOR_HEX = /^#[0-9A-Fa-f]{6}$/
