import { BarChart3, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import ConversorCoordenadas from '@/components/herramientas/ConversorCoordenadas'
import PanelChocoTool from '@/components/herramientas/PanelChocoTool'

type AccentColor = 'primary' | 'orange' | 'gold' | 'green'

interface EntradaRegistro {
  Component: ComponentType<{ onToast?: (msg: string) => void }>
  /** Herramientas con su propia navegación interna (pestañas/secciones) se
   *  muestran en la grilla como tarjeta lanzadora (icon/color obligatorios
   *  aquí) y ocupan toda la página al abrirse -- ver Herramientas.tsx.
   *  Herramientas simples (sin `focusable`) renderizan su propio ToolCard
   *  internamente con su tag/título/ícono ya en el componente. */
  focusable?: boolean
  icon?: LucideIcon
  color?: AccentColor
}

/**
 * Registro estático clave -> componente/ícono/color real. Es DELIBERADAMENTE
 * código, no datos: el backend (tabla `herramientas`, ver useHerramientas.ts)
 * solo administra el CONTENIDO (título, descripción, tag, activa, orden) de
 * cada clave; el componente que realmente ejecuta la herramienta sigue
 * requiriendo un desarrollador + despliegue. Una fila del backend cuya clave
 * no exista aquí se descarta en silencio (ver useHerramientasCatalogo) --
 * nunca rompe la página, pero tampoco hace aparecer una herramienta de la nada.
 */
export const REGISTRO_HERRAMIENTAS: Record<string, EntradaRegistro> = {
  conversor: { Component: ConversorCoordenadas },
  'panel-choco': { Component: PanelChocoTool, focusable: true, icon: BarChart3, color: 'gold' },
}
