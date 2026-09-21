import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

vi.mock('@/hooks/useHerramientas', () => ({ useHerramientasList: vi.fn() }))
vi.mock('@/lib/herramientasRegistro', () => ({
  REGISTRO_HERRAMIENTAS: {
    conversor: { Component: () => null },
    'panel-choco': { Component: () => null, focusable: true, icon: () => null, color: 'gold' },
  },
}))

import { useHerramientasList } from '@/hooks/useHerramientas'
import { useHerramientasCatalogo } from '@/hooks/useHerramientasCatalogo'

function makeHerramienta(overrides: Record<string, unknown> = {}) {
  return { clave: 'conversor', titulo: 'Conversor', descripcion: null, tag: 'Geodésico', activa: true, orden: 0, ...overrides }
}

beforeEach(() => vi.clearAllMocks())

describe('useHerramientasCatalogo', () => {
  test('fusiona el contenido del backend con el componente del registro estático', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: [makeHerramienta()], isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useHerramientasList>)

    const { result } = renderHook(() => useHerramientasCatalogo())

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0]).toMatchObject({ clave: 'conversor', titulo: 'Conversor' })
    expect(typeof result.current.items[0].Component).toBe('function')
  })

  test('descarta en silencio una clave del backend sin componente en el registro', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: [makeHerramienta(), makeHerramienta({ clave: 'huerfana', titulo: 'Huérfana' })],
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useHerramientasList>)

    const { result } = renderHook(() => useHerramientasCatalogo())

    expect(result.current.items).toHaveLength(1)
    expect(result.current.items[0].clave).toBe('conversor')
  })

  test('propaga isLoading del hook subyacente', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: undefined, isLoading: true, isError: false,
    } as unknown as ReturnType<typeof useHerramientasList>)

    const { result } = renderHook(() => useHerramientasCatalogo())

    expect(result.current.isLoading).toBe(true)
    expect(result.current.items).toEqual([])
  })

  test('una herramienta focusable trae su icon/color del registro', () => {
    vi.mocked(useHerramientasList).mockReturnValue({
      data: [makeHerramienta({ clave: 'panel-choco', titulo: 'Panel Chocó' })],
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useHerramientasList>)

    const { result } = renderHook(() => useHerramientasCatalogo())

    expect(result.current.items[0].focusable).toBe(true)
    expect(result.current.items[0].color).toBe('gold')
  })
})
