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

  async function cargarCsv(container: HTMLElement, contenido: string) {
    await waitFor(() => expect(container.querySelector('#file-excel')).not.toBeNull())
    const input = container.querySelector('#file-excel') as HTMLInputElement
    const archivo = new File([contenido], 'datos.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [archivo] } })
    await waitFor(() => expect((container.querySelector('#overlay-columnas') as HTMLElement).style.display).toBe('flex'))
  }

  test('acepta .csv: propone grados y preselecciona la columna de municipio', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await cargarCsv(container, 'ID,Municipio,Latitud,Longitud\n1,Quibdó,5.69,-76.65\n2,Tadó,5.27,-76.56\n')
    expect((container.querySelector('#sel-col-muni') as HTMLSelectElement).value).toBe('Municipio')
    expect((container.querySelector('#sel-sistema') as HTMLSelectElement).value).toBe('wgs84')
    expect(container.querySelector('#lbl-col-lat')?.textContent).toBe('Columna de latitud')
  })

  test('con valores planos propone MAGNA-SIRGAS Oeste y rotula Norte/Este', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await cargarCsv(container, 'ID,Norte,Este\n1,1121182.85,1046437.87\n2,1123183.57,1045000.12\n')
    expect((container.querySelector('#sel-sistema') as HTMLSelectElement).value).toBe('oeste')
    expect(container.querySelector('#lbl-col-lat')?.textContent).toBe('Columna Norte (Y)')
    expect(container.querySelector('#lbl-col-lon')?.textContent).toBe('Columna Este (X)')
  })

  test('cambiar el sistema de coordenadas actualiza los rótulos', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await cargarCsv(container, 'ID,Latitud,Longitud\n1,5.69,-76.65\n2,5.27,-76.56\n')
    const sistema = container.querySelector('#sel-sistema') as HTMLSelectElement
    fireEvent.change(sistema, { target: { value: 'utm18n' } })
    expect(container.querySelector('#lbl-col-lon')?.textContent).toBe('Columna Este (X)')
    fireEvent.change(sistema, { target: { value: 'wgs84' } })
    expect(container.querySelector('#lbl-col-lon')?.textContent).toBe('Columna de longitud')
  })

  test('confirmar marca un municipio declarado que no coincide con el detectado', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await cargarCsv(container, 'ID,Municipio,Latitud,Longitud\n1,Quibdó,5.6919,-76.6583\n2,Tadó,5.7100,-76.6700\n3,Quibdo,5.6930,-76.6600\n')
    fireEvent.click(container.querySelector('#btn-confirmar-columnas') as HTMLElement)
    await waitFor(() => expect(container.querySelectorAll('#tableWrap tbody tr').length).toBe(3))
    await waitFor(() => expect(container.querySelector('#tableWrap tbody')?.textContent).toMatch(/Municipio declarado no coincide/))
    expect(container.querySelector('#tableWrap tbody')?.textContent?.match(/Municipio declarado no coincide/g)).toHaveLength(1)
  })

  test('hay un único botón para cargar archivos y la pista de carga no trae botones propios', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('#btn-cargar-excel')).not.toBeNull())
    const botonesDeCarga = Array.from(container.querySelectorAll('button')).filter((b) => /^\s*Cargar/i.test(b.textContent ?? ''))
    expect(botonesDeCarga).toHaveLength(1)
    expect(container.querySelector('#vc-vacio button')).toBeNull()
  })

  test('plantilla y exportar viven juntos en la barra de acciones', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('.bar #btn-plantilla')).not.toBeNull())
    expect(container.querySelector('.bar #btn-exportar')).not.toBeNull()
    expect(container.querySelector('.bar #btn-cargar-excel')).not.toBeNull()
  })

  test('los chips de origen se activan por clase, sin estilos en línea', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(container.querySelector('.chip-origen')).not.toBeNull())
    const chips = Array.from(container.querySelectorAll<HTMLElement>('.chip-origen'))
    fireEvent.click(chips[1])
    expect(chips[1].classList.contains('activo')).toBe(true)
    expect(chips[0].classList.contains('activo')).toBe(false)
    expect(chips.every((c) => !c.getAttribute('style'))).toBe(true)
  })

  test('el pie ya no repite las columnas de latitud y longitud del estado de carga', async () => {
    const { container } = render(<ValidadorCoordenadas />)
    await cargarCsv(container, 'ID,Latitud,Longitud\n1,5.69,-76.65\n2,5.27,-76.56\n')
    fireEvent.click(container.querySelector('#btn-confirmar-columnas') as HTMLElement)
    await waitFor(() => expect(container.querySelector('#foot')?.textContent).toMatch(/Última actualización/))
    expect(container.querySelector('#foot')?.textContent).not.toMatch(/lat:|lon:/)
    expect(container.querySelector('#estado-datos')?.textContent).toMatch(/lat: Latitud/)
  })
})
