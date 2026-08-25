import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode, HTMLAttributes } from 'react'
import GestionDocumentos from '@/pages/admin/GestionDocumentos'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/hooks/useDocumentos', () => ({
  useDocumentosList:   vi.fn(),
  useCreateDocumento:  vi.fn(),
  useUpdateDocumento:  vi.fn(),
  useDeleteDocumento:  vi.fn(),
}))
import {
  useDocumentosList, useCreateDocumento, useUpdateDocumento, useDeleteDocumento,
} from '@/hooks/useDocumentos'

vi.mock('@/hooks/useCategorias', () => ({
  useCategoriasList: () => ({ data: [] }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useDocumentosList).mockReturnValue({
    data: { data: [], meta: { total: 0 } }, isLoading: false, isError: false,
  } as unknown as ReturnType<typeof useDocumentosList>)
  vi.mocked(useCreateDocumento).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useCreateDocumento>)
  vi.mocked(useUpdateDocumento).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdateDocumento>)
  vi.mocked(useDeleteDocumento).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useDeleteDocumento>)
})

async function openCreateModal() {
  const user = userEvent.setup()
  render(<GestionDocumentos />)
  await user.click(screen.getAllByRole('button', { name: /Ingresar nuevo documento/i })[0])
  return user
}

describe('GestionDocumentos — validación del formulario', () => {
  test('nombre, categoría y archivo son obligatorios al crear', async () => {
    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: /Registrar documento/i }))

    expect(await screen.findByText('El nombre del documento es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Selecciona o escribe una categoría')).toBeInTheDocument()
    expect(screen.getByText('Debes seleccionar el archivo del documento para continuar')).toBeInTheDocument()
  })

  test('no llama a la mutación de creación mientras haya errores de validación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateDocumento).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateDocumento>)

    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: /Registrar documento/i }))

    expect(await screen.findByText('El nombre del documento es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

describe('GestionDocumentos — guarda de doble envío', () => {
  test('deshabilita Cancelar y Registrar mientras la mutación está en curso', async () => {
    vi.mocked(useCreateDocumento).mockReturnValue({
      mutateAsync: vi.fn(), isPending: true,
    } as unknown as ReturnType<typeof useCreateDocumento>)

    await openCreateModal()

    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Registrando…/i })).toBeDisabled()
  })
})
