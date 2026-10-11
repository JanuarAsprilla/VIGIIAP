/**
 * GlassPanel — shell de vidrio líquido compartido por los paneles flotantes
 * del TopBar (Soporte, Notificaciones, Ajustes, Perfil).
 *
 * Centraliza el material `.glass-panel` (translúcido, con borde especular)
 * definido en index.css, que responde a claro/oscuro y a
 * prefers-reduced-transparency — así los 4 paneles quedan consistentes sin
 * repetir el shell en cada uno.
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
