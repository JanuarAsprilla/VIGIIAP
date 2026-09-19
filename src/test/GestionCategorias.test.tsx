import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import GestionCategorias from '@/pages/admin/GestionCategorias'

vi.mock('framer-motion', () => {
  const cache = new Map<string, (p: Record<string, unknown>) => ReactNode>()
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        cache.set(tag, ({ children, ...p }: Record<string, unknown>) => createElement(tag, p, children as ReactNode))
      }
      return cache.get(tag)
    },
  })
  return { motion, AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</> }
})

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/hooks/useCategorias', () => ({
  useCategoriasList: vi.fn(),
  useCreateCategoria: vi.fn(),
  useUploadCategoriaThumbnail: vi.fn(),
  useRenameCategoria: vi.fn(),
  useDeleteCategoria: vi.fn(),
}))
import {
  useCategoriasList, useCreateCategoria, useUploadCategoriaThumbnail, useRenameCategoria, useDeleteCategoria,
} from '@/hooks/useCategorias'

vi.mock('@/hooks/useDocumentos', () => ({ useDocumentosList: vi.fn() }))
import { useDocumentosList } from '@/hooks/useDocumentos'

vi.mock('@/hooks/useMapas', () => ({ useMapasList: vi.fn() }))
import { useMapasList } from '@/hooks/useMapas'

vi.mock('@/hooks/useGeovisores', () => ({ useGeovisoresList: vi.fn() }))
import { useGeovisoresList } from '@/hooks/useGeovisores'

function makeCategoria(overrides: Record<string, unknown> = {}) {
  return { nombre: 'Protocolos', descripcion: '', thumbnail_url: null, activo: true, ...overrides }
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
  URL.revokeObjectURL = vi.fn()
  vi.mocked(useCategoriasList).mockReturnValue({
    data: [makeCategoria()], isLoading: false,
  } as unknown as ReturnType<typeof useCategoriasList>)
  vi.mocked(useDocumentosList).mockReturnValue({
    data: { data: [] },
  } as unknown as ReturnType<typeof useDocumentosList>)
  vi.mocked(useMapasList).mockReturnValue({
    data: { data: [] },
  } as unknown as ReturnType<typeof useMapasList>)
  vi.mocked(useGeovisoresList).mockReturnValue({
    data: { data: [] },
  } as unknown as ReturnType<typeof useGeovisoresList>)
  vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)
  vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)
  vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)
  vi.mocked(useDeleteCategoria).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteCategoria>)
})

describe('GestionCategorias — crear categoría', () => {
  test('un nombre vacío muestra error y no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('con nombre válido llama a la mutación con el nombre recortado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ nombre: 'Informes Técnicos' })
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.type(screen.getByLabelText(/Nombre/i), '  Informes Técnicos  ')
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(mutateAsync).toHaveBeenCalledWith('Informes Técnicos')
  })

  test('un error del servidor al crear muestra el mensaje sin cerrar el formulario', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Ya existe una categoría con ese nombre'))
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.type(screen.getByLabelText(/Nombre/i), 'Protocolos')
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(await screen.findByText('Ya existe una categoría con ese nombre')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument()
  })
})

describe('GestionCategorias — renombrar categoría', () => {
  test('abre el modal con el nombre actual precargado y llama a la mutación con el nuevo nombre', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))

    expect(screen.getByLabelText(/Nuevo nombre/i)).toHaveValue('Protocolos')

    await user.clear(screen.getByLabelText(/Nuevo nombre/i))
    await user.type(screen.getByLabelText(/Nuevo nombre/i), 'Protocolos Ambientales')
    await user.click(screen.getByRole('button', { name: /^Renombrar$/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ nombre: 'Protocolos', nuevoNombre: 'Protocolos Ambientales' })
    expect(await screen.findByText('Categoría renombrada a "Protocolos Ambientales"')).toBeInTheDocument()
  })

  test('un nombre vacío muestra error y no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))
    await user.clear(screen.getByLabelText(/Nuevo nombre/i))
    await user.click(screen.getByRole('button', { name: /^Renombrar$/i }))

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('si el nombre no cambió, cierra el modal sin llamar a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))
    await user.click(screen.getByRole('button', { name: /^Renombrar$/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('un error del servidor (nombre duplicado) se muestra sin cerrar el modal', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Ya existe una categoría con ese nombre'))
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))
    await user.clear(screen.getByLabelText(/Nuevo nombre/i))
    await user.type(screen.getByLabelText(/Nuevo nombre/i), 'Hidrología')
    await user.click(screen.getByRole('button', { name: /^Renombrar$/i }))

    expect(await screen.findByText('Ya existe una categoría con ese nombre')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nuevo nombre/i)).toBeInTheDocument()
  })

  test('cancelar no llama a la mutación de renombrado', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByLabelText(/Nuevo nombre/i)).not.toBeInTheDocument()
  })
})

