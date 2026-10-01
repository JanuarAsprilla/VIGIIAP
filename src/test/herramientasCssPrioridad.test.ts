/**
 * Guardas del orden de los estilos de las herramientas. En desarrollo el orden de las hojas es el de los
 * imports, pero al compilar el reparto de CSS en archivos cambia y el CSS original de cada herramienta
 * llegó a pisar el sistema visual común (botones planos de 6 px en vez de píldoras). Se evita con:
 *  1) el CSS original dentro de una capa de menor prioridad (el tema sin capa gana siempre), y
 *  2) el tema común inlineado en el tema de cada herramienta.
 */
import { describe, test, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Vitest corre desde la raíz del proyecto. Los imports `?raw` de CSS llegan vacíos en vitest, por eso se lee el archivo.
const leer = (ruta: string) => readFileSync(`src/components/herramientas/${ruta}`, 'utf8')

const HERRAMIENTAS = [
  {
    nombre: 'validador',
    original: leer('validador-coordenadas/validador.original.css'),
    tema: leer('validador-coordenadas/validador.tema.css'),
    componente: leer('validador-coordenadas/ValidadorCoordenadas.tsx'),
  },
  {
    nombre: 'panel Chocó',
    original: leer('panel-choco/panelChoco.original.css'),
    tema: leer('panel-choco/panelChoco.tema.css'),
    componente: leer('panel-choco/PanelChocoBiogeografico.tsx'),
  },
]
const temaComun = leer('herramientaTema.css')

/** Verdadero si todo el CSS (sin comentarios) está dentro de un único bloque de nivel superior. */
function todoDentroDeUnBloque(css: string): boolean {
  let nivel = 0
  let abierto = false
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') { nivel++; abierto = true }
    if (css[i] === '}') nivel--
    if (abierto && nivel === 0 && i < css.length - 1) return false
  }
  return abierto && nivel === 0
}

describe.each(HERRAMIENTAS)('CSS de $nombre', ({ original, tema, componente }) => {
  test('el CSS original va dentro de la capa ht-original y no deja reglas fuera de ella', () => {
    const css = original.replace(/\/\*[\s\S]*?\*\//g, '').trim()
    expect(css.startsWith('@layer ht-original {')).toBe(true)
    expect(todoDentroDeUnBloque(css)).toBe(true)
  })

  test('el tema inlinea el sistema común como primera línea', () => {
    expect(tema.startsWith("@import '../herramientaTema.css';")).toBe(true)
  })

  test('el componente no importa el tema común aparte (generaría un archivo CSS suelto que se carga antes)', () => {
    expect(componente).not.toMatch(/import ['"]\.\.\/herramientaTema\.css['"]/)
  })
})

describe('sistema común', () => {
  test('la hoja común no está dentro de ninguna capa (debe ganarle al CSS original)', () => {
    expect(temaComun).not.toMatch(/@layer/)
  })

  test('define el botón principal compartido', () => {
    expect(temaComun).toMatch(/\.ht-root \.ht-primario\s*\{/)
  })

  test('la guarda detecta CSS fuera de la capa', () => {
    expect(todoDentroDeUnBloque('@layer a { .x { color: red } }')).toBe(true)
    expect(todoDentroDeUnBloque('@layer a { .x { color: red } } .y { color: blue }')).toBe(false)
  })
})

describe('responsivo de las herramientas', () => {
  test.each([
    ['validador', 'validador-coordenadas/validador.tema.css', 'vc', '.vc-root #wrap'],
    ['panel Chocó', 'panel-choco/panelChoco.tema.css', 'pc', '.pc-root .main'],
  ])('%s: el contenedor de consultas va en el wrapper interno, no en la raíz', (_n, ruta, id, selector) => {
    const css = leer(ruta)
    expect(css).toContain(`${selector} { container: ${id} / inline-size; }`)
    // En la raíz atraparía los diálogos fixed (contención de layout).
    expect(css).not.toMatch(new RegExp(`\\.${id}-root\\s*\\{[^}]*container:`))
    expect(css).toMatch(new RegExp(`@container ${id} \\(max-width`))
  })

  test('los botones y campos táctiles miden al menos 44 px', () => {
    expect(temaComun).toMatch(/@media \(pointer: coarse\)[\s\S]*min-height: 2\.75rem/)
  })
})

describe('texto de introducción del validador', () => {
  test('comparte una sola regla de estilo con la nota de límites (mismo tamaño y color)', () => {
    const tema = leer('validador-coordenadas/validador.tema.css')
    expect(tema).toMatch(/\.vc-root :is\(\.sub, \.vc-nota\)\s*\{[^}]*font-size: 0\.75rem/)
    expect(tema).not.toMatch(/\.vc-root \.sub\s*\{[^}]*font-size/)
  })
})
