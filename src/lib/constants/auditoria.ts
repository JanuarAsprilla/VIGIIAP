export type Severidad = 'critica' | 'advertencia' | 'info'

export const SEVERIDADES_ORDEN: readonly Severidad[] = ['critica', 'advertencia', 'info']

/** Presentación de cada gravedad; el color nunca es la única señal (siempre va con texto). */
export const SEVERIDAD_META: Record<Severidad, { label: string; dot: string; chip: string }> = {
  critica:     { label: 'Crítica',      dot: 'bg-red-500',     chip: 'bg-red/10 text-red-dark' },
  advertencia: { label: 'Advertencia',  dot: 'bg-gold-500',    chip: 'bg-gold-500/12 text-gold-500' },
  info:        { label: 'Informativa',  dot: 'bg-primary-500', chip: 'bg-primary-500/12 text-primary-500' },
}

const VERBOS: Array<[string, string]> = [
  ['create_', 'Crear'], ['update_', 'Actualizar'], ['delete_', 'Eliminar'],
  ['upsert_', 'Guardar'], ['export_', 'Exportar'], ['import_', 'Importar'],
]

/** Etiqueta legible para una acción que todavía no está en el diccionario. */
export function humanizarAccion(accion: string): string {
  const verbo = VERBOS.find(([prefijo]) => accion.startsWith(prefijo))
  const resto = (verbo ? accion.slice(verbo[0].length) : accion).replace(/_/g, ' ').trim()
  const texto = verbo ? `${verbo[1]} ${resto}` : resto
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

export const DISPOSITIVO_LABEL: Record<string, string> = {
  escritorio: 'Escritorio', movil: 'Móvil', tablet: 'Tableta',
}

/** "Chrome · macOS" (o lo que se conozca); null si no hay nada que mostrar. */
export function resumenOrigen(navegador?: string | null, sistema?: string | null): string | null {
  const partes = [navegador, sistema].filter(Boolean)
  return partes.length ? partes.join(' · ') : null
}
