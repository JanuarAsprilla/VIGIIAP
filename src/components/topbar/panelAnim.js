/**
 * panelAnim — configuración de animación compartida por todos los paneles del TopBar.
 * Centralizada aquí para que un cambio de diseño afecte a todos por igual.
 */
export const panelAnim = {
  initial:    { opacity: 0, y: -8, rotateX: 4, scale: 0.96 },
  animate:    { opacity: 1, y: 0,  rotateX: 0, scale: 1    },
  exit:       { opacity: 0, y: -8, rotateX: 4, scale: 0.96 },
  transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] },
  style:      { transformPerspective: 700, transformOrigin: 'top center' },
}
