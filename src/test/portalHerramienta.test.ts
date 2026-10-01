import { describe, test, expect, afterEach } from 'vitest'
import { crearPortal, moverAlPortal } from '@/components/herramientas/portalHerramienta'

afterEach(() => { document.body.innerHTML = '' })

describe('crearPortal', () => {
  test('agrega al body un contenedor con las clases de la herramienta', () => {
    const portal = crearPortal(['vc-root', 'ht-root'])
    expect(portal.elemento.parentElement).toBe(document.body)
    expect(portal.elemento.className).toBe('vc-root ht-root')
  })

  test('quitar() retira el contenedor del DOM', () => {
    const portal = crearPortal(['ht-root'])
    portal.quitar()
    expect(document.body.contains(portal.elemento)).toBe(false)
  })
})

describe('moverAlPortal', () => {
  function origen() {
    const o = document.createElement('div')
    o.innerHTML = '<div id="dialogo">d</div><div id="aviso">a</div><div id="otro">o</div>'
    document.body.appendChild(o)
    return o
  }

  test('mueve al portal solo los elementos indicados', () => {
    const o = origen()
    const portal = crearPortal(['ht-root'])
    moverAlPortal(o, portal.elemento, ['#dialogo', '#aviso'])
    expect(portal.elemento.querySelector('#dialogo')).not.toBeNull()
    expect(portal.elemento.querySelector('#aviso')).not.toBeNull()
    expect(o.querySelector('#dialogo')).toBeNull()
    expect(o.querySelector('#otro')).not.toBeNull()
  })

  test('ignora los selectores que no existen en el origen', () => {
    const o = origen()
    const portal = crearPortal(['ht-root'])
    expect(() => moverAlPortal(o, portal.elemento, ['#no-existe', '#dialogo'])).not.toThrow()
    expect(portal.elemento.children).toHaveLength(1)
  })

  test('conserva los listeners y el estado de los elementos movidos', () => {
    const o = origen()
    let clics = 0
    o.querySelector('#dialogo')?.addEventListener('click', () => { clics++ })
    const portal = crearPortal(['ht-root'])
    moverAlPortal(o, portal.elemento, ['#dialogo'])
    ;(portal.elemento.querySelector('#dialogo') as HTMLElement).click()
    expect(clics).toBe(1)
  })
})
