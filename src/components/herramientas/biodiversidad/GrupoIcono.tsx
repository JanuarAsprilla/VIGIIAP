import ave from '@iconify-icons/iconoven/bird'
import mariposa from '@iconify-icons/iconoven/butterfly'
import rana from '@iconify-icons/iconoven/frog'
import hoja from '@iconify-icons/iconoven/leaf'
import hongo from '@iconify-icons/iconoven/mushroom'
import huella from '@iconify-icons/iconoven/paw'
import serpiente from '@iconify-icons/iconoven/snake'
import { cuerpoSvgAElementos } from './lib/svgSeguro'
import type { Grupo } from './types'

/** Iconos de IconOven (MIT, @iconify-icons/iconoven), un solo estilo de línea para los siete grupos. */
const ICONOS: Record<Grupo, { body: string }> = {
  aves: ave,
  mamiferos: huella,
  anfibios: rana,
  reptiles: serpiente,
  insectos: mariposa,
  plantas: hoja,
  hongos: hongo,
}

const CACHE = new Map<Grupo, ReturnType<typeof cuerpoSvgAElementos>>()

function elementos(grupo: Grupo) {
  const previo = CACHE.get(grupo)
  if (previo) return previo
  const nuevo = cuerpoSvgAElementos(ICONOS[grupo].body)
  CACHE.set(grupo, nuevo)
  return nuevo
}

/** Icono del grupo; decorativo (el nombre siempre está en texto). Hereda el color con currentColor. */
export default function GrupoIcono({ grupo, className = '' }: { grupo: Grupo; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false" className={className} data-grupo-icono={grupo}>
      {elementos(grupo)}
    </svg>
  )
}
