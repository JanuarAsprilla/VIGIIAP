import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { BarChart3, MapPinCheck } from 'lucide-react'
import Herramientas from '@/pages/Herramientas'

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

let searchQuery = ''
vi.mock('@/contexts/SearchContext', () => ({ useSearch: () => ({ query: searchQuery, setQuery: vi.fn() }) }))

let catalogoItems: unknown[] = []
let catalogoLoading = false
let catalogoError = false
vi.mock('@/hooks/useHerramientasCatalogo', () => ({
  useHerramientasCatalogo: () => ({ items: catalogoItems, isLoading: catalogoLoading, isError: catalogoError }),
}))

vi.mock('@/components/herramientas/ResumenActividad', () => ({ default: () => <div>Resumen de Actividad</div> }))
vi.mock('@/components/herramientas/SolicitarHerramientaModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>Modal Solicitar Herramienta</span>
      <button onClick={onClose}>Cerrar modal</button>
    </div>
  ),
}))

const CATALOGO_BASE = [
  {
    clave: 'panel-choco', titulo: 'Panel de Análisis Territorial — Chocó Biogeográfico', tag: 'Reportes',
    descripcion: 'Descripción del panel', activa: true, orden: 0, icon: BarChart3, color: 'gold' as const,
    Component: () => <div>Herramienta: Panel Chocó</div>,
  },
  {
    clave: 'validador-coordenadas', titulo: 'Validador de Coordenadas', tag: 'Calidad de datos',
    descripcion: 'Valida cada punto de un Excel contra los municipios.', activa: true, orden: 1, icon: MapPinCheck, color: 'primary' as const,
    Component: () => <div>Herramienta: Validador</div>,
  },
]

beforeEach(() => {
  vi.clearAllMocks()
  searchQuery = ''
  catalogoItems = CATALOGO_BASE
  catalogoLoading = false
  catalogoError = false
})

describe('Herramientas — grilla y filtrado', () => {
  beforeEach(() => window.localStorage.clear())

  test('muestra todas las herramientas como tarjetas pequeñas y el resumen de actividad', () => {
    render(<Herramientas />)
    expect(screen.getByText('Panel de Análisis Territorial — Chocó Biogeográfico')).toBeInTheDocument()
    expect(screen.getByText('Validador de Coordenadas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abrir Panel de Análisis Territorial/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abrir Validador de Coordenadas/i })).toBeInTheDocument()
    // El contenido de cada herramienta solo se monta al abrirla.
    expect(screen.queryByText('Herramienta: Panel Chocó')).not.toBeInTheDocument()
    expect(screen.queryByText('Herramienta: Validador')).not.toBeInTheDocument()
    expect(screen.getByText('Resumen de Actividad')).toBeInTheDocument()
  })

  test('mientras carga, muestra el esqueleto en vez de la grilla', () => {
    catalogoLoading = true
    render(<Herramientas />)
    expect(screen.getByRole('status', { name: /Cargando herramientas/i })).toBeInTheDocument()
    expect(screen.queryByText('Validador de Coordenadas')).not.toBeInTheDocument()
  })

  test('abrir una herramienta la muestra a pantalla completa y "Volver" regresa a la grilla', async () => {
    const user = userEvent.setup()
    render(<Herramientas />)

    await user.click(screen.getByRole('button', { name: /Abrir Validador de Coordenadas/i }))
    expect(screen.getByText('Herramienta: Validador')).toBeInTheDocument()
    expect(screen.queryByText('Panel de Análisis Territorial — Chocó Biogeográfico')).not.toBeInTheDocument()
    expect(screen.queryByText('Resumen de Actividad')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Volver a Herramientas/i }))
    expect(screen.queryByText('Herramienta: Validador')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abrir Validador de Coordenadas/i })).toBeInTheDocument()
  })

  test('filtra herramientas por título o categoría según la búsqueda global', () => {
    searchQuery = 'reportes'
    render(<Herramientas />)
    expect(screen.getByText('Panel de Análisis Territorial — Chocó Biogeográfico')).toBeInTheDocument()
    expect(screen.queryByText('Validador de Coordenadas')).not.toBeInTheDocument()
  })

  test('oculta el resumen de actividad mientras hay una búsqueda activa', () => {
    searchQuery = 'validador'
    render(<Herramientas />)
    expect(screen.queryByText('Resumen de Actividad')).not.toBeInTheDocument()
  })

  test('sin coincidencias, muestra el estado vacío con el término buscado', () => {
    searchQuery = 'inexistente-xyz'
    render(<Herramientas />)
    expect(screen.getByText(/No se encontraron herramientas para/i)).toBeInTheDocument()
    expect(screen.getByText('"inexistente-xyz"')).toBeInTheDocument()
  })

  test('el selector de columnas cambia la cuadrícula y se recuerda en este navegador', async () => {
    const user = userEvent.setup()
    const { container, unmount } = render(<Herramientas />)
    const grilla = () => container.querySelector('.grid.gap-6') as HTMLElement
    expect(grilla().className).toContain('xl:grid-cols-3')

    await user.click(screen.getByRole('button', { name: '1 columna' }))
    expect(grilla().className).toContain('grid-cols-1')
    expect(grilla().className).not.toContain('md:grid-cols-2')
    expect(screen.getByRole('button', { name: '1 columna' })).toHaveAttribute('aria-pressed', 'true')
    expect(window.localStorage.getItem('vigiiap:herramientas-cols')).toBe('1')

    unmount()
    const otra = render(<Herramientas />)
    expect(otra.container.querySelector('.grid.gap-6')?.className).not.toContain('md:grid-cols-2')
    expect(screen.getByRole('button', { name: '1 columna' })).toHaveAttribute('aria-pressed', 'true')
  })

  test('2 columnas aplica la cuadrícula de dos columnas', async () => {
    const user = userEvent.setup()
    const { container } = render(<Herramientas />)
    await user.click(screen.getByRole('button', { name: '2 columnas' }))
    const clases = (container.querySelector('.grid.gap-6') as HTMLElement).className
    expect(clases).toContain('md:grid-cols-2')
    expect(clases).not.toContain('xl:grid-cols-3')
  })

  // Regresión: antes de distinguir "sin catálogo" de "sin resultados de
  // búsqueda", un catálogo vacío o inalcanzable mostraba el confuso
  // 'No se encontraron herramientas para ""' sin haber buscado nada.
  test('catálogo vacío sin búsqueda activa muestra un mensaje distinto al de "sin resultados"', () => {
    catalogoItems = []
    render(<Herramientas />)
    expect(screen.getByText('No hay herramientas disponibles todavía.')).toBeInTheDocument()
    expect(screen.queryByText(/No se encontraron herramientas para/i)).not.toBeInTheDocument()
  })

  test('catálogo inalcanzable (isError) muestra el mensaje de error, no el de catálogo vacío', () => {
    catalogoItems = []
    catalogoError = true
    render(<Herramientas />)
    expect(screen.getByText(/No se pudo cargar el catálogo de herramientas/i)).toBeInTheDocument()
  })

  test('Solicitar herramienta abre el modal y cerrarlo lo oculta', async () => {
    const user = userEvent.setup()
    render(<Herramientas />)
    expect(screen.queryByText('Modal Solicitar Herramienta')).not.toBeInTheDocument()

    await user.click(screen.getByText('Solicitar herramienta'))
    expect(screen.getByText('Modal Solicitar Herramienta')).toBeInTheDocument()

    await user.click(screen.getByText('Cerrar modal'))
    expect(screen.queryByText('Modal Solicitar Herramienta')).not.toBeInTheDocument()
  })
})
