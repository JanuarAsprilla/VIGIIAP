import { describe, test, expect, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import ValidadorCoordenadas from '@/components/herramientas/validador-coordenadas/ValidadorCoordenadas'

describe('Validador de coordenadas (port fiel del HTML original)', () => {
  test('monta la estructura del original: barra de acciones, formato, filtros, KPIs, mapa y tabla', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('#btn-cargar-excel')).not.toBeNull())
    for (const id of ['btn-modo-agregar', 'btn-modo-medir', 'btn-modo-mover', 'btn-exportar', 'fmt-dd', 'fmt-dms', 'fmt-utm', 'f-estado', 'f-depto', 'f-muni', 'map', 'tableWrap']) {
      expect(container.querySelector('#' + id), id).not.toBeNull()
    }
    expect(container.querySelectorAll('.kpi')).toHaveLength(4)
  })

  test('ya no trae título ni conmutador de tema propios: los da la plataforma', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('#btn-cargar-excel')).not.toBeNull())
    expect(container.querySelector('h1')).toBeNull()
    expect(container.querySelector('#btn-tema')).toBeNull()
  })

  test('los botones de formato cambian el formato activo', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('#fmt-dms')).not.toBeNull())
    fireEvent.click(container.querySelector('#fmt-dms') as HTMLElement)
    expect(container.querySelector('#fmt-dms')?.classList.contains('activo')).toBe(true)
    expect(container.querySelector('#fmt-dd')?.classList.contains('activo')).toBe(false)
  })

  test('el modo agregar puntos se activa y se apaga', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('#btn-modo-agregar')).not.toBeNull())
    const boton = container.querySelector('#btn-modo-agregar') as HTMLElement
    fireEvent.click(boton)
    expect(container.querySelector('#txt-modo-agregar')?.textContent).toMatch(/ON/)
    fireEvent.click(boton)
    expect(container.querySelector('#txt-modo-agregar')?.textContent).toMatch(/OFF/)
  })

  test('el despachador ignora acciones que no están publicadas por el motor', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('#btn-cargar-excel')).not.toBeNull())
    const alerta = vi.spyOn(window, 'alert').mockImplementation(() => {})
    for (const expr of ['alert(1)', '__noExiste(1)', 'constructor(1)', '__proto__(1)']) {
      const b = document.createElement('button')
      b.setAttribute('data-on-click', expr)
      container.querySelector('.vc-root')?.appendChild(b)
      expect(() => fireEvent.click(b)).not.toThrow()
    }
    expect(alerta).not.toHaveBeenCalled()
  })

  test('al desmontar libera el mapa y el DOM', async () => {
    const { container, unmount } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('.leaflet-container')).not.toBeNull())
    const raiz = container.querySelector('.vc-root') as HTMLElement
    unmount()
    expect(raiz.innerHTML).toBe('')
  })

  test('sin datos muestra el estado vacío con la plantilla y el botón de corregir invertidas oculto', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('#vc-vacio')).not.toBeNull())
    expect((container.querySelector('#vc-vacio') as HTMLElement).hidden).toBe(false)
    expect(container.querySelector('#btn-plantilla')).not.toBeNull()
    expect((container.querySelector('#btn-corregir-invertidas') as HTMLElement).style.display).toBe('none')
  })

  test('arrastrar un archivo sobre la herramienta muestra la zona de soltar y al salir se quita', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('.vc-root')).not.toBeNull())
    const raiz = container.querySelector('.vc-root') as HTMLElement
    fireEvent.dragOver(raiz, { dataTransfer: { types: ['Files'], files: [] } })
    expect(raiz.classList.contains('vc-arrastrando')).toBe(true)
    fireEvent.dragLeave(raiz, { relatedTarget: document.body })
    expect(raiz.classList.contains('vc-arrastrando')).toBe(false)
  })

  test('soltar un archivo que no es .xlsx muestra un error claro', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('.vc-root')).not.toBeNull())
    const raiz = container.querySelector('.vc-root') as HTMLElement
    const pdf = new File(['x'], 'datos.pdf')
    fireEvent.drop(raiz, { dataTransfer: { types: ['Files'], files: [pdf] } })
    expect(container.querySelector('#errbox')?.textContent).toMatch(/\.xlsx/)
  })

  test('el mapa dibuja el contorno de los municipios objetivo', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelectorAll('.leaflet-overlay-pane path').length).toBe(92))
  })
})
