import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

let rol: string | null = null
let modulos: { modulo: string; puede_ver: boolean; puede_editar: boolean }[] | undefined
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: rol ? { rol, modulos } : null }),
}))

const destruidas: number[] = []
vi.mock('chart.js', () => {
  class FakeChart {
    static register = vi.fn()
    constructor() { /* jsdom no implementa canvas */ }
    destroy() { destruidas.push(1) }
    update() {}
  }
  return { Chart: FakeChart, registerables: [] }
})

import PanelChocoBiogeografico from '@/components/herramientas/panel-choco/PanelChocoBiogeografico'

beforeEach(() => {
  destruidas.length = 0
  localStorage.clear()
  rol = null
  modulos = undefined
})

describe('Panel Chocó (port fiel del HTML original)', () => {
  test('monta las 9 capas del original en la barra lateral', async () => {
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelectorAll('.sidebar-nav .side-item')).toHaveLength(9))
    expect(container.querySelector('#side-manglares')).not.toBeNull()
  })

  test('cambiar de capa con el despachador delegado muestra su sección', async () => {
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('#side-titulacion')).not.toBeNull())
    fireEvent.click(container.querySelector('#side-titulacion') as HTMLElement)
    expect((container.querySelector('#seccion-titulacion') as HTMLElement).style.display).not.toBe('none')
    expect(container.querySelector('#side-titulacion')?.classList.contains('active')).toBe(true)
  })

  test('ignora handlers que no están en la lista blanca', async () => {
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('#side-limites')).not.toBeNull())
    const boton = document.createElement('button')
    boton.setAttribute('data-on-click', 'alert(1)')
    container.querySelector('.pc-root')?.appendChild(boton)
    const alerta = vi.spyOn(window, 'alert').mockImplementation(() => {})
    fireEvent.click(boton)
    expect(alerta).not.toHaveBeenCalled()
  })

  test('sin sesión el panel es de solo lectura y no ofrece carga de datos', async () => {
    const { container } = render(<PanelChocoBiogeografico />)
    expect(screen.getByText(/modo solo lectura/i)).toBeInTheDocument()
    await waitFor(() => expect(container.querySelector('.pc-root')?.classList.contains('pc-solo-lectura')).toBe(true))
    fireEvent.click(container.querySelector('.cargar-btn') as HTMLElement)
    expect((container.querySelector('#modal-carga-overlay') as HTMLElement).classList.contains('open')).toBe(false)
  })

  test('el superadministrador puede abrir el modal de carga de datos', async () => {
    rol = 'super_admin'
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('.cargar-btn')).not.toBeNull())
    expect(screen.queryByText(/modo solo lectura/i)).toBeNull()
    fireEvent.click(container.querySelector('.cargar-btn') as HTMLElement)
    expect((container.querySelector('#modal-carga-overlay') as HTMLElement).classList.contains('open')).toBe(true)
  })

  test('un administrador con edición en Herramientas puede cargar datos', async () => {
    rol = 'admin_sig'
    modulos = [{ modulo: 'herramientas', puede_ver: true, puede_editar: true }]
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('.pc-root')?.classList.contains('pc-solo-lectura')).toBe(false))
  })

  test.each([
    ['admin_sig sin el módulo Herramientas', 'admin_sig', undefined],
    ['admin_sig solo con permiso de ver', 'admin_sig', [{ modulo: 'herramientas', puede_ver: true, puede_editar: false }]],
    ['investigador', 'investigador', undefined],
  ])('%s queda en solo lectura', async (_n, r, m) => {
    rol = r
    modulos = m
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('.pc-root')?.classList.contains('pc-solo-lectura')).toBe(true))
  })

  test('el selector de capas es un desplegable que se cierra al elegir una capa', async () => {
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('#capa-toggle')).not.toBeNull())
    const toggle = container.querySelector('#capa-toggle') as HTMLElement
    const lista = container.querySelector('#capa-lista') as HTMLElement
    expect(lista.hidden).toBe(true)
    fireEvent.click(toggle)
    expect(lista.hidden).toBe(false)
    expect(toggle.getAttribute('aria-expanded')).toBe('true')
    fireEvent.click(container.querySelector('#side-poblacion') as HTMLElement)
    expect(lista.hidden).toBe(true)
    expect(container.querySelector('#capa-actual-nombre')?.textContent).toBe('Población')
  })

  test('la nota de la capa activa está en su propio bloque bajo el título', async () => {
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('.nota-slot #nota-panel-wrap')).not.toBeNull())
    fireEvent.click(container.querySelector('#side-poblacion') as HTMLElement)
    expect(container.querySelector('.nota-slot')?.textContent).toMatch(/Censo DANE 2018/)
  })

  test('un rol sin permiso no puede cargar archivos aunque dispare el input', async () => {
    rol = 'visitante'
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('#inp-limites')).not.toBeNull())
    const input = container.querySelector('#inp-limites') as HTMLInputElement
    const archivo = new File(['x'], 'limites.xlsx')
    Object.defineProperty(input, 'files', { value: [archivo], configurable: true })
    fireEvent.change(input)
    expect(container.querySelector('#toast-area')?.children).toHaveLength(0)
  })

  test('al desmontar destruye las gráficas y libera el DOM', async () => {
    const { container, unmount } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('#side-limites')).not.toBeNull())
    const raiz = container.querySelector('.pc-root') as HTMLElement
    unmount()
    expect(destruidas.length).toBeGreaterThan(0)
    expect(raiz.innerHTML).toBe('')
  })

  test('usa el sistema visual común de las herramientas y el botón de carga es el principal compartido', async () => {
    rol = 'super_admin'
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('.cargar-btn')).not.toBeNull())
    expect(container.querySelector('.pc-root')?.classList.contains('ht-root')).toBe(true)
    expect(container.querySelector('.cargar-btn')?.classList.contains('ht-primario')).toBe(true)
  })

  test('ya no repite en el pie que los datos se guardan en el navegador (lo dice el diálogo de carga)', async () => {
    const { container } = render(<PanelChocoBiogeografico />)
    await waitFor(() => expect(container.querySelector('.sidebar-nav')).not.toBeNull())
    expect(container.querySelector('.pc-root > .footer, .pc-root .footer')).toBeNull()
    expect(container.querySelector('.mc-footer')?.textContent).toMatch(/Guardado en el navegador/)
  })
})
