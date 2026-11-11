import { describe, test, expect, vi, beforeEach } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement, type ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn(), delete: vi.fn() } }))

import api from '@/lib/api'
import {
  useActualizarGeneral, useActualizarHerramientaInforme, usePanelInformes, useQuitarLogo, useSubirLogo,
} from '@/hooks/useInformesAdmin'

function wrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client: qc }, children)
}

beforeEach(() => vi.clearAllMocks())

describe('hooks de informes (administración)', () => {
  test('el panel se pide a /informes/admin', async () => {
    vi.mocked(api.get).mockResolvedValue({ general: {}, herramientas: [] })
    const { result } = renderHook(() => usePanelInformes(), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/informes/admin')
  })

  test('la configuración general se guarda con PUT', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const { result } = renderHook(() => useActualizarGeneral(), { wrapper: wrapper() })
    await act(() => result.current.mutateAsync({ acceso: 'publico' }))
    expect(api.put).toHaveBeenCalledWith('/informes/admin/general', { acceso: 'publico' })
  })

  test('el logo viaja como FormData en el campo «logo» y se quita con DELETE', async () => {
    vi.mocked(api.post).mockResolvedValue({})
    vi.mocked(api.delete).mockResolvedValue({})
    const subir = renderHook(() => useSubirLogo(), { wrapper: wrapper() })
    const archivo = new File(['x'], 'logo.png', { type: 'image/png' })
    await act(() => subir.result.current.mutateAsync(archivo))
    const [url, cuerpo] = vi.mocked(api.post).mock.calls[0]
    expect(url).toBe('/informes/admin/logo')
    expect(cuerpo).toBeInstanceOf(FormData)
    expect((cuerpo as FormData).get('logo')).toBe(archivo)

    const quitar = renderHook(() => useQuitarLogo(), { wrapper: wrapper() })
    await act(() => quitar.result.current.mutateAsync())
    expect(api.delete).toHaveBeenCalledWith('/informes/admin/logo')
  })

  test('los ajustes de una herramienta se guardan en su ruta, con la clave codificada', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const { result } = renderHook(() => useActualizarHerramientaInforme(), { wrapper: wrapper() })
    await act(() => result.current.mutateAsync({ clave: 'biodiversidad', cambio: { activo: false } }))
    expect(api.put).toHaveBeenCalledWith('/informes/admin/herramientas/biodiversidad', { activo: false })
    await act(() => result.current.mutateAsync({ clave: 'a/b', cambio: { max_filas: 200 } }))
    expect(api.put).toHaveBeenLastCalledWith('/informes/admin/herramientas/a%2Fb', { max_filas: 200 })
  })
})
