import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
import api from '@/lib/api'
import { useInventarioGeoserver, useSincronizarConexionGeoserver } from '@/hooks/useConexionesGeoserver'
import { useCatalogoDeGeovisor, useCapasDeGeovisor } from '@/hooks/useGeovisores'

function setup() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  const invalidate = vi.spyOn(qc, 'invalidateQueries')
  const wrapper = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
  return { wrapper, invalidate }
}

beforeEach(() => vi.clearAllMocks())

describe('useInventarioGeoserver', () => {
  test('pide el inventario de la conexión', async () => {
    vi.mocked(api.get).mockResolvedValue({ sincronizacion: null, espacios: [], capas: [], grupos: [], estilos: [] })
    const { wrapper } = setup()
    const { result } = renderHook(() => useInventarioGeoserver('c1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/admin/conexiones-geoserver/c1/inventario', { params: { incluirEliminados: 'true' } })
  })

  test('no pide nada sin id de conexión', () => {
    const { wrapper } = setup()
    renderHook(() => useInventarioGeoserver(undefined), { wrapper })
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('useSincronizarConexionGeoserver', () => {
  test('sincroniza e invalida inventario y catálogo de geovisores', async () => {
    vi.mocked(api.post).mockResolvedValue({ estado: 'ok', fuente: 'rest+ogc', resumen: {}, duracion_ms: 900 })
    const { wrapper, invalidate } = setup()
    const { result } = renderHook(() => useSincronizarConexionGeoserver(), { wrapper })
    await act(async () => { await result.current.mutateAsync('c1') })

    expect(api.post).toHaveBeenCalledWith('/admin/conexiones-geoserver/c1/sincronizar')
    const claves = invalidate.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey)
    expect(claves).toContainEqual(['conexiones-geoserver', 'inventario', 'c1'])
    expect(claves).toContainEqual(['geovisores', 'capas'])
  })

  test('un 429 se traduce a un mensaje claro del límite por minuto', async () => {
    vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('Too many'), { status: 429 }))
    const { wrapper } = setup()
    const { result } = renderHook(() => useSincronizarConexionGeoserver(), { wrapper })
    await act(async () => { await result.current.mutateAsync('c1').catch(() => {}) })

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('Espera un minuto antes de volver a sincronizar.')
    expect((result.current.error as Error & { status?: number }).status).toBe(429)
  })

  test('un 409 dice que ya hay una sincronización en curso y refresca el estado', async () => {
    vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('conflicto'), { status: 409 }))
    const { wrapper, invalidate } = setup()
    const { result } = renderHook(() => useSincronizarConexionGeoserver(), { wrapper })
    await act(async () => { await result.current.mutateAsync('c1').catch(() => {}) })

    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('Ya hay una sincronización en curso; espera a que termine.')
    expect((result.current.error as Error & { status?: number }).status).toBe(409)
    const claves = invalidate.mock.calls.map((c) => (c[0] as { queryKey: unknown[] }).queryKey)
    expect(claves).toContainEqual(['conexiones-geoserver', 'inventario', 'c1'])
  })

  test('otros errores conservan su mensaje', async () => {
    vi.mocked(api.post).mockRejectedValue(Object.assign(new Error('GeoServer no responde'), { status: 502 }))
    const { wrapper } = setup()
    const { result } = renderHook(() => useSincronizarConexionGeoserver(), { wrapper })
    await act(async () => { await result.current.mutateAsync('c1').catch(() => {}) })
    await waitFor(() => expect(result.current.error).not.toBeNull())
    expect(result.current.error?.message).toBe('GeoServer no responde')
  })
})

describe('catálogo público de un geovisor', () => {
  test('useCatalogoDeGeovisor devuelve temas, grupos y desactualizado', async () => {
    const catalogo = { temas: [{ id: 't', nombre: 'T', capas: [] }], grupos: [{ id: 'g', nombre: 'G', tema: 't', capas: [] }], desactualizado: true }
    vi.mocked(api.get).mockResolvedValue(catalogo)
    const { wrapper } = setup()
    const { result } = renderHook(() => useCatalogoDeGeovisor('geo'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual(catalogo)
  })

  test('useCapasDeGeovisor sigue devolviendo solo los temas', async () => {
    vi.mocked(api.get).mockResolvedValue({ temas: [{ id: 't', nombre: 'T', capas: [] }] })
    const { wrapper } = setup()
    const { result } = renderHook(() => useCapasDeGeovisor('geo'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ id: 't', nombre: 'T', capas: [] }])
  })
})
