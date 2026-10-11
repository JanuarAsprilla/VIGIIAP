/**
 * Primera sección de Home — antes de mostrar la sigla VIGIA-IIAP, revela qué
 * significa: "Visor y Gestor de Información Ambiental" (VIGIA) del "Instituto
 * de Investigaciones Ambientales del Pacífico" (IIAP). Al hacer scroll, el
 * texto se mueve en dos capas a velocidad distinta (parallax) hasta que la
 * marca compacta VIGIA-IIAP queda como resultado — el fondo (orbes + patrón
 * topográfico) vive en HeroBackdrop, compartido con HeroSection, y se queda
 * quieto: solo el texto se mueve, no la escena de fondo.
 *
 * Usa GSAP + ScrollTrigger — ya instalados y registrados globalmente por
 * useLenis() en MainLayout. El scrub solo corre en lg+ (ScrollTrigger.matchMedia);
 * en móvil/tablet la sección colapsa a un bloque estático corto — nada de
 * scroll artificial en pantallas donde el parallax se siente peor y cuesta
 * más rendimiento.
 */
import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export default function InstitutionalRevealSection() {
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia()

      mm.add(
        { isDesktop: '(min-width: 1024px) and (prefers-reduced-motion: no-preference)' },
        () => {
          const layers = root.querySelector('[data-parallax-layers]')
          if (!layers) return

          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: layers,
              start: '0% 0%',
              end: '100% 0%',
              scrub: 0,
            },
          })

          tl.to(layers.querySelectorAll('[data-layer="3"]'), { yPercent: 70, ease: 'none' })
            .to(layers.querySelectorAll('[data-layer="4"]'), { yPercent: -15, ease: 'none' }, '<')

          return () => tl.scrollTrigger?.kill()
        },
      )

      return () => mm.revert()
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={rootRef} className="relative">
      <div
        data-parallax-layers
        className="relative h-auto lg:h-[95vh] overflow-hidden"
      >
        <div className="lg:sticky lg:top-0 flex flex-col items-center justify-center min-h-[60vh] lg:h-[72vh] px-6 py-16 lg:py-0 overflow-hidden">
          {/* Capa 3 — el nombre completo, antes de la sigla */}
          <div data-layer="3" className="relative z-10 text-center max-w-3xl mx-auto mb-10 lg:mb-14">
            <p
              className="text-[0.65rem] sm:text-xs font-bold uppercase tracking-[0.3em] mb-4"
              style={{ color: 'var(--hero-eyebrow-text)' }}
            >
              Instituto de Investigaciones Ambientales del Pacífico
            </p>
            <h1
              className="font-display font-bold leading-[1.1]"
              style={{ fontSize: 'clamp(1.6rem, 4.2vw, 3rem)', color: 'var(--hero-title-color)' }}
            >
              Visor y Gestor de
              <span className="block" style={{ color: 'var(--hero-title-accent)' }}>Información Ambiental</span>
            </h1>
          </div>

          {/* Capa 4 — la marca resuelta, la más rápida: el "ahora ya sabes qué significa" */}
          <div data-layer="4" className="relative z-10 text-center">
            <span
              className="font-display font-black tracking-tight"
              style={{ fontSize: 'clamp(2.5rem, 9vw, 6.5rem)', color: 'var(--hero-title-color)', lineHeight: 1 }}
            >
              VIGIA
              <span style={{ color: 'var(--hero-accent-color)' }}>-IIAP</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
