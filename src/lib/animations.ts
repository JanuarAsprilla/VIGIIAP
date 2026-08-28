/**
 * Helpers de animación compartidos — Framer Motion.
 * Funciones puras — sin dependencias React.
 */
import type { MotionProps, Variants } from 'framer-motion'

// ── Easing curves (design.md) ───────────────────────────────────────────────
export const EASE_OUT_EXPO: [number, number, number, number]  = [0.16, 1,    0.3, 1]    // enter
export const EASE_IN_EXPO: [number, number, number, number]   = [0.55, 0,    1,   0.45] // exit
export const EASE_SPRING: [number, number, number, number]    = [0.22, 1,    0.36, 1]   // general
export const EASE_DRAWER: [number, number, number, number]    = [0.32, 0.72, 0,   1]    // drawers

// ── Basic fades ─────────────────────────────────────────────────────────────

/** Fade + slide-up, delay opcional */
export const fadeUp = (delay = 0): MotionProps => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.5, delay, ease: EASE_SPRING },
})

/** Compacto para páginas admin (<16 px) */
export const fadeUpSm = (delay = 0): MotionProps => ({
  initial:    { opacity: 0, y: 12 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.4, delay, ease: EASE_SPRING },
})

/** Desde la izquierda */
export const fadeLeft = (delay = 0): MotionProps => ({
  initial:    { opacity: 0, x: -28 },
  animate:    { opacity: 1, x:  0  },
  transition: { duration: 0.55, delay, ease: EASE_SPRING },
})

/** Desde la derecha */
export const fadeRight = (delay = 0): MotionProps => ({
  initial:    { opacity: 0, x: 28 },
  animate:    { opacity: 1, x: 0  },
  transition: { duration: 0.55, delay, ease: EASE_SPRING },
})

// ── 3-D perspective enters ───────────────────────────────────────────────────

/**
 * Entrada con profundidad 3D (leve rotateX + y-slide).
 * Usar en cards y secciones que necesiten sensación de volumen.
 */
export const floatIn3D = (delay = 0): MotionProps => ({
  initial:    { opacity: 0, y: 40, rotateX: 8,  scale: 0.97 },
  animate:    { opacity: 1, y: 0,  rotateX: 0,  scale: 1    },
  transition: { duration: 0.65, delay, ease: EASE_OUT_EXPO,
                rotateX: { duration: 0.7, delay, ease: EASE_OUT_EXPO } },
  style:      { transformPerspective: 900, transformStyle: 'preserve-3d' },
})

/**
 * Entrada compacta 3D para grids densos (delay proporcional al índice).
 * Uso: <motion.div {...cardEnter3D(index)} />
 */
export const cardEnter3D = (index = 0): MotionProps => ({
  initial:    { opacity: 0, y: 32, rotateX: 6, scale: 0.96 },
  whileInView:{ opacity: 1, y: 0,  rotateX: 0, scale: 1    },
  viewport:   { once: true, margin: '-40px' },
  transition: {
    duration: 0.55,
    delay: index * 0.06,
    ease: EASE_OUT_EXPO,
  },
  style:      { transformPerspective: 900 },
})

// ── Stagger containers ───────────────────────────────────────────────────────

/**
 * Variante para contenedor de stagger.
 * Uso: <motion.div variants={staggerContainer()} animate="animate" initial="initial">
 */
export const staggerContainer = (staggerChildren = 0.07, delayChildren = 0.08): Variants => ({
  initial:  {},
  animate:  { transition: { staggerChildren, delayChildren } },
})

/** Item hijo para staggerContainer */
export const staggerItem: Variants = {
  initial:  { opacity: 0, y: 24, scale: 0.97 },
  animate:  {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: EASE_SPRING },
  },
}

/** Item 3D hijo para staggerContainer */
export const staggerItem3D: Variants = {
  initial:  { opacity: 0, y: 28, rotateX: 5, scale: 0.97 },
  animate:  {
    opacity: 1, y: 0, rotateX: 0, scale: 1,
    transition: { duration: 0.5, ease: EASE_OUT_EXPO },
  },
}

// ── Page / panel transitions ─────────────────────────────────────────────────

/** Transición de página con perspectiva 3D sutil */
export const pageTransition: MotionProps = {
  initial:    { opacity: 0, y: 18, rotateX: 2 },
  animate:    { opacity: 1, y: 0,  rotateX: 0 },
  exit:       { opacity: 0, y: -8, rotateX: -1 },
  transition: { duration: 0.36, ease: EASE_SPRING },
  style:      { transformPerspective: 1200, transformOrigin: 'top center' },
}

/** Modal / panel centrado con scale + 3D */
export const panelAnim: MotionProps = {
  initial:    { opacity: 0, scale: 0.94, y: 12, rotateX: 4  },
  animate:    { opacity: 1, scale: 1,    y: 0,  rotateX: 0  },
  exit:       { opacity: 0, scale: 0.94, y: 12, rotateX: 4  },
  transition: { duration: 0.22, ease: EASE_SPRING },
  style:      { transformPerspective: 900 },
}

/** Drawer lateral desde la derecha */
export const drawerAnim: MotionProps = {
  initial:    { x: '100%', opacity: 0.7 },
  animate:    { x: 0,      opacity: 1   },
  exit:       { x: '100%', opacity: 0.7 },
  transition: { type: 'spring' as const, damping: 28, stiffness: 320 },
}

// ── Hover variants (para motion.div con whileHover) ──────────────────────────

/** Hover lift para tarjetas planas */
export const hoverLift: Variants = {
  rest:  { y: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' },
  hover: { y: -4, boxShadow: '0 16px 40px rgba(0,0,0,0.10)' },
}

/** Hover sutil para botones secundarios */
export const hoverPop: Variants = {
  rest:  { scale: 1 },
  hover: { scale: 1.03 },
  tap:   { scale: 0.97 },
}

// ── Spring configs ───────────────────────────────────────────────────────────

export const SPRING_SNAPPY = { type: 'spring', stiffness: 400, damping: 28 }
export const SPRING_SOFT   = { type: 'spring', stiffness: 200, damping: 22 }
export const SPRING_TILT   = { stiffness: 300, damping: 30 }