describe('GestionCategorias — eliminar categoría', () => {
  test('confirmar la eliminación llama a la mutación con el nombre correcto', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Eliminar categoría'))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(mutateAsync).toHaveBeenCalledWith('Protocolos')
  })

  test('cancelar no llama a la mutación de borrado', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useDeleteCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Eliminar categoría'))
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('si el servidor rechaza la eliminación, muestra un toast de error', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useDeleteCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Eliminar categoría'))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(await screen.findByText('No se pudo eliminar la categoría')).toBeInTheDocument()
  })
})

describe('GestionCategorias — listado', () => {
  test('estado vacío ofrece crear la primera categoría', () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    render(<GestionCategorias />)
    expect(screen.getByText('No hay categorías')).toBeInTheDocument()
  })

  test('cuenta los documentos por categoría, usando tipo como respaldo', () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [makeCategoria({ nombre: 'Protocolos' }), makeCategoria({ nombre: 'Hidrología' })], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [
        { categoria: 'Protocolos', tipo: 'PDF' },
        { categoria: 'Protocolos', tipo: 'PDF' },
        { categoria: null, tipo: 'Hidrología' },
      ] },
    } as unknown as ReturnType<typeof useDocumentosList>)

    render(<GestionCategorias />)
    expect(screen.getByText('2 docs')).toBeInTheDocument()
    expect(screen.getByText('1 doc')).toBeInTheDocument()
  })

  // Regresión: la tabla categorias es compartida entre documentos, mapas y
  // geovisores -- una categoría con 0 documentos pero mapas/geovisores no
  // debe leerse como "vacía".
  test('suma mapas y geovisores al conteo, no solo documentos', () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [makeCategoria({ nombre: 'Hidrología' }), makeCategoria({ nombre: 'Geología' })], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [] }, // sin documentos en ninguna categoría
    } as unknown as ReturnType<typeof useDocumentosList>)
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [{ categoria: 'Hidrología' }, { categoria: 'Hidrología' }] },
    } as unknown as ReturnType<typeof useMapasList>)
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: { data: [{ categoria: 'Geología' }] },
    } as unknown as ReturnType<typeof useGeovisoresList>)

    render(<GestionCategorias />)
    expect(screen.getByText('2 mapas')).toBeInTheDocument()
    expect(screen.getByText('1 geovisor')).toBeInTheDocument()
    // ninguna de las dos categorías tiene documentos -- el badge no debe mencionarlos
    expect(screen.queryByText(/^\d+ docs?$/)).not.toBeInTheDocument()
  })

  test('una categoría sin documentos, mapas ni geovisores muestra "0 elementos"', () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [makeCategoria({ nombre: 'Sin uso' })], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    render(<GestionCategorias />)
    expect(screen.getByText('0 elementos')).toBeInTheDocument()
  })
})

