/**
 * VIGIIAP — Smooth scroll global con Lenis
 * Se instancia una sola vez en MainLayout y se integra con GSAP ScrollTrigger.
 */
import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

let lenisInstance = null

export function getLenis() { return lenisInstance }

export function useLenis() {
  useEffect(() => {
    const lenis = new Lenis({
      duration:  1.4,
      easing:    (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth:    true,
      smoothTouch: false,
    })

    lenisInstance = lenis

    // Integración con GSAP ScrollTrigger
    lenis.on('scroll', ScrollTrigger.update)

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000)
    })
    gsap.ticker.lagSmoothing(0)

    return () => {
      lenis.destroy()
      lenisInstance = null
      gsap.ticker.remove(() => {})
    }
  }, [])
}
