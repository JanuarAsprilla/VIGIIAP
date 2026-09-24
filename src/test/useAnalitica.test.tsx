import { describe, test, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'
import {
  useAnaliticaResumen, usePaginasTop, useDispositivos, useFuentesTrafico, useEntradaSalida,
} from '@/hooks/useAnalitica'

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => vi.clearAllMocks())

describe('useAnaliticaResumen', () => {
  test('llama a /analitica/resumen y retorna los datos', async () => {
    vi.mocked(api.get).mockResolvedValue({ paginasVistas: { deltaPct: 10 } })
    const { result } = renderHook(() => useAnaliticaResumen(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/analitica/resumen')
    expect(result.current.data).toEqual({ paginasVistas: { deltaPct: 10 } })
  })

  test('no dispara la petición si enabled=false', () => {
    renderHook(() => useAnaliticaResumen(false), { wrapper })
    expect(api.get).not.toHaveBeenCalled()
  })
})

describe('usePaginasTop', () => {
  test('envía desde/hasta como params', async () => {
    vi.mocked(api.get).mockResolvedValue([])
    const { result } = renderHook(() => usePaginasTop({ desde: '2026-01-01', hasta: '2026-01-15' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/analitica/paginas-top', { params: { desde: '2026-01-01', hasta: '2026-01-15' } })
  })

  test('sin rango, envía params vacíos (el backend aplica su default de 14 días)', async () => {
    vi.mocked(api.get).mockResolvedValue([])
    const { result } = renderHook(() => usePaginasTop(), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/analitica/paginas-top', { params: {} })
  })
})

describe('useDispositivos', () => {
  test('llama a /analitica/dispositivos', async () => {
    vi.mocked(api.get).mockResolvedValue([{ dispositivo: 'movil', sesiones: 5 }])
    const { result } = renderHook(() => useDispositivos({ desde: '2026-01-01', hasta: '2026-01-15' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual([{ dispositivo: 'movil', sesiones: 5 }])
  })
})

describe('useFuentesTrafico', () => {
  test('llama a /analitica/fuentes-trafico', async () => {
    vi.mocked(api.get).mockResolvedValue([{ fuente: 'Directo', sesiones: 3 }])
    const { result } = renderHook(() => useFuentesTrafico({ desde: '2026-01-01', hasta: '2026-01-15' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(api.get).toHaveBeenCalledWith('/analitica/fuentes-trafico', { params: { desde: '2026-01-01', hasta: '2026-01-15' } })
  })
})

describe('useEntradaSalida', () => {
  test('llama a /analitica/entrada-salida', async () => {
    vi.mocked(api.get).mockResolvedValue({ entradas: [], salidas: [] })
    const { result } = renderHook(() => useEntradaSalida({ desde: '2026-01-01', hasta: '2026-01-15' }), { wrapper })
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ entradas: [], salidas: [] })
  })
})
