import { useEffect } from 'react'

/**
 * Bloquea el scroll del body mientras el componente que lo llama está
 * montado — sin esto, la rueda del mouse mueve la página de fondo (home,
 * geovisor, lo que sea) en vez del contenido del panel/modal abierto encima.
 * Usar en cualquier overlay a pantalla completa (bienvenida, login,
 * recuperar contraseña, solicitar acceso, etc.).
 */
export function useLockBodyScroll() {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previousOverflow }
  }, [])
}
