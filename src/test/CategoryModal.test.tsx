import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
      { id: 'd1', name: 'Zonificación 2025', type: 'pdf', size: '1MB', updated: '01/01/2026', dateISO: '2026-01-01', url: '/f1.pdf' },
      { id: 'd2', name: 'Alturas del Chocó', type: 'xlsx', size: '2MB', updated: '02/01/2026', dateISO: '2026-01-02', url: '/f2.pdf' },
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
