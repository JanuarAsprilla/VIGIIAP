import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode, HTMLAttributes } from 'react'
import GestionMapas from '@/pages/admin/GestionMapas'

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

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: () => ({
    getTotalSize: () => 0,
    getVirtualItems: () => [],
    measureElement: () => {},
    options: { scrollMargin: 0 },
  }),
}))

vi.mock('@/hooks/useMapas', () => ({
  useMapasList:        vi.fn(),
  useCreateMapa:       vi.fn(),
  useUpdateMapa:       vi.fn(),
  useToggleMapaActivo: vi.fn(),
  useDeleteMapa:       vi.fn(),
}))
import {
  useMapasList, useCreateMapa, useUpdateMapa, useToggleMapaActivo, useDeleteMapa,
} from '@/hooks/useMapas'

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn(() => ({
      matches: false, media: '', onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  })

  vi.mocked(useMapasList).mockReturnValue({
    data: { data: [], meta: { total: 0 } }, isLoading: false, isError: false,
  } as unknown as ReturnType<typeof useMapasList>)
  vi.mocked(useCreateMapa).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useCreateMapa>)
  vi.mocked(useUpdateMapa).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdateMapa>)
  vi.mocked(useToggleMapaActivo).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useToggleMapaActivo>)
  vi.mocked(useDeleteMapa).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useDeleteMapa>)
})

async function openCreateModal() {
  const user = userEvent.setup()
  render(<GestionMapas />)
  await user.click(screen.getByRole('button', { name: /Ingresar nuevo mapa/i }))
  return user
}

describe('GestionMapas — validación del formulario', () => {
  test('nombre, temática y archivo son obligatorios para un mapa nuevo en formato PDF', async () => {
    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(await screen.findByText('El nombre del mapa es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Selecciona o escribe una temática')).toBeInTheDocument()
    expect(screen.getByText('Debes seleccionar el archivo del mapa para continuar')).toBeInTheDocument()
  })

  test('el formato Geovisor no exige archivo, pero sí la URL', async () => {
    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: 'Geovisor' }))
    await user.type(screen.getByLabelText(/Nombre del mapa/i), 'Mapa geovisor de prueba')
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(await screen.findByText('Debes ingresar la URL del Geovisor')).toBeInTheDocument()
    expect(screen.queryByText('Debes seleccionar el archivo del mapa para continuar')).not.toBeInTheDocument()
  })

  test('no llama a la mutación de creación mientras haya errores de validación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateMapa>)

    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(await screen.findByText('El nombre del mapa es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('con nombre, temática y URL válidos, el envío llega a la mutación con un año dentro de rango', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateMapa>)

    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: 'Geovisor' }))
    await user.type(screen.getByLabelText(/Nombre del mapa/i), 'Mapa geovisor de prueba')
    await user.type(screen.getByPlaceholderText('Selecciona o crea una temática…'), 'Cartografía')
    await user.type(screen.getByLabelText(/URL del Geovisor/i), 'https://geovisor.iiap.org.co/mapa')
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(mutateAsync).toHaveBeenCalled()
  })

  test('con datos por lo demás válidos, un año fuera del rango 1900–2100 no debe bloquear el envío en silencio', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateMapa>)

    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: 'Geovisor' }))
    await user.type(screen.getByLabelText(/Nombre del mapa/i), 'Mapa geovisor de prueba')
    await user.type(screen.getByPlaceholderText('Selecciona o crea una temática…'), 'Cartografía')
    await user.type(screen.getByLabelText(/URL del Geovisor/i), 'https://geovisor.iiap.org.co/mapa')
    await user.clear(screen.getByLabelText('Año'))
    await user.type(screen.getByLabelText('Año'), '1500')
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(mutateAsync).toHaveBeenCalled()
  })
})

describe('GestionMapas — guarda de doble envío', () => {
  test('deshabilita Cancelar y Registrar mientras la mutación está en curso', async () => {
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync: vi.fn(), isPending: true,
    } as unknown as ReturnType<typeof useCreateMapa>)

    await openCreateModal()

    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Registrando…/i })).toBeDisabled()
  })
})
