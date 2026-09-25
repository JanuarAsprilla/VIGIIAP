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

// jsdom tampoco implementa IntersectionObserver — cualquier componente que lo
// use (DeferUntilVisible, etc.) lo necesita para montar sin lanzar. Por
// defecto nunca "intersecta" (el componente que lo use se queda en su estado
// inicial/placeholder); los tests que necesiten simular una intersección real
// siguen pudiendo sobreescribir window.IntersectionObserver puntualmente.
if (!window.IntersectionObserver) {
  class MockIntersectionObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  })
}
