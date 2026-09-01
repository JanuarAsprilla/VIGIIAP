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

describe('Mapas — filtro de formato', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('filtrar por PDF sigue mostrando los mapas en formato PDF', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMap({ id: '1', titulo: 'Mapa PDF', title: 'Mapa PDF', formats: ['PDF'] })], meta: { total: 1 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<Mapas />)
    const formatoSelect = screen.getAllByRole('combobox')[1]
    await user.selectOptions(formatoSelect, 'PDF')

    expect(screen.getByText('Mapa PDF')).toBeInTheDocument()
  })
})

describe('Mapas — modal de vista previa', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('"Visualizar" en un mapa PDF abre el modal con la opción de abrir y descargar', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMap({ archivo_pdf_url: 'https://r2.example.com/mapa.pdf', formats: ['PDF'] })], meta: { total: 1 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<Mapas />)
    await user.click(screen.getByRole('button', { name: /Visualizar/i }))

    expect(screen.getByRole('link', { name: /Abrir PDF/i })).toHaveAttribute('href', 'https://r2.example.com/mapa.pdf')
  })

  test('"Visualizar" en un mapa con imagen abre el modal con la imagen embebida', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: {
        data: [makeMap({
          archivo_pdf_url: null, archivo_img_url: 'https://r2.example.com/mapa.png', formats: ['IMG'],
        })],
        meta: { total: 1 },
      },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<Mapas />)
    await user.click(screen.getByRole('button', { name: /Visualizar/i }))

    expect(screen.getByAltText('Mapa de prueba')).toHaveAttribute('src', 'https://r2.example.com/mapa.png')
  })

  test('Escape cierra el modal de vista previa', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMap()], meta: { total: 1 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<Mapas />)
    await user.click(screen.getByRole('button', { name: /Visualizar/i }))
    expect(screen.getByRole('link', { name: /Abrir PDF/i })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('link', { name: /Abrir PDF/i })).not.toBeInTheDocument()
  })
})

describe('Mapas — filtros de categoría y año, chips', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('elegir una categoría añade un chip y "Limpiar todos los filtros" lo quita', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMap()], meta: { total: 1 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<Mapas />)
    const categoriaSelect = screen.getAllByRole('combobox')[0]
    await user.selectOptions(categoriaSelect, 'Hidrología')

    expect(screen.getByText('Limpiar todos los filtros')).toBeInTheDocument()
    await user.click(screen.getByText('Limpiar todos los filtros'))
    expect(screen.queryByText('Limpiar todos los filtros')).not.toBeInTheDocument()
  })

  test('quitar un chip individual restablece solo ese filtro', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMap()], meta: { total: 1 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<Mapas />)
    const anioSelect = screen.getAllByRole('combobox')[2]
    await user.selectOptions(anioSelect, '2024')
    expect(screen.getByText('Limpiar todos los filtros')).toBeInTheDocument()

    const chip = screen.getByText('Limpiar todos los filtros').previousElementSibling as HTMLElement
    await user.click(chip.querySelector('button')!)
    expect(screen.queryByText('Limpiar todos los filtros')).not.toBeInTheDocument()
  })
})

describe('Mapas — geovisor y paginación', () => {
  beforeEach(() => { vi.clearAllMocks() })

  test('un mapa con formato Geovisor ofrece el enlace correspondiente', () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: {
        data: [makeMap({ formats: ['GEOVISOR'], geovisorLink: '/geovisor?capa=hidro' })],
        meta: { total: 1 },
      },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    render(<Mapas />)
    expect(screen.getByRole('link', { name: /Geovisor/i })).toHaveAttribute('href', '/geovisor?capa=hidro')
  })

  test('con más de 6 mapas, pagina de a 6 y navega correctamente', async () => {
    const maps = Array.from({ length: 8 }, (_, i) => makeMap({ id: String(i), titulo: `Mapa ${i}`, title: `Mapa ${i}` }))
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: maps, meta: { total: 8 } },
      isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<Mapas />)
    expect(screen.getByText('Mapa 0')).toBeInTheDocument()
    expect(screen.queryByText('Mapa 6')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '2' }))
    expect(screen.getByText('Mapa 6')).toBeInTheDocument()
    expect(screen.queryByText('Mapa 0')).not.toBeInTheDocument()
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
