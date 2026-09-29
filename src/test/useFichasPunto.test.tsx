import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '@/lib/api'
import {
  useAtributosCapa, useConfigFichasCapa, useUpsertConfigFichasCapa,
  useFeaturesFichas, useUpsertFicha, useDeleteFicha, useSubirMedioFicha,
  useActualizarMedio, useReordenarMedios, useEliminarMedio,
} from '@/hooks/useFichasPunto'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => { vi.clearAllMocks() })

describe('useAtributosCapa', () => {
  test('pide los atributos de la capa cuando hay conexión y capaId', async () => {
    vi.mocked(api.get).mockResolvedValue([{ nombre: 'codigo_estacion', tipo: 'string' }])
    const { result } = renderHook(() => useAtributosCapa('c1', 'ws:estaciones'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/conexiones-geoserver/c1/capas/ws%3Aestaciones/atributos')
    expect(result.current.data).toEqual([{ nombre: 'codigo_estacion', tipo: 'string' }])
  })

  test('no dispara la petición sin capaId', () => {
    renderHook(() => useAtributosCapa('c1', null), { wrapper })
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('useConfigFichasCapa', () => {
  test('devuelve la config cuando existe', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: 'cfg1', conexionGeoserverId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo', campoEtiqueta: null, creadoEn: '', actualizadoEn: '' })
    const { result } = renderHook(() => useConfigFichasCapa('c1', 'ws:estaciones'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data?.campoIdentificador).toBe('codigo')
  })

  test('un 404 se interpreta como "nunca configurada" (null), no como error', async () => {
    const err = Object.assign(new Error('not found'), { status: 404 })
    vi.mocked(api.get).mockRejectedValue(err)
    const { result } = renderHook(() => useConfigFichasCapa('c1', 'ws:estaciones'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeNull()
  })

  test('un error distinto de 404 sí se propaga como error', async () => {
    const err = Object.assign(new Error('500'), { status: 500 })
    vi.mocked(api.get).mockRejectedValue(err)
    const { result } = renderHook(() => useConfigFichasCapa('c1', 'ws:estaciones'), { wrapper })
    await waitFor(() => expect(result.current.isError).toBe(true))
  })
})

describe('useUpsertConfigFichasCapa', () => {
  test('hace PUT a /admin/fichas-capa con el payload', async () => {
    vi.mocked(api.put).mockResolvedValue({ id: 'cfg1', conexionGeoserverId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo', campoEtiqueta: null, creadoEn: '', actualizadoEn: '' })
    const { result } = renderHook(() => useUpsertConfigFichasCapa(), { wrapper })

    await result.current.mutateAsync({ conexionId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo' })
    expect(api.put).toHaveBeenCalledWith('/admin/fichas-capa', { conexionId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo' })
  })
})

describe('useFeaturesFichas', () => {
  test('pide el listado de features cuando hay configId', async () => {
    vi.mocked(api.get).mockResolvedValue({
      resumen: { totalFeatures: 2, completas: 1, incompletas: 1, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 },
      features: [], sinIdentificador: [], huerfanas: [],
    })
    const { result } = renderHook(() => useFeaturesFichas('cfg1'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/fichas-capa/cfg1/features')
    expect(result.current.data?.resumen.completas).toBe(1)
  })

  test('no dispara sin configId', () => {
    renderHook(() => useFeaturesFichas(undefined), { wrapper })
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('useUpsertFicha / useDeleteFicha', () => {
  test('useUpsertFicha codifica el valor identificador en la URL', async () => {
    vi.mocked(api.put).mockResolvedValue({ id: 'f1', titulo: null, descripcion: 'Estación en la cuenca', medios: [] })
    const { result } = renderHook(() => useUpsertFicha('cfg1'), { wrapper })

    await result.current.mutateAsync({ valor: 'EST 01/A', descripcion: 'Estación en la cuenca' })
    expect(api.put).toHaveBeenCalledWith('/admin/fichas-capa/cfg1/fichas/EST%2001%2FA', { descripcion: 'Estación en la cuenca' })
  })

  test('useDeleteFicha hace DELETE con el valor codificado', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)
    const { result } = renderHook(() => useDeleteFicha('cfg1'), { wrapper })

    await result.current.mutateAsync('EST 01/A')
    expect(api.delete).toHaveBeenCalledWith('/admin/fichas-capa/cfg1/fichas/EST%2001%2FA')
  })
})

describe('useSubirMedioFicha', () => {
  test('manda un FormData con el archivo y pasa timeout:0 (video puede tardar más que el límite general)', async () => {
    vi.mocked(api.post).mockResolvedValue({ id: 'm1', tipo: 'imagen', url: '/files/x.jpg', miniaturaUrl: null, ancho: null, alto: null, duracionS: null, leyenda: null, creditos: null, orden: 0 })
    const { result } = renderHook(() => useSubirMedioFicha('cfg1'), { wrapper })
    const archivo = new File(['x'], 'foto.jpg', { type: 'image/jpeg' })

    await result.current.mutateAsync({ valor: 'EST-01', archivo })

    expect(api.post).toHaveBeenCalledWith(
      '/admin/fichas-capa/cfg1/fichas/EST-01/medios',
      expect.any(FormData),
      expect.objectContaining({ timeout: 0 }),
    )
    const fd = vi.mocked(api.post).mock.calls[0][1] as FormData
    expect(fd.get('archivo')).toBe(archivo)
  })

  test('incluye el poster, la leyenda y los créditos cuando se pasan', async () => {
    vi.mocked(api.post).mockResolvedValue({})
    const { result } = renderHook(() => useSubirMedioFicha('cfg1'), { wrapper })
    const archivo = new File(['x'], 'video.mp4', { type: 'video/mp4' })
    const poster = new File(['p'], 'poster.webp', { type: 'image/webp' })

    await result.current.mutateAsync({ valor: 'EST-01', archivo, poster, leyenda: 'Vista frontal', creditos: 'IIAP' })

    const fd = vi.mocked(api.post).mock.calls[0][1] as FormData
    expect(fd.get('poster')).toBe(poster)
    expect(fd.get('leyenda')).toBe('Vista frontal')
    expect(fd.get('creditos')).toBe('IIAP')
  })
})

describe('useActualizarMedio / useReordenarMedios / useEliminarMedio', () => {
  test('useActualizarMedio hace PATCH a /admin/fichas-medios/:id', async () => {
    vi.mocked(api.patch).mockResolvedValue({})
    const { result } = renderHook(() => useActualizarMedio('cfg1'), { wrapper })

    await result.current.mutateAsync({ medioId: 'm1', leyenda: 'Nueva leyenda' })
    expect(api.patch).toHaveBeenCalledWith('/admin/fichas-medios/m1', { leyenda: 'Nueva leyenda' })
  })

  test('useReordenarMedios hace PUT con la lista de ids en orden', async () => {
    vi.mocked(api.put).mockResolvedValue(undefined)
    const { result } = renderHook(() => useReordenarMedios('cfg1'), { wrapper })

    await result.current.mutateAsync({ valor: 'EST-01', ids: ['m2', 'm1'] })
    expect(api.put).toHaveBeenCalledWith('/admin/fichas-capa/cfg1/fichas/EST-01/medios/orden', { ids: ['m2', 'm1'] })
  })

  test('useEliminarMedio hace DELETE a /admin/fichas-medios/:id', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)
    const { result } = renderHook(() => useEliminarMedio('cfg1'), { wrapper })

    await result.current.mutateAsync('m1')
    expect(api.delete).toHaveBeenCalledWith('/admin/fichas-medios/m1')
  })
})
