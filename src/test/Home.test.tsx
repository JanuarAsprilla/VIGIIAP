import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import Home from '@/pages/Home'

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

vi.mock('@/components/PlatformIntroSection', () => ({ default: () => null }))
vi.mock('@/components/NuevoAnalisisModal', () => ({ default: () => <div>Nuevo Análisis Modal</div> }))

const authMock = {
  isAuthenticated: false,
  user: null as { role: string; isVisitante: boolean } | null,
  isVisitante: false,
  loginVisitante: vi.fn(),
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

let searchQuery = ''
vi.mock('@/contexts/SearchContext', () => ({ useSearch: () => ({ query: searchQuery }) }))

function renderHome() {
  return render(<Home />, { wrapper: MemoryRouter })
}

beforeEach(() => {
  vi.clearAllMocks()
  searchQuery = ''
  authMock.isAuthenticated = false
  authMock.user = null
  authMock.isVisitante = false
})

describe('Home — FAB de nuevo análisis', () => {
  test('no aparece para un visitante no autenticado', () => {
    renderHome()
    expect(screen.queryByRole('button', { name: /Nuevo análisis/i })).not.toBeInTheDocument()
  })

  test('no aparece para un visitante autenticado (rol visitante)', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: 'Visitante', isVisitante: true }
    renderHome()
    expect(screen.queryByRole('button', { name: /Nuevo análisis/i })).not.toBeInTheDocument()
  })

  test('sí aparece para un usuario autenticado no-visitante', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: 'Investigador', isVisitante: false }
    renderHome()
    expect(screen.getByRole('button', { name: /Nuevo análisis/i })).toBeInTheDocument()
  })
})

describe('Home — CTA institucional', () => {
  test('se muestra el CTA de acceso institucional cuando no hay sesión', () => {
    renderHome()
    expect(screen.getByRole('link', { name: /Crear cuenta gratuita/i })).toBeInTheDocument()
  })

  test('el CTA no se muestra con sesión iniciada', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: 'Investigador', isVisitante: false }
    renderHome()
    expect(screen.queryByRole('link', { name: /Crear cuenta gratuita/i })).not.toBeInTheDocument()
  })

  test('"Acceder como visitante" llama a loginVisitante', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: /Acceder como visitante/i }))
    expect(authMock.loginVisitante).toHaveBeenCalled()
  })
})

describe('Home — modo búsqueda', () => {
  test('con una búsqueda activa, muestra resultados de módulos en vez de la landing', () => {
    searchQuery = 'mapas'
    renderHome()
    expect(screen.getByText(/Módulos para "mapas"|Sin resultados para "mapas"/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Crear cuenta gratuita/i })).not.toBeInTheDocument()
  })
})
