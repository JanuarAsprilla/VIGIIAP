import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))

import api from '@/lib/api'
import {
  useBiodiversidadEspecies, useBiodiversidadEstado, useBiodiversidadMunicipios, useBiodiversidadRegistro, useBiodiversidadRegistros,
  useBiodiversidadResumen, useBiodiversidadSeries,
} from '@/hooks/useBiodiversidad'

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

  test('registros: envía los filtros nuevos y descarta vacíos', async () => {
    vi.mocked(api.get).mockResolvedValue({ registros: [], total: 0, pagina: 1, tamano: 24 })
    const { result } = renderHook(
      () => useBiodiversidadRegistros({ grupo: 'anfibios', pagina: 1, tamano: 24, buscar: 'Rhi', con_foto: 'true', conservacion: 'amenazada', amenaza: 'CR', especie_clave: 'K1', departamento: undefined }, true),
      { wrapper: wrapper() },
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/registros', {
      params: { grupo: 'anfibios', pagina: 1, tamano: 24, buscar: 'Rhi', con_foto: 'true', conservacion: 'amenazada', amenaza: 'CR', especie_clave: 'K1' },
    })
  })

  test('resumen y series: grupo más alcance territorial', async () => {
    vi.mocked(api.get).mockResolvedValue({ registros: 1 })
    const { result } = renderHook(() => ({
      r: useBiodiversidadResumen('aves', { departamento: 'Chocó' }), s: useBiodiversidadSeries('aves', { codigo_municipal: '27001' }),
    }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.r.isSuccess && result.current.s.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/resumen', { params: { grupo: 'aves', departamento: 'Chocó' } })
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/series', { params: { grupo: 'aves', codigo_municipal: '27001' } })
  })

  test('series deshabilitadas no consultan', () => {
    renderHook(() => useBiodiversidadSeries('aves', {}, false), { wrapper: wrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })

  test('especies: filtros limpios', async () => {
    vi.mocked(api.get).mockResolvedValue({ especies: [], total: 0 })
    const { result } = renderHook(() => useBiodiversidadEspecies({ grupo: 'aves', pagina: 2, tamano: 20, orden: 'nombre', buscar: '' }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/especies', { params: { grupo: 'aves', pagina: 2, tamano: 20, orden: 'nombre' } })
  })

  test('detalle: codifica el id y solo consulta con id', async () => {
    vi.mocked(api.get).mockResolvedValue({ gbif_id: '55' })
    const { result, rerender } = renderHook(({ id }: { id: string | null }) => useBiodiversidadRegistro('anfibios', id), { wrapper: wrapper(), initialProps: { id: null as string | null } })
    expect(api.get).not.toHaveBeenCalled()
    rerender({ id: '55' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/registros/55', { params: { grupo: 'anfibios' } })
  })
})
