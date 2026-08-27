import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewModal } from '@/pages/documentos/PreviewModal'
import { SoporteDocumentalModal } from '@/pages/documentos/SoporteModal'
import type { DocItem } from '@/pages/documentos/documentos.utils'

vi.mock('@/pages/documentos/documentos.utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/pages/documentos/documentos.utils')>()
  return { ...actual, forceDownload: vi.fn() }
})
import { forceDownload } from '@/pages/documentos/documentos.utils'

const authMock = { user: null as { name: string; email: string } | null, isAuthenticated: false }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

const onClose = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = null
  authMock.isAuthenticated = false
})

describe('PreviewModal — tipos de archivo', () => {
  test('imagen: renderiza la vista previa embebida', () => {
    const doc: DocItem = { id: 'd1', name: 'Foto.jpg', type: 'jpg', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/foto.jpg' }
    render(<PreviewModal doc={doc} categoryTitle="Cartografía" onClose={onClose} />)
    expect(screen.getByAltText('Foto.jpg')).toHaveAttribute('src', '/foto.jpg')
  })

  test('PDF: ofrece visualizar en pestaña nueva y descargar', async () => {
    const doc: DocItem = { id: 'd1', name: 'Informe.pdf', type: 'pdf', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/informe.pdf' }
    const user = userEvent.setup()
    render(<PreviewModal doc={doc} categoryTitle="Cartografía" onClose={onClose} />)
    expect(screen.getByText('Visualizar PDF')).toHaveAttribute('href', '/informe.pdf')
    await user.click(screen.getByText('Descargar'))
    expect(forceDownload).toHaveBeenCalledWith(expect.stringContaining('/descargar/documento/d1'), 'Informe.pdf.pdf')
  })

  test('office (xlsx): muestra el aviso de no-previsualizable y permite descargar', async () => {
    const doc: DocItem = { id: 'd2', name: 'Datos.xlsx', type: 'xlsx', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/datos.xlsx' }
    const user = userEvent.setup()
    render(<PreviewModal doc={doc} categoryTitle="Cartografía" onClose={onClose} />)
    expect(screen.getByText(/no se pueden previsualizar en el navegador/)).toBeInTheDocument()
    await user.click(screen.getByText('Descargar Excel'))
    expect(forceDownload).toHaveBeenCalledWith(expect.stringContaining('/descargar/documento/d2'), 'Datos.xlsx.xlsx')
  })

  test('sin URL, muestra el estado "archivo no disponible"', () => {
    const doc: DocItem = { id: 'd3', name: 'Perdido.pdf', type: 'pdf', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: null }
    render(<PreviewModal doc={doc} categoryTitle="Cartografía" onClose={onClose} />)
    expect(screen.getByText('Archivo no disponible')).toBeInTheDocument()
  })

  test('Escape y el backdrop cierran el modal', async () => {
    const doc: DocItem = { id: 'd1', name: 'Informe.pdf', type: 'pdf', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/informe.pdf' }
    const user = userEvent.setup()
    render(<PreviewModal doc={doc} categoryTitle="Cartografía" onClose={onClose} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalledTimes(2)
  })

  test('docx: muestra el aviso de no-previsualizable con el ícono de Word y permite descargar', async () => {
    const doc: DocItem = { id: 'd4', name: 'Memoria.docx', type: 'docx', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/memoria.docx' }
    const user = userEvent.setup()
    render(<PreviewModal doc={doc} categoryTitle="Cartografía" onClose={onClose} />)
    expect(screen.getByText(/no se pueden previsualizar en el navegador/)).toBeInTheDocument()
    await user.click(screen.getByText('Descargar Word'))
    expect(forceDownload).toHaveBeenCalledWith(expect.stringContaining('/descargar/documento/d4'), 'Memoria.docx.docx')
  })

  test('tipo no reconocido: no renderiza ninguna vista previa ni acciones de descarga', () => {
    const doc: DocItem = { id: 'd5', name: 'Archivo.zip', type: 'zip', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/archivo.zip' }
    render(<PreviewModal doc={doc} categoryTitle="Cartografía" onClose={onClose} />)
    expect(screen.queryByText('Descargar')).not.toBeInTheDocument()
    expect(screen.queryByText(/no se pueden previsualizar/)).not.toBeInTheDocument()
    expect(screen.getByText('Archivo.zip')).toBeInTheDocument()
  })

  test('trampa de foco: Tab en el último elemento regresa al primero y Shift+Tab hace lo inverso', () => {
    const doc: DocItem = { id: 'd1', name: 'Informe.pdf', type: 'pdf', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/informe.pdf' }
    render(<PreviewModal doc={doc} categoryTitle="Cartografía" onClose={onClose} />)

    const first = screen.getByLabelText('Cerrar')
    const last = screen.getByText('Cerrar')

    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(document.activeElement).toBe(first)

    first.focus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })
})

describe('SoporteDocumentalModal — usuario anónimo', () => {
  test('valida campos requeridos y formato de correo antes de enviar', async () => {
    const user = userEvent.setup()
    render(<SoporteDocumentalModal onClose={onClose} />)
    await user.type(screen.getByLabelText(/Correo/i), 'correo-invalido')
    await user.click(screen.getByText('Enviar Solicitud'))

    expect(screen.getAllByText('Requerido')).toHaveLength(3)
    expect(screen.getByText('Correo no válido')).toBeInTheDocument()
  })

  test('exige un mínimo de 20 caracteres en la descripción', async () => {
    const user = userEvent.setup()
    render(<SoporteDocumentalModal onClose={onClose} />)
    await user.type(screen.getByLabelText(/Nombre/i), 'Ana Restrepo')
    await user.type(screen.getByLabelText(/Correo/i), 'ana@example.com')
    await user.selectOptions(screen.getByLabelText(/Tipo de consulta/i), 'otro')
    await user.type(screen.getByLabelText(/Descripción/i), 'muy corto')
    await user.click(screen.getByText('Enviar Solicitud'))
    expect(screen.getByText('Mínimo 20 caracteres')).toBeInTheDocument()
  })

  test('con datos válidos, muestra la pantalla de confirmación con el correo ingresado', async () => {
    const user = userEvent.setup()
    render(<SoporteDocumentalModal onClose={onClose} />)
    await user.type(screen.getByLabelText(/Nombre/i), 'Ana Restrepo')
    await user.type(screen.getByLabelText(/Correo/i), 'ana@example.com')
    await user.selectOptions(screen.getByLabelText(/Tipo de consulta/i), 'otro')
    await user.type(screen.getByLabelText(/Descripción/i), 'Necesito el shapefile de linderos actualizado del año 2025.')
    await user.click(screen.getByText('Enviar Solicitud'))

    expect(screen.getByText('Solicitud Enviada')).toBeInTheDocument()
    expect(screen.getByText('ana@example.com')).toBeInTheDocument()
  })
})

describe('SoporteDocumentalModal — usuario autenticado', () => {
  test('precarga nombre y correo como campos de solo lectura', () => {
    authMock.isAuthenticated = true
    authMock.user = { name: 'Ana Restrepo', email: 'ana@example.com' }
    render(<SoporteDocumentalModal onClose={onClose} />)
    expect(screen.getByLabelText(/Nombre/i)).toHaveValue('Ana Restrepo')
    expect(screen.getByLabelText(/Nombre/i)).toHaveAttribute('readonly')
    expect(screen.getByLabelText(/Correo/i)).toHaveValue('ana@example.com')
  })
})
