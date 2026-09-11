import '@testing-library/jest-dom'

// jsdom no implementa matchMedia — cualquier hook que lo consulte
// (useReducedMotion, gsap ScrollTrigger, etc.) lo necesita para montar.
// Por defecto "no coincide" (comportamiento estándar del navegador sin
// preferencias especiales); los tests que necesiten simular una preferencia
// activa siguen pudiendo sobreescribir window.matchMedia puntualmente.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  })
}
