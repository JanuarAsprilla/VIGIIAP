import { BarChart3, Leaf, MapPinCheck, type LucideIcon } from 'lucide-react'
import type { ComponentType } from 'react'
import PanelChocoTool from '@/components/herramientas/PanelChocoTool'
import BiodiversidadTool from '@/components/herramientas/BiodiversidadTool'
import ValidadorCoordenadasTool from '@/components/herramientas/ValidadorCoordenadasTool'

type AccentColor = 'primary' | 'orange' | 'gold' | 'green'

interface EntradaRegistro {
  Component: ComponentType<{ onToast?: (msg: string) => void }>
  /** Toda herramienta se muestra como una tarjeta pequeña en la grilla (ícono y color
   *  obligatorios) y, al abrirla, ocupa toda la página -- ver Herramientas.tsx. */
  icon: LucideIcon
  color: AccentColor
  /** Herramienta que gestiona su propio estado en la URL y admite enlace directo (?herramienta=clave). */
  focusable?: boolean
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
  'panel-choco': { Component: PanelChocoTool, icon: BarChart3, color: 'gold' },
  'validador-coordenadas': { Component: ValidadorCoordenadasTool, icon: MapPinCheck, color: 'primary' },
  biodiversidad: { Component: BiodiversidadTool, icon: Leaf, color: 'green', focusable: true },
}
