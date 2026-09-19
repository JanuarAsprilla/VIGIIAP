import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import CommandPalette from '@/components/CommandPalette'
import type { useGlobalSearchContent } from '@/hooks/useGlobalSearchContent'
import type { GeovisorRaw } from '@/types'

function makeGeovisor(overrides: Partial<GeovisorRaw>): GeovisorRaw {
  return {
    id: 'g1', slug: 'geovisor', titulo: 'Geovisor', subtitulo: null, descripcion: null,
    cita: null, categoria: null, conexionGeoserverId: 'c1', workspacesGeoserver: [],
    capasSeleccionadas: [], colorPorTema: {}, centro: { lat: 0, lng: 0 }, zoomInicial: 8,
    basemapDefecto: 'calles', areaMaxHa: null, presetsArea: [],
    visibilidad: 'publico', presentacion: { mostrarMetricas: true, mostrarImagenes: false, camposPopup: [] },
    thumbnailUrl: null, activo: true, orden: 0, creadoEn: '2026-01-01',
    ...overrides,
  }
}

vi.mock('framer-motion', () => {
  const cache = new Map<string, (p: Record<string, unknown>) => ReactNode>()
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        cache.set(tag, ({ children, ...p }: Record<string, unknown>) => createElement(tag, p, children as ReactNode))
      }
      return cache.get(tag)
    },
  })
  return { motion, AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</> }
})

const uiMock = { paletteOpen: true, closePalette: vi.fn() }
vi.mock('@/contexts/UIContext', () => ({ useUI: () => uiMock }))

const authMock = { isAuthenticated: false }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

const setPageQuerySpy = vi.fn()
vi.mock('@/contexts/SearchContext', () => ({ useSearch: () => ({ query: '', setQuery: setPageQuerySpy }) }))

const { globalSearchContentMock } = vi.hoisted(() => ({
  globalSearchContentMock: vi.fn<() => ReturnType<typeof useGlobalSearchContent>>(
    () => ({ mapas: [], documentos: [], geovisores: [] })
  ),
}))
vi.mock('@/hooks/useGlobalSearchContent', () => ({ useGlobalSearchContent: globalSearchContentMock }))

const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

function renderPalette() {
  return render(<MemoryRouter><CommandPalette /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  uiMock.paletteOpen = true
  authMock.isAuthenticated = false
  globalSearchContentMock.mockReturnValue({ mapas: [], documentos: [], geovisores: [] })
  Element.prototype.scrollIntoView = vi.fn()
})

describe('CommandPalette — visibilidad', () => {
  test('no renderiza nada si el palette está cerrado', () => {
    uiMock.paletteOpen = false
    const { container } = renderPalette()
    expect(container).toBeEmptyDOMElement()
  })

  test('clic en el backdrop cierra el palette', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByRole('dialog'))
    expect(uiMock.closePalette).toHaveBeenCalled()
  })
})

describe('CommandPalette — resultados y agrupación', () => {
  test('muestra los módulos y recursos agrupados por defecto', () => {
    renderPalette()
    expect(screen.getByText('Módulos')).toBeInTheDocument()
    expect(screen.getByText('Recursos')).toBeInTheDocument()
    expect(screen.getByText('Mapas')).toBeInTheDocument()
    expect(screen.getByText('Preguntas Frecuentes')).toBeInTheDocument()
  })

  test('con sesión, incluye el grupo "Mi Cuenta"', () => {
    authMock.isAuthenticated = true
    renderPalette()
    expect(screen.getByText('Mi Cuenta')).toBeInTheDocument()
    expect(screen.getByText('Mis Solicitudes')).toBeInTheDocument()
  })

  test('sin sesión, no ofrece los atajos de cuenta', () => {
    renderPalette()
    expect(screen.queryByText('Mi Cuenta')).not.toBeInTheDocument()
  })

  test('filtra por texto de la etiqueta', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.type(screen.getByRole('combobox'), 'geovisores')
    expect(screen.getByText('Geovisores')).toBeInTheDocument()
    expect(screen.queryByText('Documentos')).not.toBeInTheDocument()
  })

  test('filtra por palabras clave aunque no coincidan con la etiqueta visible', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.type(screen.getByRole('combobox'), 'manual')
    expect(screen.getByText('Guía de Usuario')).toBeInTheDocument()
  })

  test('sin coincidencias, muestra el estado vacío con el término buscado', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.type(screen.getByRole('combobox'), 'xyz-inexistente')
    expect(screen.getByText('Sin resultados para')).toBeInTheDocument()
    expect(screen.getByText('"xyz-inexistente"')).toBeInTheDocument()
  })

  test('el botón de limpiar borra la búsqueda', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.type(screen.getByRole('combobox'), 'geovisores')
    await user.click(screen.getByLabelText('Limpiar búsqueda'))
    expect(screen.getByRole('combobox')).toHaveValue('')
    expect(screen.getByText('Documentos')).toBeInTheDocument()
  })
})

