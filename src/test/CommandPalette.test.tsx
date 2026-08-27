import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import CommandPalette from '@/components/CommandPalette'

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
    await user.type(screen.getByRole('combobox'), 'geovisor')
    expect(screen.getByText('Geovisor')).toBeInTheDocument()
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
    await user.type(screen.getByRole('combobox'), 'geovisor')
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