describe('GestionCategorias — filtro por módulo', () => {
  function setupTresCategorias() {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [
        makeCategoria({ nombre: 'Hidrología' }),
        makeCategoria({ nombre: 'Geología' }),
        makeCategoria({ nombre: 'Sin uso' }),
      ], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [] },
    } as unknown as ReturnType<typeof useDocumentosList>)
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [{ categoria: 'Hidrología' }] },
    } as unknown as ReturnType<typeof useMapasList>)
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: { data: [{ categoria: 'Geología' }] },
    } as unknown as ReturnType<typeof useGeovisoresList>)
  }

  test('filtrar por Geovisores solo muestra la categoría con al menos un geovisor', async () => {
    setupTresCategorias()
    const user = userEvent.setup()
    render(<GestionCategorias />)

    await user.click(screen.getByRole('button', { name: 'Geovisores' }))

    expect(screen.getByText('Geología')).toBeInTheDocument()
    expect(screen.queryByText('Hidrología')).not.toBeInTheDocument()
    expect(screen.queryByText('Sin uso')).not.toBeInTheDocument()
  })

  test('filtrar por Mapas solo muestra la categoría con al menos un mapa', async () => {
    setupTresCategorias()
    const user = userEvent.setup()
    render(<GestionCategorias />)

    await user.click(screen.getByRole('button', { name: 'Mapas' }))

    expect(screen.getByText('Hidrología')).toBeInTheDocument()
    expect(screen.queryByText('Geología')).not.toBeInTheDocument()
  })

  test('volver a "Todas" quita el filtro', async () => {
    setupTresCategorias()
    const user = userEvent.setup()
    render(<GestionCategorias />)

    await user.click(screen.getByRole('button', { name: 'Mapas' }))
    await user.click(screen.getByRole('button', { name: 'Todas' }))

    expect(screen.getByText('Hidrología')).toBeInTheDocument()
    expect(screen.getByText('Geología')).toBeInTheDocument()
    expect(screen.getByText('Sin uso')).toBeInTheDocument()
  })

  test('un filtro sin ninguna categoría coincidente muestra el estado vacío específico', async () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [makeCategoria({ nombre: 'Sin uso' })], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)
    vi.mocked(useDocumentosList).mockReturnValue({ data: { data: [] } } as unknown as ReturnType<typeof useDocumentosList>)
    vi.mocked(useMapasList).mockReturnValue({ data: { data: [] } } as unknown as ReturnType<typeof useMapasList>)
    vi.mocked(useGeovisoresList).mockReturnValue({ data: { data: [] } } as unknown as ReturnType<typeof useGeovisoresList>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: 'Documentos' }))

    expect(screen.getByText('Ninguna categoría tiene documentos todavía.')).toBeInTheDocument()
  })

  test('hacer clic de nuevo en el mismo filtro lo quita (toggle)', async () => {
    setupTresCategorias()
    const user = userEvent.setup()
    render(<GestionCategorias />)

    await user.click(screen.getByRole('button', { name: 'Geovisores' }))
    await user.click(screen.getByRole('button', { name: 'Geovisores' }))

    expect(screen.getByText('Hidrología')).toBeInTheDocument()
    expect(screen.getByText('Sin uso')).toBeInTheDocument()
  })
})

describe('GestionCategorias — imagen de portada al crear', () => {
  function getDropzoneInput(container: HTMLElement) {
    const inputs = container.querySelectorAll('input[type="file"]')
    return inputs[inputs.length - 1] as HTMLInputElement
  }

  test('soltar una imagen en el formulario de nueva categoría la incluye en la creación', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ nombre: 'Sensores' })
    const uploadMutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)
    vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: uploadMutateAsync, isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)

    const user = userEvent.setup()
    const { container } = render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.type(screen.getByLabelText(/Nombre/i), 'Sensores')

    const img = new File(['x'], 'portada.png', { type: 'image/png' })
    const input = getDropzoneInput(container)
    fireEvent.drop(input.closest('div')!, { dataTransfer: { files: [img] } })
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(mutateAsync).toHaveBeenCalledWith('Sensores')
    expect(uploadMutateAsync).toHaveBeenCalledWith({ nombre: 'Sensores', file: img })
    expect(await screen.findByText('Categoría "Sensores" creada')).toBeInTheDocument()
  })
})

describe('GestionCategorias — imagen de portada en una tarjeta existente', () => {
  function getCardDropzoneInput(container: HTMLElement) {
    return container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement
  }

  test('subir una imagen a una categoría existente llama a la mutación y notifica', async () => {
    const uploadMutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: uploadMutateAsync, isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)

    const user = userEvent.setup()
    const { container } = render(<GestionCategorias />)

    const img = new File(['x'], 'nueva-portada.png', { type: 'image/png' })
    const input = getCardDropzoneInput(container)
    fireEvent.drop(input.closest('div')!, { dataTransfer: { files: [img] } })
    await user.click(screen.getByText('Guardar imagen'))

    expect(uploadMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Protocolos', file: img }))
    expect(await screen.findByText('Imagen de "Protocolos" actualizada')).toBeInTheDocument()
  })

  test('si la subida de imagen falla, muestra el error inline en la tarjeta', async () => {
    const uploadMutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: uploadMutateAsync, isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)

    const user = userEvent.setup()
    const { container } = render(<GestionCategorias />)

    const img = new File(['x'], 'nueva-portada.png', { type: 'image/png' })
    const input = getCardDropzoneInput(container)
    fireEvent.drop(input.closest('div')!, { dataTransfer: { files: [img] } })
    await user.click(screen.getByText('Guardar imagen'))

    expect(await screen.findByText('No se pudo subir la imagen. Intenta de nuevo.')).toBeInTheDocument()
  })
})
