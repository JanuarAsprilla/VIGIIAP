import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
