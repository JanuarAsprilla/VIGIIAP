import { describe, test, expect, vi } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import ValidadorCoordenadas from '@/components/herramientas/validador-coordenadas/ValidadorCoordenadas'

describe('Validador de coordenadas (port fiel del HTML original)', () => {
  test('monta la estructura del original: barra de acciones, formato, filtros, KPIs, mapa y tabla', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#btn-cargar-excel')).not.toBeNull())
    for (const id of ['btn-modo-agregar', 'btn-modo-medir', 'btn-modo-mover', 'btn-exportar', 'fmt-dd', 'fmt-dms', 'fmt-utm', 'f-estado', 'f-depto', 'f-muni', 'map', 'tableWrap']) {
      expect(document.querySelector('#' + id), id).not.toBeNull()
    }
    expect(document.querySelectorAll('.kpi')).toHaveLength(4)
  })

  test('ya no trae título ni conmutador de tema propios: los da la plataforma', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#btn-cargar-excel')).not.toBeNull())
    expect(document.querySelector('h1')).toBeNull()
    expect(document.querySelector('#btn-tema')).toBeNull()
  })

  test('los botones de formato cambian el formato activo', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#fmt-dms')).not.toBeNull())
    fireEvent.click(document.querySelector('#fmt-dms') as HTMLElement)
    expect(document.querySelector('#fmt-dms')?.classList.contains('activo')).toBe(true)
    expect(document.querySelector('#fmt-dd')?.classList.contains('activo')).toBe(false)
  })

  test('el modo agregar puntos se activa y se apaga', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#btn-modo-agregar')).not.toBeNull())
    const boton = document.querySelector('#btn-modo-agregar') as HTMLElement
    fireEvent.click(boton)
    expect(document.querySelector('#txt-modo-agregar')?.textContent).toMatch(/ON/)
    fireEvent.click(boton)
    expect(document.querySelector('#txt-modo-agregar')?.textContent).toMatch(/OFF/)
  })

  test('el despachador ignora acciones que no están publicadas por el motor', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#btn-cargar-excel')).not.toBeNull())
    const alerta = vi.spyOn(window, 'alert').mockImplementation(() => {})
    for (const expr of ['alert(1)', '__noExiste(1)', 'constructor(1)', '__proto__(1)']) {
      const b = document.createElement('button')
      b.setAttribute('data-on-click', expr)
      document.querySelector('.vc-root')?.appendChild(b)
      expect(() => fireEvent.click(b)).not.toThrow()
    }
    expect(alerta).not.toHaveBeenCalled()
  })

  test('al desmontar libera el mapa y el DOM', async () => {
    const { unmount } = render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('.leaflet-container')).not.toBeNull())
    const raiz = document.querySelector('.vc-root') as HTMLElement
    expect(document.querySelectorAll('.vc-root')).toHaveLength(2)
    unmount()
    expect(raiz.innerHTML).toBe('')
    expect(document.querySelector('#overlay-columnas')).toBeNull()
    expect(document.querySelector('.vc-root')).toBeNull()
  })

  test('arrastrar un archivo sobre la herramienta muestra la zona de soltar y al salir se quita', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('.vc-root')).not.toBeNull())
    const raiz = document.querySelector('.vc-root') as HTMLElement
    fireEvent.dragOver(raiz, { dataTransfer: { types: ['Files'], files: [] } })
    expect(raiz.classList.contains('vc-arrastrando')).toBe(true)
    fireEvent.dragLeave(raiz, { relatedTarget: document.body })
    expect(raiz.classList.contains('vc-arrastrando')).toBe(false)
  })

  test('soltar un archivo que no es .xlsx muestra un error claro', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('.vc-root')).not.toBeNull())
    const raiz = document.querySelector('.vc-root') as HTMLElement
    const pdf = new File(['x'], 'datos.pdf')
    fireEvent.drop(raiz, { dataTransfer: { types: ['Files'], files: [pdf] } })
    expect(document.querySelector('#errbox')?.textContent).toMatch(/\.xlsx/)
  })

  test('el mapa dibuja el contorno de los municipios objetivo', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelectorAll('.leaflet-overlay-pane path').length).toBe(92))
  })

  async function cargarCsv(contenido: string) {
    await waitFor(() => expect(document.querySelector('#file-excel')).not.toBeNull())
    const input = document.querySelector('#file-excel') as HTMLInputElement
    const archivo = new File([contenido], 'datos.csv', { type: 'text/csv' })
    fireEvent.change(input, { target: { files: [archivo] } })
    await waitFor(() => expect((document.querySelector('#overlay-columnas') as HTMLElement).style.display).toBe('flex'))
  }

  test('hay un único botón para cargar archivos y ya no existe la pista de carga aparte', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#btn-cargar-excel')).not.toBeNull())
    const botonesDeCarga = Array.from(document.querySelectorAll('button')).filter((b) => /^\s*Cargar/i.test(b.textContent ?? ''))
    expect(botonesDeCarga).toHaveLength(1)
    expect(document.querySelector('#vc-vacio')).toBeNull()
    expect(document.body.textContent).not.toMatch(/Arrastra tu Excel \(\.xlsx o \.csv\)/)
  })

  test('el texto de la herramienta invita a cargar o arrastrar el archivo y resalta lo importante', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('.sub')).not.toBeNull())
    const intro = document.querySelector('.sub') as HTMLElement
    expect(intro.textContent).toBe('Carga o arrastra tu archivo Excel, selecciona las columnas correspondientes a latitud y longitud, y valida cada punto para determinar si se encuentra dentro de los límites de los 93 municipios del Chocó Biogeográfico.')
    expect(Array.from(intro.querySelectorAll('strong')).map((s) => s.textContent)).toEqual([
      'Carga o arrastra tu archivo Excel',
      '93 municipios del Chocó Biogeográfico',
    ])
  })

  test('los chips de origen se activan por clase, sin estilos en línea', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('.chip-origen')).not.toBeNull())
    const chips = Array.from(document.querySelectorAll<HTMLElement>('.chip-origen'))
    fireEvent.click(chips[1])
    expect(chips[1].classList.contains('activo')).toBe(true)
    expect(chips[0].classList.contains('activo')).toBe(false)
    expect(chips.every((c) => !c.getAttribute('style'))).toBe(true)
  })

  test('el pie ya no repite las columnas de latitud y longitud del estado de carga', async () => {
    render(<ValidadorCoordenadas />)
    await cargarCsv('ID,Latitud,Longitud\n1,5.69,-76.65\n2,5.27,-76.56\n')
    fireEvent.click(document.querySelector('#btn-confirmar-columnas') as HTMLElement)
    await waitFor(() => expect(document.querySelector('#foot')?.textContent).toMatch(/Última actualización/))
    expect(document.querySelector('#foot')?.textContent).not.toMatch(/lat:|lon:/)
    expect(document.querySelector('#estado-datos')?.textContent).toMatch(/lat: Latitud/)
  })

  test('usa el sistema visual común de las herramientas (ht-root, botón principal compartido)', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#btn-cargar-excel')).not.toBeNull())
    expect(document.querySelector('.vc-root')?.classList.contains('ht-root')).toBe(true)
    expect(document.querySelector('#btn-cargar-excel')?.classList.contains('ht-primario')).toBe(true)
    expect(document.querySelector('#btn-confirmar-columnas')?.classList.contains('ht-primario')).toBe(true)
  })

  test('sin datos el botón de corregir invertidas está oculto y exportar deshabilitado', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#btn-corregir-invertidas')).not.toBeNull())
    expect((document.querySelector('#btn-corregir-invertidas') as HTMLElement).style.display).toBe('none')
    expect((document.querySelector('#btn-exportar') as HTMLButtonElement).disabled).toBe(true)
  })

  test('la barra de acciones ya no trae plantilla; Cargar y Exportar siguen ahí', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('.bar #btn-cargar-excel')).not.toBeNull())
    expect(document.querySelector('#btn-plantilla')).toBeNull()
    expect(document.querySelector('.bar #btn-exportar')).not.toBeNull()
  })

  test('el diálogo de columnas ya no ofrece sistema de coordenadas ni columna de municipio', async () => {
    render(<ValidadorCoordenadas />)
    await cargarCsv('ID,Municipio,Latitud,Longitud\n1,Quibdó,5.69,-76.65\n2,Tadó,5.27,-76.56\n')
    expect(document.querySelector('#sel-sistema')).toBeNull()
    expect(document.querySelector('#sel-col-muni')).toBeNull()
    expect(document.querySelectorAll('#overlay-columnas select')).toHaveLength(2)
  })

  test('resalta las columnas numéricas y atenúa las de texto en la vista previa', async () => {
    render(<ValidadorCoordenadas />)
    await cargarCsv('ID,Especie,Latitud,Longitud\n1,Ave,5.69,-76.65\n2,Rana,5.27,-76.56\n')
    const ths = Array.from(document.querySelectorAll('#col-preview-head th'))
    const clase = (nombre: string) => ths.find((t) => t.textContent === nombre)?.className
    expect(clase('ID')).toBe('vc-col-num')
    expect(clase('Latitud')).toBe('vc-col-num')
    expect(clase('Longitud')).toBe('vc-col-num')
    expect(clase('Especie')).toBe('vc-col-txt')
    const celdasTexto = Array.from(document.querySelectorAll('#col-preview-body td.vc-celda-txt')).map((c) => c.textContent)
    expect(celdasTexto).toEqual(['Ave', 'Rana'])
    expect(document.querySelector('#col-mensaje')?.textContent).toMatch(/resaltadas en verde/)
  })

  test('marca cuál columna es la latitud y cuál la longitud, y se actualiza al cambiar la selección', async () => {
    render(<ValidadorCoordenadas />)
    await cargarCsv('ID,Latitud,Longitud\n1,5.69,-76.65\n2,5.27,-76.56\n')
    const rol = (nombre: string) => (Array.from(document.querySelectorAll('#col-preview-head th')).find((t) => t.textContent === nombre) as HTMLElement).dataset.rol
    expect(rol('Latitud')).toBe('lat')
    expect(rol('Longitud')).toBe('lon')
    expect(rol('ID')).toBeUndefined()
    expect(document.querySelectorAll('#col-preview-body td[data-rol="lat"]')).toHaveLength(2)

    fireEvent.change(document.querySelector('#sel-col-lat') as HTMLSelectElement, { target: { value: 'ID' } })
    expect(rol('ID')).toBe('lat')
    expect(rol('Latitud')).toBeUndefined()

    fireEvent.change(document.querySelector('#sel-col-lon') as HTMLSelectElement, { target: { value: 'ID' } })
    expect(rol('ID')).toBe('conflicto')
  })

  test('trae el aviso de carga accesible y oculto de entrada', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#vc-cargando')).not.toBeNull())
    const aviso = document.querySelector('#vc-cargando') as HTMLElement
    expect(aviso.style.display).toBe('none')
    expect(aviso.getAttribute('role')).toBe('status')
    expect(aviso.getAttribute('aria-live')).toBe('polite')
    expect(document.querySelector('#vc-cargando-titulo')?.textContent).toMatch(/Cargando/)
  })

  test('el aviso de carga se oculta cuando el archivo ya se leyó y cuando termina la validación', async () => {
    render(<ValidadorCoordenadas />)
    await cargarCsv('ID,Latitud,Longitud\n1,5.69,-76.65\n2,5.27,-76.56\n')
    const aviso = () => (document.querySelector('#vc-cargando') as HTMLElement).style.display
    await waitFor(() => expect(aviso()).toBe('none'))
    fireEvent.click(document.querySelector('#btn-confirmar-columnas') as HTMLElement)
    await waitFor(() => expect(aviso()).toBe('flex'))
    expect(document.querySelector('#vc-cargando-titulo')?.textContent).toMatch(/Validando/)
    await waitFor(() => expect(document.querySelectorAll('#tableWrap tbody tr').length).toBe(2))
    await waitFor(() => expect(aviso()).toBe('none'), { timeout: 3000 })
    expect((document.querySelector('#btn-exportar') as HTMLButtonElement).disabled).toBe(false)
  })

  test('un archivo que no se puede procesar muestra el error y no deja el aviso de carga puesto', async () => {
    render(<ValidadorCoordenadas />)
    await waitFor(() => expect(document.querySelector('#file-excel')).not.toBeNull())
    const input = document.querySelector('#file-excel') as HTMLInputElement
    fireEvent.change(input, { target: { files: [new File(['no es excel'], 'malo.xlsx')] } })
    await waitFor(() => expect(document.querySelector('#errbox')?.textContent).toMatch(/No se pudo procesar/))
    await waitFor(() => expect((document.querySelector('#vc-cargando') as HTMLElement).style.display).toBe('none'), { timeout: 3000 })
  })

  test('cerrar la herramienta a media validación no provoca errores', async () => {
    const errores: unknown[] = []
    const alError = (e: PromiseRejectionEvent | ErrorEvent) => errores.push(e)
    window.addEventListener('unhandledrejection', alError)
    window.addEventListener('error', alError)

    const { unmount } = render(<ValidadorCoordenadas />)
    await cargarCsv('ID,Latitud,Longitud\n1,5.69,-76.65\n2,5.27,-76.56\n')
    fireEvent.click(document.querySelector('#btn-confirmar-columnas') as HTMLElement)
    unmount()
    await new Promise((r) => setTimeout(r, 600))

    window.removeEventListener('unhandledrejection', alError)
    window.removeEventListener('error', alError)
    expect(errores).toHaveLength(0)
  })
})
