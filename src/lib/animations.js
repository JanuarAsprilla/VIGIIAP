/**
 * Helpers de animación compartidos para Framer Motion.
 * Funciones puras — sin dependencias React.
 */

/**
 * Devuelve un objeto de props de animación para un fade + slide hacia arriba.
 * @param {number} delay  Retraso en segundos (por defecto 0)
 */
export const fadeUp = (delay = 0) => ({
  initial:    { opacity: 0, y: 20 },
  animate:    { opacity: 1, y: 0  },
  transition: { duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] },
})
