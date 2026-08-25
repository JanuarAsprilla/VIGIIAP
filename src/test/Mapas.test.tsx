import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode, HTMLAttributes } from 'react'
import Mapas from '@/pages/Mapas'
import type { MapaData } from '@/hooks/useMapas'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/hooks/useMapas', () => ({ useMapasList: vi.fn() }))
import { useMapasList } from '@/hooks/useMapas'

vi.mock('@/contexts/SearchContext', () => ({
  useSearch: () => ({ query: '', setQuery: vi.fn(), debouncedQuery: '' }),
}))

function makeMap(overrides: Partial<MapaData> = {}): MapaData {
  return {
    id: '1', slug: 'mapa-1', titulo: 'Mapa de prueba', categoria: 'Hidrología',
    anio: 2024, descripcion: '', thumbnail_url: null,
    archivo_pdf_url: 'https://r2.example.com/mapa.pdf', archivo_img_url: null,
    geovisor_url: null, activo: true, visibilidad: 'publico', creado_en: '2025-01-01',
    title: 'Mapa de prueba', category: 'Hidrología', categoryKey: 'hidrologia',
    excerpt: '', year: '2024', formats: ['PDF'], badge: 'PDF', badgeColor: 'primary',
    geovisorLink: '/geovisor', department: '',
    nombre: 'Mapa de prueba', tematica: 'Hidrología', escala: '1:100.000', autor: '',
    fecha: '2025-01-01', visible: true, formato: 'PDF', url: '', consultas: 0,
    ...overrides,
  } as MapaData
}

describe('Mapas — descarga de archivos', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:mock-url')
    URL.revokeObjectURL  = vi.fn()
  })

  test('tres clics rápidos en "Descargar PDF" disparan un solo fetch, y el botón se deshabilita mientras está en curso', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMap()], meta: { total: 1 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    let resolveFetch!: (v: { blob: () => Promise<Blob> }) => void
    const fetchSpy = vi.spyOn(window, 'fetch').mockImplementation(
      () => new Promise((resolve) => { resolveFetch = resolve as typeof resolveFetch }),
    )

    render(<Mapas />)
    const user = userEvent.setup()
    const btn = screen.getByRole('button', { name: /Descargar PDF/i })

    await user.click(btn)
    await user.click(btn)
    await user.click(btn)

    expect(fetchSpy).toHaveBeenCalledTimes(1)
    expect(btn).toBeDisabled()

    resolveFetch({ blob: () => Promise.resolve(new Blob(['contenido'])) })
    await waitFor(() => expect(btn).not.toBeDisabled())

    await user.click(btn)
    expect(fetchSpy).toHaveBeenCalledTimes(2)
  })
})

describe('Mapas — estados de carga y error', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('muestra un spinner mientras isLoading es true', () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: undefined, isLoading: true, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    render(<Mapas />)
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })

  test('muestra un mensaje de error cuando isError es true, no una lista vacía silenciosa', () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: undefined, isLoading: false, isError: true,
    } as unknown as ReturnType<typeof useMapasList>)

    render(<Mapas />)
    expect(screen.getByText(/Error al cargar mapas/i)).toBeInTheDocument()
  })
})
