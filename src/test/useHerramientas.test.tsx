/**
 * Tests para los hooks de datos de herramientas (src/hooks/useHerramientas.ts).
 * Mismo patrón que hooks.data.test.tsx: mockea @/lib/api, ejercita la
 * implementación real de los hooks contra un QueryClientProvider fresco.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import {
  useHerramientasList, useCrearHerramienta, useActualizarHerramienta,
  useReordenarHerramientas, useEliminarHerramienta,
} from '@/hooks/useHerramientas'

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
}

const HERRAMIENTA = { clave: 'conversor', titulo: 'Conversor de Coordenadas', tag: 'Geodésico', activa: true, visibilidad: 'publico' as const, orden: 0 }

describe('useHerramientasList', () => {
  beforeEach(() => vi.clearAllMocks())

  test('trae el catálogo público sin parámetro admin', async () => {
    vi.mocked(api.get).mockResolvedValue([HERRAMIENTA])

    const { result } = renderHook(() => useHerramientasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/herramientas', { params: undefined })
    expect(result.current.data).toEqual([HERRAMIENTA])
  })

  test('con admin=true, pide ?admin=true', async () => {
    vi.mocked(api.get).mockResolvedValue([HERRAMIENTA])

    const { result } = renderHook(() => useHerramientasList(true), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/herramientas', { params: { admin: 'true' } })
  })

  test('normaliza una respuesta envuelta en { data: [...] }', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: [HERRAMIENTA] })

    const { result } = renderHook(() => useHerramientasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(Array.isArray(result.current.data)).toBe(true)
    expect(result.current.data?.[0].clave).toBe('conversor')
  })

  test('expone isError si la API falla', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'))

    const { result } = renderHook(() => useHerramientasList(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useCrearHerramienta', () => {
  beforeEach(() => vi.clearAllMocks())

  test('hace POST /herramientas con los datos provistos', async () => {
    vi.mocked(api.post).mockResolvedValue(HERRAMIENTA)

    const { result } = renderHook(() => useCrearHerramienta(), { wrapper: makeWrapper() })
    result.current.mutate({ clave: 'conversor', titulo: 'Conversor de Coordenadas', tag: 'Geodésico' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.post).toHaveBeenCalledWith('/herramientas', { clave: 'conversor', titulo: 'Conversor de Coordenadas', tag: 'Geodésico' })
    expect(result.current.data).toEqual(HERRAMIENTA)
  })
})

describe('useActualizarHerramienta', () => {
  beforeEach(() => vi.clearAllMocks())

  test('hace PATCH /herramientas/:clave con los cambios', async () => {
    vi.mocked(api.patch).mockResolvedValue({ ...HERRAMIENTA, activa: false })

    const { result } = renderHook(() => useActualizarHerramienta(), { wrapper: makeWrapper() })
    result.current.mutate({ clave: 'conversor', cambios: { activa: false } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.patch).toHaveBeenCalledWith('/herramientas/conversor', { activa: false })
  })

  test('codifica la clave en la URL', async () => {
    vi.mocked(api.patch).mockResolvedValue(HERRAMIENTA)

    const { result } = renderHook(() => useActualizarHerramienta(), { wrapper: makeWrapper() })
    result.current.mutate({ clave: 'panel choco', cambios: { activa: true } })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.patch).toHaveBeenCalledWith('/herramientas/panel%20choco', { activa: true })
  })
})

describe('useReordenarHerramientas', () => {
  beforeEach(() => vi.clearAllMocks())

  test('hace PATCH /herramientas/reordenar con los pares clave/orden', async () => {
    vi.mocked(api.patch).mockResolvedValue([HERRAMIENTA])

    const { result } = renderHook(() => useReordenarHerramientas(), { wrapper: makeWrapper() })
    result.current.mutate([{ clave: 'conversor', orden: 1 }, { clave: 'panel-choco', orden: 0 }])
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.patch).toHaveBeenCalledWith('/herramientas/reordenar', [{ clave: 'conversor', orden: 1 }, { clave: 'panel-choco', orden: 0 }])
  })
})

describe('useEliminarHerramienta', () => {
  beforeEach(() => vi.clearAllMocks())

  test('hace DELETE /herramientas/:clave', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)

    const { result } = renderHook(() => useEliminarHerramienta(), { wrapper: makeWrapper() })
    result.current.mutate('conversor')
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.delete).toHaveBeenCalledWith('/herramientas/conversor')
  })
})
