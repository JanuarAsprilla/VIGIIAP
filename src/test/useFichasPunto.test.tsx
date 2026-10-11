import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), patch: vi.fn(), delete: vi.fn() } }))
import api from '@/lib/api'
import {
  useAtributosCapa, useConfigFichasCapa, useCapasSinConfigFichas, useUpsertConfigFichasCapa, useEliminarConfigFichasCapa, useImportarFichas,
  useFeaturesFichas, useFicha, useUpsertFicha, useDeleteFicha, useSubirMedioFicha,
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

describe('useEliminarConfigFichasCapa', () => {
  test('hace DELETE a la config y deja la caché de esa capa en null (nunca configurada)', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['fichas-punto', 'config', 'c1', 'ws:estaciones'], { id: 'cfg1' })
    const conCliente = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
    const { result } = renderHook(() => useEliminarConfigFichasCapa(), { wrapper: conCliente })

    await result.current.mutateAsync({ configId: 'cfg1', conexionId: 'c1', capaId: 'ws:estaciones' })

    expect(api.delete).toHaveBeenCalledWith('/admin/fichas-capa/cfg1')
    expect(qc.getQueryData(['fichas-punto', 'config', 'c1', 'ws:estaciones'])).toBeNull()
  })

  test('descarta el listado de features de esa config, que ya no existe', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined)
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['fichas-punto', 'features', 'cfg1'], { features: [] })
    const conCliente = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
    const { result } = renderHook(() => useEliminarConfigFichasCapa(), { wrapper: conCliente })

    await result.current.mutateAsync({ configId: 'cfg1', conexionId: 'c1', capaId: 'ws:estaciones' })

    expect(qc.getQueryData(['fichas-punto', 'features', 'cfg1'])).toBeUndefined()
  })

  test('si el servidor responde 409, el error se propaga y la caché no cambia', async () => {
    vi.mocked(api.delete).mockRejectedValue(Object.assign(new Error('en uso'), { status: 409, code: 'CONFIG_EN_USO' }))
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    qc.setQueryData(['fichas-punto', 'config', 'c1', 'ws:estaciones'], { id: 'cfg1' })
    const conCliente = ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
    const { result } = renderHook(() => useEliminarConfigFichasCapa(), { wrapper: conCliente })

    await expect(result.current.mutateAsync({ configId: 'cfg1', conexionId: 'c1', capaId: 'ws:estaciones' })).rejects.toThrow('en uso')
    expect(qc.getQueryData(['fichas-punto', 'config', 'c1', 'ws:estaciones'])).toEqual({ id: 'cfg1' })
  })
})

