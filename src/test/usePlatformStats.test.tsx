/**
 * usePlatformStats tenía 0% de cobertura — encontrado en la auditoría post-QA
 * que motivó los fixes de ResumenActividad/Perfil/Home (PR #78). El hook
 * alimenta las cifras reales de mapas/documentos en Home y AuthLayout, que
 * antes eran valores hardcodeados desincronizados del catálogo real.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}))

import api from '@/lib/api'
import { usePlatformStats } from '@/hooks/usePlatformStats'

function makeWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
}

function mockCounts(mapasTotal: number, documentosTotal: number) {
  vi.mocked(api.get).mockImplementation((url: string) => {
    if (url === '/mapas')      return Promise.resolve({ data: [], meta: { total: mapasTotal } })
    if (url === '/documentos') return Promise.resolve({ data: [], meta: { total: documentosTotal } })
    return Promise.resolve({ data: [], meta: { total: 0 } })
  })
}

describe('usePlatformStats', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('pide /mapas y /documentos con limit:1 (conteo real, sin traer el catálogo completo)', async () => {
    mockCounts(1, 1)
    const { result } = renderHook(() => usePlatformStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.every((s) => !s.loading)).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/mapas', { params: { limit: 1 } })
    expect(api.get).toHaveBeenCalledWith('/documentos', { params: { limit: 1 } })
  })

  test('expone el total real de cada endpoint — no cifras fijas', async () => {
    mockCounts(1248, 3400)
    const { result } = renderHook(() => usePlatformStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.every((s) => !s.loading)).toBe(true))

    const byKey = Object.fromEntries(result.current.map((s) => [s.key, s.value]))
    expect(byKey.mapas).toBe(1248)
    expect(byKey.documentos).toBe(3400)
  })

  test('refleja el catálogo real aunque sea un número pequeño (regresión del bug de stats hardcodeadas)', async () => {
    mockCounts(1, 1)
    const { result } = renderHook(() => usePlatformStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.every((s) => !s.loading)).toBe(true))

    const byKey = Object.fromEntries(result.current.map((s) => [s.key, s.value]))
    expect(byKey.mapas).toBe(1)
    expect(byKey.documentos).toBe(1)
  })

  test('mientras carga, expone loading:true en vez de ocultar el stat', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => usePlatformStats(), { wrapper: makeWrapper() })

    expect(result.current).toHaveLength(2)
    expect(result.current.every((s) => s.loading)).toBe(true)
  })

  test('si un endpoint falla, ese stat se omite en vez de mostrar undefined/NaN', async () => {
    vi.mocked(api.get).mockImplementation((url: string) => {
      if (url === '/mapas') return Promise.reject(new Error('500'))
      return Promise.resolve({ data: [], meta: { total: 3400 } })
    })

    const { result } = renderHook(() => usePlatformStats(), { wrapper: makeWrapper() })
    await waitFor(() => expect(result.current.some((s) => s.key === 'documentos' && !s.loading)).toBe(true))

    expect(result.current.find((s) => s.key === 'mapas')).toBeUndefined()
    expect(result.current.find((s) => s.key === 'documentos')?.value).toBe(3400)
  })
})
