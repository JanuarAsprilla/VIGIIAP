import { useEffect } from 'react'

/**
 * Bloquea el scroll del body mientras el componente que lo llama está
 * montado — sin esto, la rueda del mouse mueve la página de fondo (home,
 * geovisor, lo que sea) en vez del contenido del panel/modal abierto encima.
 * Usar en cualquier overlay a pantalla completa (bienvenida, login,
 * recuperar contraseña, solicitar acceso, etc.).
 *
 * `enabled = false` deja el body sin bloquear — para overlays no bloqueantes
 * como el panel de bienvenida, que debe permitir ver/scrollear el fondo
 * (requisito de verificación de marca OAuth de Google).
 */
export function useLockBodyScroll(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [enabled])
}
