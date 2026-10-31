import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))

import api from '@/lib/api'
import {
  useBiodiversidadEspecies, useBiodiversidadEstado, useBiodiversidadMunicipios, useBiodiversidadOpciones, useBiodiversidadPuntos,
  useBiodiversidadRegistro, useBiodiversidadRegistros, useBiodiversidadResumen, useBiodiversidadSeries, useBiodiversidadSugerencias,
} from '@/hooks/useBiodiversidad'

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
}

const CON_SIGNAL = expect.objectContaining({ signal: expect.any(AbortSignal) })
const llamada = (ruta: string, params: object) => [ruta, expect.objectContaining({ params, signal: expect.any(AbortSignal) })] as const

beforeEach(() => vi.clearAllMocks())

describe('hooks de biodiversidad', () => {
  test('estado: pide /biodiversidad/estado con señal de cancelación', async () => {
    vi.mocked(api.get).mockResolvedValue({ grupos: [], conservacion: { activa: true, actualizada_en: null }, aviso: 'x' })
    const { result } = renderHook(() => useBiodiversidadEstado(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/biodiversidad/estado', CON_SIGNAL)
  })

  test('municipios: grupo más filtros', async () => {
    vi.mocked(api.get).mockResolvedValue({ grupo: 'aves', metodo: 'agregado', desde: 2000, hasta: 2025, municipios: [] })
    const { result } = renderHook(() => useBiodiversidadMunicipios('aves', { familia: 'Tyrannidae' }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/municipios', { grupo: 'aves', familia: 'Tyrannidae' }))
  })

  test('municipios: expone el error con su código sin reintentar', async () => {
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('no'), { status: 404 }))
    const { result } = renderHook(() => useBiodiversidadMunicipios('hongos'), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isError).toBe(true))
    expect((result.current.error as { status?: number }).status).toBe(404)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  test('registros: grupo más parámetros ya validados', async () => {
    vi.mocked(api.get).mockResolvedValue({ registros: [], total: 0, pagina: 1, tamano: 25 })
    const params = { pagina: 2, tamano: 25, codigo_municipal: '05837', orden: 'anio_asc', con_foto: 'true' }
    const { result } = renderHook(() => useBiodiversidadRegistros('anfibios', params, true), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/registros', { grupo: 'anfibios', ...params }))
  })

  test('registros: deshabilitado no consulta', () => {
    renderHook(() => useBiodiversidadRegistros('aves', { pagina: 1 }, false), { wrapper: wrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })

  test('resumen y series: grupo más parámetros', async () => {
    vi.mocked(api.get).mockResolvedValue({ registros: 1 })
    const { result } = renderHook(() => ({
      r: useBiodiversidadResumen('aves', { departamento: 'Chocó' }), s: useBiodiversidadSeries('aves', { codigo_municipal: '27001' }),
    }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.r.isSuccess && result.current.s.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/resumen', { grupo: 'aves', departamento: 'Chocó' }))
    expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/series', { grupo: 'aves', codigo_municipal: '27001' }))
  })

  test('series deshabilitadas no consultan', () => {
    renderHook(() => useBiodiversidadSeries('aves', {}, false), { wrapper: wrapper() })
    expect(api.get).not.toHaveBeenCalled()
  })

  test('especies y sugerencias', async () => {
    vi.mocked(api.get).mockResolvedValue({ especies: [], total: 0 })
    const { result } = renderHook(() => ({
      e: useBiodiversidadEspecies('aves', { pagina: 2, tamano: 20, orden: 'municipios' }),
      s: useBiodiversidadSugerencias('aves', { buscar: 'tyr', tamano: 6 }, true),
    }), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.e.isSuccess && result.current.s.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/especies', { grupo: 'aves', pagina: 2, tamano: 20, orden: 'municipios' }))
    expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/especies', { grupo: 'aves', buscar: 'tyr', tamano: 6 }))
  })

  test('opciones: solo consulta cuando está habilitado y envía el campo', async () => {
    vi.mocked(api.get).mockResolvedValue({ grupo: 'anfibios', campo: 'familia', valores: [] })
    const { rerender } = renderHook(({ on }: { on: boolean }) => useBiodiversidadOpciones('anfibios', 'familia', { clase: 'Amphibia' }, on), {
      wrapper: wrapper(), initialProps: { on: false },
    })
    expect(api.get).not.toHaveBeenCalled()
    rerender({ on: true })
    await waitFor(() => expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/opciones', { grupo: 'anfibios', campo: 'familia', clase: 'Amphibia' })))
  })

  test('puntos: grupo, filtros y recuadro', async () => {
    vi.mocked(api.get).mockResolvedValue({ grupo: 'anfibios', total: 0, mostrados: 0, ocultos: 0, muestreado: false, puntos: [] })
    const { result } = renderHook(() => useBiodiversidadPuntos('anfibios', { bbox: '-78,4,-76,6' }, true), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/puntos', { grupo: 'anfibios', bbox: '-78,4,-76,6' }))
  })

  test('cancelar una consulta obsoleta aborta su señal', async () => {
    let senal: AbortSignal | undefined
    vi.mocked(api.get).mockImplementation((_u, c) => { senal = (c as { signal: AbortSignal }).signal; return new Promise(() => undefined) })
    const { unmount } = renderHook(() => useBiodiversidadResumen('aves', { departamento: 'Chocó' }), { wrapper: wrapper() })
    await waitFor(() => expect(senal).toBeDefined())
    expect(senal?.aborted).toBe(false)
    unmount()
    await waitFor(() => expect(senal?.aborted).toBe(true))
  })

  test('detalle: codifica el id y solo consulta con id', async () => {
    vi.mocked(api.get).mockResolvedValue({ gbif_id: '55' })
    const { result, rerender } = renderHook(({ id }: { id: string | null }) => useBiodiversidadRegistro('anfibios', id), { wrapper: wrapper(), initialProps: { id: null as string | null } })
    expect(api.get).not.toHaveBeenCalled()
    rerender({ id: '55' })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith(...llamada('/biodiversidad/registros/55', { grupo: 'anfibios' }))
  })
})
