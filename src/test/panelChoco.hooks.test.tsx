/**
 * Tests unitarios para los hooks pequeños de panel-choco: permisos,
 * dataset versionado (localStorage) y carga/validación de Excel.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { usePanelChocoPermisos } from '@/components/herramientas/panel-choco/hooks/usePanelChocoPermisos'
import { useDatasetVersionado } from '@/components/herramientas/panel-choco/hooks/useDatasetVersionado'
import { useCargaExcel } from '@/components/herramientas/panel-choco/hooks/useCargaExcel'

// ── usePanelChocoPermisos ───────────────────────────────────────────────────

const { authMock } = vi.hoisted(() => ({ authMock: { user: null as { rol: string } | null } }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

describe('usePanelChocoPermisos', () => {
  beforeEach(() => { authMock.user = null })

  test('sin sesión, no puede editar', () => {
    const { result } = renderHook(() => usePanelChocoPermisos())
    expect(result.current.puedeEditar).toBe(false)
  })

  test.each(['investigador', 'admin_sig', 'super_admin'])('rol %s puede editar', (rol) => {
    authMock.user = { rol }
    const { result } = renderHook(() => usePanelChocoPermisos())
    expect(result.current.puedeEditar).toBe(true)
  })

  test.each(['publico', 'visitante', 'tecnico', 'institucional'])('rol %s no puede editar', (rol) => {
    authMock.user = { rol }
    const { result } = renderHook(() => usePanelChocoPermisos())
    expect(result.current.puedeEditar).toBe(false)
  })
})

// ── useDatasetVersionado ─────────────────────────────────────────────────────

describe('useDatasetVersionado', () => {
  beforeEach(() => localStorage.clear())

  test('sin override guardado, arranca con el dataset por defecto', () => {
    const { result } = renderHook(() => useDatasetVersionado('titulacion', { total: 0 }))
    expect(result.current.valor).toEqual({ total: 0 })
    expect(result.current.esPersonalizado).toBe(false)
  })

  test('actualizar persiste en localStorage y marca esPersonalizado', () => {
    const { result } = renderHook(() => useDatasetVersionado('titulacion', { total: 0 }))
    act(() => result.current.actualizar({ total: 42 }))

    expect(result.current.valor).toEqual({ total: 42 })
    expect(result.current.esPersonalizado).toBe(true)
    expect(JSON.parse(localStorage.getItem('panel_choco_titulacion_v1')!)).toEqual({ total: 42 })
  })

  test('un override ya guardado en localStorage se carga al montar', () => {
    localStorage.setItem('panel_choco_titulacion_v1', JSON.stringify({ total: 99 }))
    const { result } = renderHook(() => useDatasetVersionado('titulacion', { total: 0 }))
    expect(result.current.valor).toEqual({ total: 99 })
    expect(result.current.esPersonalizado).toBe(true)
  })

  test('restaurarDefault vuelve al dataset original y limpia localStorage', () => {
    const { result } = renderHook(() => useDatasetVersionado('titulacion', { total: 0 }))
    act(() => result.current.actualizar({ total: 42 }))
    act(() => result.current.restaurarDefault())

    expect(result.current.valor).toEqual({ total: 0 })
    expect(result.current.esPersonalizado).toBe(false)
    expect(localStorage.getItem('panel_choco_titulacion_v1')).toBeNull()
  })

  test('JSON corrupto en localStorage no rompe el hook -- cae al default', () => {
    localStorage.setItem('panel_choco_titulacion_v1', '{corrupto')
    const { result } = renderHook(() => useDatasetVersionado('titulacion', { total: 0 }))
    expect(result.current.valor).toEqual({ total: 0 })
    expect(result.current.esPersonalizado).toBe(false)
  })

  test('datasets distintos usan claves de localStorage independientes', () => {
    const { result: r1 } = renderHook(() => useDatasetVersionado('titulacion', { total: 0 }))
    const { result: r2 } = renderHook(() => useDatasetVersionado('limites', { total: 0 }))
    act(() => r1.current.actualizar({ total: 1 }))

    expect(r1.current.valor).toEqual({ total: 1 })
    expect(r2.current.valor).toEqual({ total: 0 })
  })
})

// ── useCargaExcel ────────────────────────────────────────────────────────────

vi.mock('@/components/herramientas/panel-choco/lib/leerFilasExcel', () => ({ leerFilasExcel: vi.fn() }))
import { leerFilasExcel } from '@/components/herramientas/panel-choco/lib/leerFilasExcel'

describe('useCargaExcel', () => {
  beforeEach(() => vi.clearAllMocks())

  const FAKE_FILE = new File(['x'], 'datos.xlsx')

  test('arranca en estado idle sin error', () => {
    const { result } = renderHook(() => useCargaExcel(['DeptoNom']))
    expect(result.current.estado).toBe('idle')
    expect(result.current.error).toBeNull()
  })

  test('archivo válido: pasa por cargando y termina en listo con las filas', async () => {
    vi.mocked(leerFilasExcel).mockResolvedValue([{ DeptoNom: 'Chocó', MpNombre: 'Quibdó' }])
    const { result } = renderHook(() => useCargaExcel(['DeptoNom', 'MpNombre']))

    let filas
    await act(async () => { filas = await result.current.cargarArchivo(FAKE_FILE) })

    expect(filas).toEqual([{ DeptoNom: 'Chocó', MpNombre: 'Quibdó' }])
    await waitFor(() => expect(result.current.estado).toBe('listo'))
    expect(result.current.error).toBeNull()
  })

  test('archivo sin filas de datos: error y retorna null', async () => {
    vi.mocked(leerFilasExcel).mockResolvedValue([])
    const { result } = renderHook(() => useCargaExcel(['DeptoNom']))

    let filas
    await act(async () => { filas = await result.current.cargarArchivo(FAKE_FILE) })

    expect(filas).toBeNull()
    expect(result.current.estado).toBe('error')
    expect(result.current.error).toBe('El archivo no tiene filas de datos')
  })

  test('faltan columnas requeridas: error explícito con los nombres faltantes', async () => {
    vi.mocked(leerFilasExcel).mockResolvedValue([{ DeptoNom: 'Chocó' }])
    const { result } = renderHook(() => useCargaExcel(['DeptoNom', 'MpNombre', 'Area_ha']))

    let filas
    await act(async () => { filas = await result.current.cargarArchivo(FAKE_FILE) })

    expect(filas).toBeNull()
    expect(result.current.error).toBe('Faltan columnas requeridas: MpNombre, Area_ha')
  })

  test('leerFilasExcel lanza un error no-Error: usa el mensaje genérico', async () => {
    vi.mocked(leerFilasExcel).mockRejectedValue('boom')
    const { result } = renderHook(() => useCargaExcel(['DeptoNom']))

    await act(async () => { await result.current.cargarArchivo(FAKE_FILE) })
    expect(result.current.error).toBe('No se pudo leer el archivo')
  })

  test('reset vuelve a idle y limpia el error', async () => {
    vi.mocked(leerFilasExcel).mockResolvedValue([])
    const { result } = renderHook(() => useCargaExcel(['DeptoNom']))
    await act(async () => { await result.current.cargarArchivo(FAKE_FILE) })
    expect(result.current.estado).toBe('error')

    act(() => result.current.reset())
    expect(result.current.estado).toBe('idle')
    expect(result.current.error).toBeNull()
  })
})
