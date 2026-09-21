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

vi.mock('@/components/herramientas/ConversorCoordenadas', () => ({ default: () => <div>Herramienta: Conversor</div> }))
vi.mock('@/components/herramientas/PanelChocoTool', () => ({ default: () => <div>Herramienta: Panel Chocó</div> }))
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
  test('muestra las 2 herramientas y el resumen de actividad sin búsqueda', () => {
    render(<Herramientas />)
    expect(screen.getByText('Herramienta: Conversor')).toBeInTheDocument()
    // Panel Chocó es "focusable" — en la grilla se ve su tarjeta lanzadora, no su
    // contenido (que solo se monta al abrirlo, ver siguiente test).
    expect(screen.getByText('Panel de Análisis Territorial — Chocó Biogeográfico')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Abrir panel completo/i })).toBeInTheDocument()
    expect(screen.queryByText('Herramienta: Panel Chocó')).not.toBeInTheDocument()
    expect(screen.getByText('Resumen de Actividad')).toBeInTheDocument()
  })

  test('abrir una herramienta focusable la muestra a pantalla completa y "Volver" regresa a la grilla', async () => {
    const user = userEvent.setup()
    render(<Herramientas />)

    await user.click(screen.getByRole('button', { name: /Abrir panel completo/i }))
    expect(screen.getByText('Herramienta: Panel Chocó')).toBeInTheDocument()
    expect(screen.queryByText('Herramienta: Conversor')).not.toBeInTheDocument()
    expect(screen.queryByText('Resumen de Actividad')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Volver a Herramientas/i }))
    expect(screen.queryByText('Herramienta: Panel Chocó')).not.toBeInTheDocument()
    expect(screen.getByText('Herramienta: Conversor')).toBeInTheDocument()
  })

  test('filtra herramientas por título o categoría según la búsqueda global', () => {
    searchQuery = 'reportes'
    render(<Herramientas />)
    expect(screen.getByText('Panel de Análisis Territorial — Chocó Biogeográfico')).toBeInTheDocument()
    expect(screen.queryByText('Herramienta: Conversor')).not.toBeInTheDocument()
  })

  test('oculta el resumen de actividad mientras hay una búsqueda activa', () => {
    searchQuery = 'conversor'
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
