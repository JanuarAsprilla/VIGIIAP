// Etiquetas y formato compartidos por la pestaña Analítica y su exportación a Excel.

export const ETIQUETA_EVENTO: Record<string, string> = {
  descarga_mapa: 'Descargas de mapas',
  descarga_documento: 'Descargas de documentos',
  abrir_geovisor: 'Geovisores abiertos',
  usar_herramienta: 'Herramientas usadas',
  buscar: 'Búsquedas',
  compartir: 'Compartidos',
}

export const ETIQUETA_DISPOSITIVO: Record<string, string> = {
  movil: 'Móvil',
  tablet: 'Tablet',
  escritorio: 'Escritorio',
}

/** «+50 %», «−25 %», «0 %»; la tasa de rebote se compara en puntos («+20 pts»). */
export function formatoVariacion(valor: number, unidad: '%' | 'pts'): string {
  if (valor === 0) return unidad === '%' ? '0 %' : '0 pts'
  const signo = valor > 0 ? '+' : '−'
  return `${signo}${Math.abs(valor)} ${unidad}`
}
