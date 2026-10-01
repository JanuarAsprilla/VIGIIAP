import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@/hooks/useHerramientas', () => ({ useHerramientasList: vi.fn() }))
vi.mock('@/lib/herramientasRegistro', () => ({
  REGISTRO_HERRAMIENTAS: {
    'validador-coordenadas': { Component: () => null, icon: () => null, color: 'primary' },
    'panel-choco': { Component: () => null, icon: () => null, color: 'gold' },
  },
}))

import { useHerramientasList } from '@/hooks/useHerramientas'
import { useHerramientasCatalogo } from '@/hooks/useHerramientasCatalogo'

function makeHerramienta(overrides: Record<string, unknown> = {}) {
  return { clave: 'validador-coordenadas', titulo: 'Validador', descripcion: null, tag: 'Calidad de datos', activa: true, orden: 0, ...overrides }
}

beforeEach(() => vi.clearAllMocks())

describe('useHerramientasCatalogo', () => {
  test('fusiona el contenido del backend con el componente del registro estático', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: [makeHerramienta()], isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useHerramientasList>)

    const { result } = renderHook(() => useHerramientasCatalogo())

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({ clave: 'validador-coordenadas', titulo: 'Validador' })
    expect(typeof result.current.items[0].Component).toBe('function')
  })

  test('descarta en silencio una clave del backend sin componente en el registro', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: [makeHerramienta(), makeHerramienta({ clave: 'huerfana', titulo: 'Huérfana' })],
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useHerramientasList>)

    const { result } = renderHook(() => useHerramientasCatalogo())

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].clave).toBe('validador-coordenadas')
  })

  test('propaga isLoading del hook subyacente', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: undefined, isLoading: true, isError: false,
    } as unknown as ReturnType<typeof useHerramientasList>)

    const { result } = renderHook(() => useHerramientasCatalogo())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.items).toEqual([])
  })

  test('cada herramienta trae su icon/color del registro', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: [makeHerramienta({ clave: 'panel-choco', titulo: 'Panel Chocó' })],
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useHerramientasList>)

    const { result } = renderHook(() => useHerramientasCatalogo())

    expect(result.current.items[0].icon).toBeDefined()
    expect(result.current.items[0].color).toBe('gold')
  })
})
