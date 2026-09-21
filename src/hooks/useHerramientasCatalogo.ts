import type { ComponentType } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { Herramienta } from '@/types'
import { useHerramientasList } from './useHerramientas'
import { REGISTRO_HERRAMIENTAS } from '@/lib/herramientasRegistro'

export interface HerramientaCatalogo extends Herramienta {
  Component: ComponentType<{ onToast?: (msg: string) => void }>
  focusable: boolean
  icon?: LucideIcon
  color?: 'primary' | 'orange' | 'gold' | 'green'
}

/**
 * Combina el catálogo administrable (backend, contenido) con el registro
 * estático de componentes (frontend, código) por `clave`. Una fila del
 * backend cuya clave no tenga componente shippeado se descarta en silencio
 * -- nunca rompe la página, solo significa que esa herramienta todavía no
 * tiene código detrás.
 */
export function useHerramientasCatalogo() {
  const { data, isLoading, isError } = useHerramientasList()

  const items: HerramientaCatalogo[] = (data ?? [])
    .filter((h) => h.clave in REGISTRO_HERRAMIENTAS)
    .map((h) => ({ ...h, ...REGISTRO_HERRAMIENTAS[h.clave], focusable: REGISTRO_HERRAMIENTAS[h.clave].focusable ?? false }))

  return { items, isLoading, isError }
}
