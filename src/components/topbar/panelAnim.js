/**
 * panelAnim — configuración de animación compartida por todos los paneles del TopBar.
 * Centralizada aquí para que un cambio de diseño afecte a todos por igual.
 */
export const panelAnim = {
  initial:    { opacity: 0, y: -6, scale: 0.97 },
  animate:    { opacity: 1, y: 0,  scale: 1    },
  exit:       { opacity: 0, y: -6, scale: 0.97 },
  transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
}
