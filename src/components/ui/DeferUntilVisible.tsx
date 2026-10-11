import { useEffect, useRef, useState, type ReactNode } from 'react'

interface DeferUntilVisibleProps {
  children: ReactNode
  /** Alto del placeholder mientras no se ha activado -- evita salto de layout
   * cuando el contenido real (con su propia altura) reemplaza al placeholder. */
  placeholderHeight?: string
  /** Qué tan antes de entrar al viewport se dispara el montaje real. */
  rootMargin?: string
}

/**
 * Retrasa el montaje de children hasta que el contenedor esté a punto de
 * entrar al viewport. Para secciones pesadas (ej. el hero 3D de Home, que
 * carga el chunk de three.js -- 258kB gzip) que hoy se montan apenas hace
 * mount la página que las contiene, sin importar si están más abajo del
 * scroll y el usuario nunca llega a verlas.
 */
export default function DeferUntilVisible({ children, placeholderHeight, rootMargin = '300px' }: DeferUntilVisibleProps) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (visible) return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible, rootMargin])

  if (visible) return <>{children}</>
  return <div ref={ref} style={placeholderHeight ? { height: placeholderHeight } : undefined} aria-hidden="true" />
}
