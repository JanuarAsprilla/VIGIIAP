import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import GestionHerramientas from '@/pages/admin/GestionHerramientas'

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

// 'conversor' y 'panel-choco' tienen componente; 'nueva-tool' no -- se usa
// para probar el desplegable de "claves disponibles" al publicar.
vi.mock('@/lib/herramientasRegistro', () => ({
  REGISTRO_HERRAMIENTAS: {
    conversor:     { Component: () => null },
    'panel-choco': { Component: () => null, focusable: true },
    'nueva-tool':  { Component: () => null },
  },
}))

vi.mock('@/hooks/useHerramientas', () => ({
  useHerramientasList: vi.fn(),
  useCrearHerramienta: vi.fn(),
  useActualizarHerramienta: vi.fn(),
  useReordenarHerramientas: vi.fn(),
  useEliminarHerramienta: vi.fn(),
}))
import {
  useHerramientasList, useCrearHerramienta, useActualizarHerramienta,
  useReordenarHerramientas, useEliminarHerramienta,
} from '@/hooks/useHerramientas'

function makeHerramienta(overrides: Record<string, unknown> = {}) {
  return { clave: 'conversor', titulo: 'Conversor de Coordenadas', descripcion: null, tag: 'Geodésico', activa: true, orden: 0, ...overrides }
}

const HERRAMIENTAS_BASE = [
  makeHerramienta(),
  makeHerramienta({ clave: 'panel-choco', titulo: 'Panel Chocó', tag: 'Reportes', orden: 1 }),
]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useHerramientasList).mockReturnValue({ data: HERRAMIENTAS_BASE, isLoading: false } as unknown as ReturnType<typeof useHerramientasList>)
  vi.mocked(useCrearHerramienta).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCrearHerramienta>)
  vi.mocked(useActualizarHerramienta).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useActualizarHerramienta>)
  vi.mocked(useReordenarHerramientas).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useReordenarHerramientas>)
  vi.mocked(useEliminarHerramienta).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useEliminarHerramienta>)
})

describe('GestionHerramientas — listado', () => {
  test('muestra las herramientas registradas ordenadas', () => {
    render(<GestionHerramientas />)
    expect(screen.getByText('Conversor de Coordenadas')).toBeInTheDocument()
    expect(screen.getByText('Panel Chocó')).toBeInTheDocument()
    expect(screen.getByText('2 herramientas registradas')).toBeInTheDocument()
  })

  test('marca "Sin componente" cuando la clave no está en el registro frontend', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: [...HERRAMIENTAS_BASE, makeHerramienta({ clave: 'huerfana', titulo: 'Huérfana', orden: 2 })],
      isLoading: false,
    } as unknown as ReturnType<typeof useHerramientasList>)
    render(<GestionHerramientas />)
    expect(screen.getByText('Sin componente')).toBeInTheDocument()
  })
})

describe('GestionHerramientas — publicar', () => {
  test('el desplegable de claves solo ofrece las no publicadas', async () => {
    const user = userEvent.setup()
    render(<GestionHerramientas />)
    await user.click(screen.getByRole('button', { name: /Publicar herramienta/i }))

    const select = screen.getByLabelText(/Clave/i) as HTMLSelectElement
    const opciones = Array.from(select.options).map((o) => o.value)
    expect(opciones).toEqual(['nueva-tool'])
  })

  test('publicar sin título muestra error y no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCrearHerramienta).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCrearHerramienta>)

    const user = userEvent.setup()
    render(<GestionHerramientas />)
    await user.click(screen.getByRole('button', { name: /Publicar herramienta/i }))
    await user.click(screen.getByRole('button', { name: /^Publicar$/i }))

    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('publicar con datos válidos llama a la mutación con la clave elegida', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ clave: 'nueva-tool', titulo: 'Nueva' })
    vi.mocked(useCrearHerramienta).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCrearHerramienta>)

    const user = userEvent.setup()
    render(<GestionHerramientas />)
    await user.click(screen.getByRole('button', { name: /Publicar herramienta/i }))
    await user.type(screen.getByLabelText(/Título/i), 'Nueva')
    await user.type(screen.getByLabelText(/Tag/i), 'Procesamiento')
    await user.click(screen.getByRole('button', { name: /^Publicar$/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ clave: 'nueva-tool', titulo: 'Nueva', tag: 'Procesamiento', descripcion: null })
  })

  test('sin claves disponibles, el botón de publicar queda deshabilitado', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: [...HERRAMIENTAS_BASE, makeHerramienta({ clave: 'nueva-tool', titulo: 'Nueva', orden: 2 })],
      isLoading: false,
    } as unknown as ReturnType<typeof useHerramientasList>)
    render(<GestionHerramientas />)
    expect(screen.getByRole('button', { name: /Publicar herramienta/i })).toBeDisabled()
  })
})

describe('GestionHerramientas — activar/ocultar', () => {
  test('clic en el ícono de visibilidad llama a actualizar con activa invertida', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useActualizarHerramienta).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useActualizarHerramienta>)

    const user = userEvent.setup()
    render(<GestionHerramientas />)
    await user.click(screen.getByRole('button', { name: /Ocultar Conversor de Coordenadas/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ clave: 'conversor', cambios: { activa: false } })
  })
})

describe('GestionHerramientas — reordenar', () => {
  test('subir la primera fila está deshabilitado', () => {
    render(<GestionHerramientas />)
    expect(screen.getByRole('button', { name: /Subir Conversor de Coordenadas/i })).toBeDisabled()
  })

  test('bajar la última fila está deshabilitado', () => {
    render(<GestionHerramientas />)
    expect(screen.getByRole('button', { name: /Bajar Panel Chocó/i })).toBeDisabled()
  })

  test('bajar la primera fila intercambia el orden con la siguiente', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useReordenarHerramientas).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useReordenarHerramientas>)

    const user = userEvent.setup()
    render(<GestionHerramientas />)
    await user.click(screen.getByRole('button', { name: /Bajar Conversor de Coordenadas/i }))

    expect(mutateAsync).toHaveBeenCalledWith([{ clave: 'conversor', orden: 1 }, { clave: 'panel-choco', orden: 0 }])
  })
})

describe('GestionHerramientas — eliminar', () => {
  test('confirmar eliminación llama a la mutación con la clave', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useEliminarHerramienta).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useEliminarHerramienta>)

    const user = userEvent.setup()
    render(<GestionHerramientas />)
    await user.click(screen.getByRole('button', { name: /Eliminar Conversor de Coordenadas/i }))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(mutateAsync).toHaveBeenCalledWith('conversor')
  })

  test('cancelar no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useEliminarHerramienta).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useEliminarHerramienta>)

    const user = userEvent.setup()
    render(<GestionHerramientas />)
    await user.click(screen.getByRole('button', { name: /Eliminar Conversor de Coordenadas/i }))
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
