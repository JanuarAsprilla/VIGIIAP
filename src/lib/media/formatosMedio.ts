/** Formatos y límites de subida para fotos/video de una ficha -- compartido
 *  entre MedioDropzone.tsx y MediosFichaGrid.tsx (separado de ambos para no
 *  romper Fast Refresh al exportar constantes junto a un componente). */
export const FORMATOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp']
export const FORMATOS_VIDEO = ['video/mp4', 'video/quicktime', 'video/webm']
export const MAX_BYTES_IMAGEN = 15 * 1024 * 1024
export const MAX_BYTES_VIDEO = 300 * 1024 * 1024

export interface ArchivoRechazado {
  nombre: string
  motivo: string
}
