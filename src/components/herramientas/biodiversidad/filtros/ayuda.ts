import type { ChipFiltro } from '../lib/chips'
import type { CambiosUrl } from '../lib/filtros'

/** Lo que una sección necesita para sugerir qué filtro quitar cuando no hay resultados. */
export interface AyudaFiltros {
  chips: ChipFiltro[]
  onCambio: (cambios: CambiosUrl) => void
  onLimpiar: () => void
}
