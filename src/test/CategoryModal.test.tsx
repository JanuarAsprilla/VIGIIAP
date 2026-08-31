import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CategoryModal } from '@/pages/documentos/CategoryModal'
import type { CategoryItem } from '@/pages/documentos/documentos.utils'

function makeCategory(): CategoryItem {
  return {
    id: 'c1',
    title: 'Cartografía',
    icon: 'MapIcon',
    thumbnail: null,
    docs: [
      { id: 'd1', name: 'Zonificación 2025', type: 'pdf', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/f1.pdf', resumen: '' },
      { id: 'd2', name: 'Alturas del Chocó', type: 'xlsx', size: '2MB', updated: '02/01/2026', dateISO: '2026-01-02', url: '/f2.pdf', resumen: '' },
    ],
  }
}

const onClose = vi.fn()
const onPreview = vi.fn()
const onDownload = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CategoryModal — cierre', () => {
  test('clic en el backdrop cierra el modal', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalled()
  })

  test('el botón X cierra el modal', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.click(screen.getByLabelText('Cerrar'))
    expect(onClose).toHaveBeenCalled()
  })

  test('Escape cierra el modal', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })
})

describe('CategoryModal — búsqueda y orden', () => {
  test('filtra documentos por nombre y actualiza el conteo', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.type(screen.getByPlaceholderText('Buscar documento...'), 'Alturas')
    expect(screen.getByText('Alturas del Chocó')).toBeInTheDocument()
    expect(screen.queryByText('Zonificación 2025')).not.toBeInTheDocument()
    expect(screen.getByText('1 de 2 documentos')).toBeInTheDocument()
  })

  test('sin coincidencias, muestra el estado vacío y permite limpiar la búsqueda', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.type(screen.getByPlaceholderText('Buscar documento...'), 'xyz-inexistente')
    expect(screen.getByText(/No se encontraron documentos/)).toBeInTheDocument()

    await user.click(screen.getByText('Limpiar búsqueda'))
    expect(screen.getByText('Zonificación 2025')).toBeInTheDocument()
  })

  test('ordenar Z-A invierte el orden de los documentos', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.click(screen.getByText('Nombre A–Z'))
    await user.click(screen.getByText('Nombre Z–A'))

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Zonificación 2025')
    expect(rows[1]).toHaveTextContent('Alturas del Chocó')
  })

  test('ordenar por "Más reciente" coloca el documento con fecha más nueva primero', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.click(screen.getByText('Nombre A–Z'))
    await user.click(screen.getByText('Más reciente'))

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Alturas del Chocó')
  })

  test('ordenar por "Más antiguo" coloca el documento con fecha más vieja primero', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.click(screen.getByText('Nombre A–Z'))
    await user.click(screen.getByText('Más antiguo'))

    const rows = screen.getAllByRole('row').slice(1)
    expect(rows[0]).toHaveTextContent('Zonificación 2025')
  })

  test('el ícono X junto al buscador limpia la consulta sin cerrar el modal', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    const input = screen.getByPlaceholderText('Buscar documento...')
    await user.type(input, 'Alturas')

    const clearBtn = input.parentElement!.querySelector('button')!
    await user.click(clearBtn)

    expect(input).toHaveValue('')
    expect(screen.getByText('Zonificación 2025')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })
})

describe('CategoryModal — conteos y categoría desconocida', () => {
  test('sin filtro, el pie muestra el total de documentos en la categoría', () => {
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    expect(screen.getByText('2 documentos en total')).toBeInTheDocument()
  })

  test('con un solo documento, usa el singular "documento" en cabecera y pie', () => {
    const cat = { ...makeCategory(), docs: [makeCategory().docs[0]] }
    render(<CategoryModal category={cat} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    expect(screen.getByText('1 documento en esta categoría')).toBeInTheDocument()
    expect(screen.getByText('1 documento en total')).toBeInTheDocument()
  })

  test('una categoría con ícono y título desconocidos usa el ícono y color por defecto sin romper', () => {
    const cat = { ...makeCategory(), title: 'Categoría Rara', icon: 'IconoInexistente' }
    render(<CategoryModal category={cat} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    expect(screen.getByText('Categoría Rara')).toBeInTheDocument()
  })
})

describe('CategoryModal — trampa de foco (Tab)', () => {
  test('Tab en el último elemento enfocable regresa el foco al primero', () => {
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    const first = screen.getByLabelText('Cerrar')
    const last = screen.getByText('Cerrar')

    last.focus()
    fireEvent.keyDown(last, { key: 'Tab' })
    expect(document.activeElement).toBe(first)
  })

  test('Shift+Tab en el primer elemento enfocable envía el foco al último', () => {
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    const first = screen.getByLabelText('Cerrar')
    const last = screen.getByText('Cerrar')

    first.focus()
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(last)
  })
})

describe('CategoryModal — acciones de fila', () => {
  test('vista previa llama a onPreview con el documento y el título de la categoría', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.click(screen.getAllByTitle('Vista previa')[0])
    expect(onPreview).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alturas del Chocó' }), 'Cartografía')
  })

  test('descargar llama a onDownload con el documento', async () => {
    const user = userEvent.setup()
    render(<CategoryModal category={makeCategory()} onClose={onClose} onPreview={onPreview} onDownload={onDownload} />)
    await user.click(screen.getAllByTitle('Descargar')[0])
    expect(onDownload).toHaveBeenCalledWith(expect.objectContaining({ name: 'Alturas del Chocó' }))
  })
})