describe('CommandPalette — teclado', () => {
  test('Escape cierra el palette', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Escape}')
    expect(uiMock.closePalette).toHaveBeenCalled()
  })

  test('Enter sobre el primer resultado navega y cierra el palette', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{Enter}')
    expect(navigateSpy).toHaveBeenCalledWith('/')
    expect(uiMock.closePalette).toHaveBeenCalled()
  })

  test('ArrowDown mueve la selección al siguiente resultado antes de confirmar con Enter', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowDown}{Enter}')
    expect(navigateSpy).toHaveBeenCalledWith('/mapas')
  })

  test('ArrowUp no retrocede más allá del primer resultado', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByRole('combobox'))
    await user.keyboard('{ArrowUp}{ArrowUp}{Enter}')
    expect(navigateSpy).toHaveBeenCalledWith('/')
  })

  test('clic directo en un resultado también navega', async () => {
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByText('Documentos'))
    expect(navigateSpy).toHaveBeenCalledWith('/documentos')
  })
})

describe('CommandPalette — búsqueda de contenido real', () => {
  test('incluye mapas, documentos y geovisores reales, no solo módulos', () => {
    globalSearchContentMock.mockReturnValue({
      mapas:      [{ id: 'm1', titulo: 'Cobertura Boscosa Chocó', categoria: 'Ambiental', descripcion: null }],
      documentos: [{ id: 'd1', titulo: 'Plan de Manejo 2025', tipo: 'informe', categoria: null, resumen: null }],
      geovisores: [makeGeovisor({ id: 'g1', slug: 'hidrografia', titulo: 'Hidrografía del Chocó' })],
    })
    renderPalette()
    expect(screen.getByText('Cobertura Boscosa Chocó')).toBeInTheDocument()
    expect(screen.getByText('Plan de Manejo 2025')).toBeInTheDocument()
    expect(screen.getByText('Hidrografía del Chocó')).toBeInTheDocument()
  })

  test('tolera errores de tipeo leves en el título de un resultado real', async () => {
    globalSearchContentMock.mockReturnValue({
      mapas:      [{ id: 'm1', titulo: 'Cobertura Boscosa Choco', categoria: 'Ambiental', descripcion: null }],
      documentos: [],
      geovisores: [],
    })
    const user = userEvent.setup()
    renderPalette()
    // "Boscosaa" con una letra de más — Levenshtein 1, dentro de tolerancia
    await user.type(screen.getByRole('combobox'), 'Boscosaa')
    expect(screen.getByText('Cobertura Boscosa Choco')).toBeInTheDocument()
  })

  test('seleccionar un mapa precarga el título en SearchContext y navega a /mapas', async () => {
    globalSearchContentMock.mockReturnValue({
      mapas:      [{ id: 'm1', titulo: 'Cobertura Boscosa Chocó', categoria: 'Ambiental', descripcion: null }],
      documentos: [],
      geovisores: [],
    })
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByText('Cobertura Boscosa Chocó'))
    expect(setPageQuerySpy).toHaveBeenCalledWith('Cobertura Boscosa Chocó')
    expect(navigateSpy).toHaveBeenCalledWith('/mapas')
  })

  test('seleccionar un geovisor navega directo a su ruta de detalle, sin precargar SearchContext', async () => {
    globalSearchContentMock.mockReturnValue({
      mapas: [], documentos: [],
      geovisores: [makeGeovisor({ id: 'g1', slug: 'hidrografia', titulo: 'Hidrografía del Chocó' })],
    })
    const user = userEvent.setup()
    renderPalette()
    await user.click(screen.getByText('Hidrografía del Chocó'))
    expect(navigateSpy).toHaveBeenCalledWith('/geovisores/hidrografia')
    expect(setPageQuerySpy).not.toHaveBeenCalled()
  })
})
