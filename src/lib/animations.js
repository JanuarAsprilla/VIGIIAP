/**
 * Helpers de animación compartidos para Framer Motion.
 * Funciones puras — sin dependencias React.
 */

/** fade + slide hacia arriba con delay opcional */
export const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})

/** Variante compacta usada en páginas admin (y < 20 px) */
export const fadeUpSm = (delay = 0) => ({
  initial:    { opacity: 0, y: 16 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] },
})

/** Modal / panel centrado con scale */
export const panelAnim = {
  initial:    { opacity: 0, scale: 0.96, y: 10 },
  animate:    { opacity: 1, scale: 1,    y: 0  },
  exit:       { opacity: 0, scale: 0.96, y: 10 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
}

/** Drawer lateral desde la derecha */
export const drawerAnim = {
  initial:    { x: '100%' },
  animate:    { x: 0       },
  exit:       { x: '100%' },
  transition: { type: 'spring', damping: 28, stiffness: 320 },
}
