/**
 * GlassPanel — shell de vidrio líquido compartido por los paneles flotantes
 * del TopBar (Soporte, Notificaciones, Ajustes, Perfil).
 *
 * Antes cada panel repetía el mismo shell hardcodeado en blanco sólido
 * (`bg-white border border-border rounded-xl shadow-float`), sin adaptarse
 * al modo oscuro. Este componente centraliza esa superficie usando el
 * material `.glass-panel` (translúcido, con borde especular) definido en
 * index.css, que sí responde a claro/oscuro y a prefers-reduced-transparency.
 */
import { motion, type HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  width?: string
  children: ReactNode
}

export default function GlassPanel({ width = 'w-72', className = '', children, ...motionProps }: GlassPanelProps) {
  return (
    <motion.div
      {...motionProps}
      className={`glass-panel absolute top-full right-0 mt-2 ${width} rounded-xl overflow-hidden z-50 ${className}`}
    >
      {children}
    </motion.div>
  )
}
