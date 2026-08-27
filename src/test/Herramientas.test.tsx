import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
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

vi.mock('@/components/herramientas/CalculadoraAreas', () => ({ default: () => <div>Herramienta: Calculadora</div> }))
vi.mock('@/components/herramientas/GeneradorBuffers', () => ({ default: () => <div>Herramienta: Buffers</div> }))
vi.mock('@/components/herramientas/ConversorCoordenadas', () => ({ default: () => <div>Herramienta: Conversor</div> }))
vi.mock('@/components/herramientas/AnalizadorSuperposicion', () => ({ default: () => <div>Herramienta: Superposición</div> }))
vi.mock('@/components/herramientas/Geoformularios', () => ({ default: () => <div>Herramienta: Geoformularios</div> }))
vi.mock('@/components/herramientas/AplicacionesMoviles', () => ({ default: () => <div>Herramienta: Apps Móviles</div> }))
vi.mock('@/components/herramientas/TablerosControl', () => ({ default: () => <div>Herramienta: Tableros</div> }))
vi.mock('@/components/herramientas/ResumenActividad', () => ({ default: () => <div>Resumen de Actividad</div> }))
vi.mock('@/components/herramientas/SolicitarHerramientaModal', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div>
      <span>Modal Solicitar Herramienta</span>
      <button onClick={onClose}>Cerrar modal</button>
    </div>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
  searchQuery = ''
})

describe('Herramientas — grilla y filtrado', () => {
  test('muestra las 7 herramientas y el resumen de actividad sin búsqueda', () => {
    render(<Herramientas />)
    expect(screen.getByText('Herramienta: Calculadora')).toBeInTheDocument()
    expect(screen.getByText('Herramienta: Tableros')).toBeInTheDocument()
    expect(screen.getByText('Resumen de Actividad')).toBeInTheDocument()
  })

  test('filtra herramientas por título o categoría según la búsqueda global', () => {
    searchQuery = 'coordenadas'
    render(<Herramientas />)
    expect(screen.getByText('Herramienta: Conversor')).toBeInTheDocument()
    expect(screen.queryByText('Herramienta: Calculadora')).not.toBeInTheDocument()
  })

  test('oculta el resumen de actividad mientras hay una búsqueda activa', () => {
    searchQuery = 'buffers'
    render(<Herramientas />)
    expect(screen.queryByText('Resumen de Actividad')).not.toBeInTheDocument()
  })

  test('sin coincidencias, muestra el estado vacío con el término buscado', () => {
    searchQuery = 'inexistente-xyz'
    render(<Herramientas />)
    expect(screen.getByText(/No se encontraron herramientas para/i)).toBeInTheDocument()
    expect(screen.getByText('"inexistente-xyz"')).toBeInTheDocument()
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
