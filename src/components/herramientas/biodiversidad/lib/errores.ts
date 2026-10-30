export interface ErrorDescrito {
  titulo: string
  detalle: string
}

/** Traduce un error de la API (axios ya normalizado en lib/api.ts con `.status`) a un mensaje claro. */
export function describirError(error: unknown): ErrorDescrito {
  const status = typeof error === 'object' && error !== null ? (error as { status?: number }).status : undefined
  switch (status) {
    case 404:
      return { titulo: 'Sin datos disponibles', detalle: 'La herramienta está apagada o este grupo todavía no tiene datos cargados.' }
    case 422:
      return { titulo: 'Consulta no válida', detalle: 'Los filtros elegidos no se pueden aplicar. Restablécelos e inténtalo de nuevo.' }
    case 429:
      return { titulo: 'Demasiadas consultas', detalle: 'Se alcanzó el límite de consultas. Espera un momento antes de reintentar.' }
    case 503:
      return { titulo: 'La consulta tardó demasiado', detalle: 'Acota los filtros (municipio, departamento o rango de años) e inténtalo de nuevo.' }
    case undefined:
      return { titulo: 'Sin conexión con el servidor', detalle: 'No se pudo contactar el servicio. Revisa tu conexión e inténtalo de nuevo.' }
    default:
      return { titulo: 'No se pudo cargar la información', detalle: 'Ocurrió un error inesperado. Inténtalo de nuevo en unos minutos.' }
  }
}
