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
  useDeleteCategoria: vi.fn(),
}))
import {
  useCategoriasList, useCreateCategoria, useUploadCategoriaThumbnail, useDeleteCategoria,
} from '@/hooks/useCategorias'

vi.mock('@/hooks/useDocumentos', () => ({ useDocumentosList: vi.fn() }))
import { useDocumentosList } from '@/hooks/useDocumentos'

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
  vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)
  vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)
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