describe('useCapasSinConfigFichas', () => {
  const config = { id: 'cfg1', conexionGeoserverId: 'c1', capaId: 'ws:con', campoIdentificador: 'codigo', campoEtiqueta: null, creadoEn: '', actualizadoEn: '' }

  test('devuelve solo las capas cuya config no existe (404), no las que sí la tienen', async () => {
    vi.mocked(api.get).mockImplementation((_url, opts) => {
      const capaId = (opts as { params: { capaId: string } }).params.capaId
      return capaId === 'ws:con'
        ? Promise.resolve(config)
        : Promise.reject(Object.assign(new Error('not found'), { status: 404 }))
    })
    const { result } = renderHook(() => useCapasSinConfigFichas('c1', ['ws:con', 'ws:sin']), { wrapper })

    await waitFor(() => expect(result.current).toEqual(['ws:sin']))
  })

  test('mientras la config carga, la capa no se cuenta como sin configurar', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useCapasSinConfigFichas('c1', ['ws:sin']), { wrapper })

    expect(result.current).toEqual([])
  })

  test('sin conexión no consulta nada', () => {
    const { result } = renderHook(() => useCapasSinConfigFichas('', ['ws:sin']), { wrapper })

    expect(api.get).not.toHaveBeenCalled()
    expect(result.current).toEqual([])
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

describe('useImportarFichas', () => {
  const filas = (n: number) => Array.from({ length: n }, (_, i) => ({ valor: `EST-${i}`, descripcion: 'Texto de la ficha' }))
  const resultado = (creadas: number) => ({ creadas, actualizadas: 0, omitidas: 0, duplicadasEnArchivo: 0 })

  test('envía las filas en tandas de 500 y suma los resultados de cada una', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce(resultado(500))
      .mockResolvedValueOnce(resultado(500))
      .mockResolvedValueOnce({ creadas: 150, actualizadas: 30, omitidas: 20, duplicadasEnArchivo: 1 })
    const { result } = renderHook(() => useImportarFichas('cfg1'), { wrapper })

    const total = await result.current.mutateAsync({ filas: filas(1200), sobrescribir: false })

    expect(api.post).toHaveBeenCalledTimes(3)
    expect(vi.mocked(api.post).mock.calls.map((c) => (c[1] as { filas: unknown[] }).filas.length)).toEqual([500, 500, 200])
    expect(vi.mocked(api.post).mock.calls[0][0]).toBe('/admin/fichas-capa/cfg1/fichas/importar')
    expect(total).toEqual({ creadas: 1150, actualizadas: 30, omitidas: 20, duplicadasEnArchivo: 1 })
  })

  test('pasa la opción de sobrescribir en cada tanda', async () => {
    vi.mocked(api.post).mockResolvedValue(resultado(1))
    const { result } = renderHook(() => useImportarFichas('cfg1'), { wrapper })

    await result.current.mutateAsync({ filas: filas(1), sobrescribir: true })

    expect(vi.mocked(api.post).mock.calls[0][1]).toMatchObject({ sobrescribir: true })
  })

  test('informa el avance después de cada tanda', async () => {
    vi.mocked(api.post).mockResolvedValue(resultado(500))
    const onProgreso = vi.fn()
    const { result } = renderHook(() => useImportarFichas('cfg1'), { wrapper })

    await result.current.mutateAsync({ filas: filas(700), sobrescribir: false, onProgreso })

    expect(onProgreso.mock.calls).toEqual([[500, 700], [700, 700]])
  })

  test('si una tanda falla después de importar otras, el error dice cuántas filas ya entraron', async () => {
    vi.mocked(api.post)
      .mockResolvedValueOnce(resultado(500))
      .mockRejectedValueOnce(new Error('Fallo de red'))
    const { result } = renderHook(() => useImportarFichas('cfg1'), { wrapper })

    await expect(result.current.mutateAsync({ filas: filas(700), sobrescribir: false }))
      .rejects.toThrow(/500 de 700 filas.*Fallo de red/)
  })

  test('si falla la primera tanda, propaga el error original', async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error('Sin permiso'))
    const { result } = renderHook(() => useImportarFichas('cfg1'), { wrapper })

    await expect(result.current.mutateAsync({ filas: filas(10), sobrescribir: false })).rejects.toThrow('Sin permiso')
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

describe('useFicha', () => {
  test('trae la ficha completa (título, descripción, medios) de un valor puntual', async () => {
    vi.mocked(api.get).mockResolvedValue({ id: 'f1', titulo: 'Estación Atrato', descripcion: 'Monitorea el nivel del río.', medios: [] })
    const { result } = renderHook(() => useFicha('cfg1', 'EST-01'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(api.get).toHaveBeenCalledWith('/admin/fichas-capa/cfg1/fichas/EST-01')
    expect(result.current.data?.titulo).toBe('Estación Atrato')
  })

  test('un 404 se interpreta como "todavía sin ficha" (null), no como error', async () => {
    const err = Object.assign(new Error('not found'), { status: 404 })
    vi.mocked(api.get).mockRejectedValue(err)
    const { result } = renderHook(() => useFicha('cfg1', 'EST-01'), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(result.current.data).toBeNull()
  })

  test('con un video en estado "procesando", refresca sola pasados ~6s', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(api.get).mockResolvedValue({
      id: 'f1', titulo: null, descripcion: '',
      medios: [{ id: 'm1', tipo: 'video', estado: 'procesando', url: null, miniaturaUrl: null, ancho: null, alto: null, duracionS: null, leyenda: null, creditos: null, orden: 0 }],
    })
    renderHook(() => useFicha('cfg1', 'EST-01'), { wrapper })
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(1))

    await vi.advanceTimersByTimeAsync(6000)
    expect(api.get).toHaveBeenCalledTimes(2)
    vi.useRealTimers()
  })

  test('con todos los medios "listo", no vuelve a refrescar sola', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(api.get).mockResolvedValue({
      id: 'f1', titulo: null, descripcion: '',
      medios: [{ id: 'm1', tipo: 'imagen', estado: 'listo', url: 'https://x.test/a.jpg', miniaturaUrl: null, ancho: null, alto: null, duracionS: null, leyenda: null, creditos: null, orden: 0 }],
    })
    renderHook(() => useFicha('cfg1', 'EST-01'), { wrapper })
    await vi.waitFor(() => expect(api.get).toHaveBeenCalledTimes(1))

    await vi.advanceTimersByTimeAsync(10_000)
    expect(api.get).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })

  test('no dispara sin valor', () => {
    renderHook(() => useFicha('cfg1', null), { wrapper })
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
