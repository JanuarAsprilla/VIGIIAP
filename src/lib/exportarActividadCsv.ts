import api from '@/lib/api'
import type { OpcionesExportarActividad } from '@/lib/exportarActividadExcel'

/** Tope de eventos de un CSV; el backend rechaza más que esto (ver export.controller). */
export const MAX_FILAS_CSV = 500_000

/** El backend compara `creado_en <= hasta`: una fecha sin hora excluiría el último día completo. */
export const finDeDia = (fecha: string): string => `${fecha}T23:59:59.999Z`

/**
 * URL del CSV completo del registro de actividad. Se descarga con un enlace normal en vez de
 * traerlo a memoria: el backend lo transmite por bloques y el navegador lo guarda directo a disco.
 * Aplica los filtros que el backend entiende; la búsqueda de texto libre no es uno de ellos.
 */
export function urlExportarActividadCsv(
  opciones: OpcionesExportarActividad,
  base: string = api.defaults.baseURL ?? '/api/v1',
): string {
  const params = new URLSearchParams({ formato: 'csv' })
  const filtros: Record<string, string | undefined> = {
    desde: opciones.desde,
    hasta: opciones.hasta ? finDeDia(opciones.hasta) : undefined,
    modulo: opciones.filtroModulo,
    accion: opciones.filtroAccion,
    severidad: opciones.severidad,
    resultado: opciones.resultado,
    usuario: opciones.usuario,
    ip: opciones.ip,
  }
  for (const [clave, valor] of Object.entries(filtros)) {
    if (valor) params.set(clave, valor)
  }
  return `${base}/admin/export/audit?${params.toString()}`
}
