import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))

import api from '@/lib/api'
import { useBiodiversidadEstado, useBiodiversidadMunicipios, useBiodiversidadRegistros } from '@/hooks/useBiodiversidad'

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => vi.clearAllMocks())

describe('hooks de biodiversidad', () => {
  test('estado: pide /biodiversidad/estado', async () => {
    vi.mocked(api.get).mockResolvedValue({ grupos: [], conservacion: { activa: true, actualizada_en: null }, aviso: 'x' })
    const { result } = renderHook(() => useBiodiversidadEstado(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/estado')
    expect(result.current.data?.aviso).toBe('x')
  })

  test('municipios: envía el grupo como parámetro', async () => {
    vi.mocked(api.get).mockResolvedValue({ grupo: 'aves', metodo: 'agregado', desde: 2000, hasta: 2025, municipios: [] })
    const { result } = renderHook(() => useBiodiversidadMunicipios('aves'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/municipios', { params: { grupo: 'aves' } })
  })

  test('municipios: expone el error con su código sin reintentar', async () => {
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('no'), { status: 404 }))
    const { result } = renderHook(() => useBiodiversidadMunicipios('hongos'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as { status?: number }).status).toBe(404)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  test('registros: omite filtros indefinidos', async () => {
    vi.mocked(api.get).mockResolvedValue({ registros: [], total: 0, pagina: 1, tamano: 25 })
    const { result } = renderHook(
      () => useBiodiversidadRegistros({ grupo: 'anfibios', pagina: 2, tamano: 25, codigo_municipal: '05837', anio_desde: undefined }, true),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/registros', {
      params: { grupo: 'anfibios', pagina: 2, tamano: 25, codigo_municipal: '05837' },
    })
  })

  test('registros: deshabilitado no consulta', () => {
    renderHook(() => useBiodiversidadRegistros({ grupo: 'aves', pagina: 1, tamano: 25 }, false), { wrapper: wrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })
})
