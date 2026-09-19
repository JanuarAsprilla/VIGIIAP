import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'
import { useGeovisoresList, useGeovisoresPublico } from '@/hooks/useGeovisores'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

function pagina(n: number, prefijo = 'g') {
  return Array.from({ length: n }, (_, i) => ({ id: `${prefijo}-${i}`, titulo: `${prefijo}-${i}` }))
}

beforeEach(() => { vi.clearAllMocks() })

describe('useGeovisoresList / useGeovisoresPublico — paginación completa', () => {
  // Regresión: el backend recorta `limit` a un máximo de 100 (ver paginate.js
  // en VIGIIAP-backend) sin avisar al cliente. Antes se pedía limit:200 una
  // sola vez, así que con más de 100 geovisores el resto desaparecía en
  // silencio de toda vista (admin y portal), sin ningún indicio visual.

  test('con una sola página (menos de 100), hace una única llamada', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: pagina(12), meta: { total: 12 } })
    const { result } = renderHook(() => useGeovisoresList(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(12)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  test('con más de 100 geovisores, sigue pidiendo páginas hasta traerlos todos', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: pagina(100, 'p1'), meta: { total: 137 } })
      .mockResolvedValueOnce({ data: pagina(37, 'p2'), meta: { total: 137 } })

    const { result } = renderHook(() => useGeovisoresList(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(137)
    expect(api.get).toHaveBeenCalledTimes(2)
    expect(api.get).toHaveBeenNthCalledWith(1, '/geovisores', { params: expect.objectContaining({ page: 1, limit: 100 }) })
    expect(api.get).toHaveBeenNthCalledWith(2, '/geovisores', { params: expect.objectContaining({ page: 2, limit: 100 }) })
  })

  test('la vista admin sigue pidiendo admin=true en cada página', async () => {
    vi.mocked(api.get).mockResolvedValue({ data: pagina(5), meta: { total: 5 } })
    renderHook(() => useGeovisoresList(), { wrapper })
    await waitFor(() => expect(api.get).toHaveBeenCalled())
    expect(api.get).toHaveBeenCalledWith('/geovisores', { params: expect.objectContaining({ admin: 'true' }) })
  })

  test('la vista pública (portal) también trae el catálogo completo', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: pagina(100, 'q1'), meta: { total: 105 } })
      .mockResolvedValueOnce({ data: pagina(5, 'q2'), meta: { total: 105 } })

    const { result } = renderHook(() => useGeovisoresPublico(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.data).toHaveLength(105)
  })

  test('se detiene con una salvaguarda razonable en vez de hacer un loop infinito', async () => {
    // Simula un backend que siempre devuelve exactamente 100 filas (worst case) --
    // no debe llamar indefinidamente.
    vi.mocked(api.get).mockResolvedValue({ data: pagina(100), meta: { total: 999999 } })
    const { result } = renderHook(() => useGeovisoresList(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledTimes(20) // MAX_PAGINAS
  })
})
