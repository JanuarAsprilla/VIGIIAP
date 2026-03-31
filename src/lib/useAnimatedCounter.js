import { useState, useEffect, useRef } from 'react'

/**
 * Anima un número de 0 a `target` cuando el elemento es visible.
 * Usa easeOutQuart para desaceleración natural.
 */
export function useAnimatedCounter(target, { duration = 2000, enabled = true } = {}) {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const hasAnimated = useRef(false)

  useEffect(() => {
    if (!enabled || hasAnimated.current) return

    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true
          const start = performance.now()

          function tick(now) {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            // easeOutQuart — desacelera al final
            const eased = 1 - Math.pow(1 - progress, 4)
            setCount(Math.floor(eased * target))

            if (progress < 1) {
              requestAnimationFrame(tick)
            }
          }

          requestAnimationFrame(tick)
        }
      },
      { threshold: 0.5 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [target, duration, enabled])

  return { count, ref }
}