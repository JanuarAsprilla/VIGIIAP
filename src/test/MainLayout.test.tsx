import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import MainLayout from '@/layouts/MainLayout'

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

vi.mock('@/hooks/useLenis', () => ({ useLenis: () => {} }))
vi.mock('@/components/Sidebar', () => ({
  default: ({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) => (
    <div>
      Sidebar ({mobileOpen ? 'abierto' : 'cerrado'})
      <button onClick={onClose}>Cerrar sidebar móvil</button>
    </div>
  ),
}))
vi.mock('@/components/TopBar', () => ({
  default: ({ onMenuToggle }: { onMenuToggle: () => void }) => (
    <div>
      TopBar
      <button onClick={onMenuToggle}>Abrir menú móvil</button>
    </div>
  ),
}))
vi.mock('@/components/FooterBar', () => ({ default: () => <div>FooterBar</div> }))
vi.mock('@/components/BottomTabs', () => ({ default: () => <div>BottomTabs</div> }))
vi.mock('@/components/CommandPalette', () => ({ default: () => <div>CommandPalette</div> }))

const openPaletteSpy = vi.fn()
let density: 'compact' | 'normal' | 'comfortable' = 'normal'
vi.mock('@/contexts/UIContext', () => ({ useUI: () => ({ density, openPalette: openPaletteSpy }) }))

beforeEach(() => {
  vi.clearAllMocks()
  density = 'normal'
})

function renderMainLayout(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={path} element={<MainLayout />}>
          <Route index element={<div>Contenido de la página</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('MainLayout — orquestación del shell principal', () => {
  test('renderiza sidebar, topbar, contenido, footer, bottom tabs y command palette', () => {
    renderMainLayout()
    expect(screen.getByText(/Sidebar \(/)).toBeInTheDocument()
    expect(screen.getByText('TopBar')).toBeInTheDocument()
    expect(screen.getByText('Contenido de la página')).toBeInTheDocument()
    expect(screen.getByText('FooterBar')).toBeInTheDocument()
    expect(screen.getByText('BottomTabs')).toBeInTheDocument()
    expect(screen.getByText('CommandPalette')).toBeInTheDocument()
  })

  test('Cmd+K llama a openPalette del contexto de UI', async () => {
    const user = userEvent.setup()
    renderMainLayout()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(openPaletteSpy).toHaveBeenCalled()
  })

  test('en /geovisor oculta el footer para dejar el mapa a pantalla completa', () => {
    renderMainLayout('/geovisor')
    expect(screen.queryByText('FooterBar')).not.toBeInTheDocument()
  })

  test('abrir el menú móvil desde TopBar y cerrarlo desde Sidebar alternan el mismo estado', async () => {
    const user = userEvent.setup()
    renderMainLayout()
    expect(screen.getByText(/Sidebar \(cerrado\)/)).toBeInTheDocument()

    await user.click(screen.getByText('Abrir menú móvil'))
    expect(screen.getByText(/Sidebar \(abierto\)/)).toBeInTheDocument()

    await user.click(screen.getByText('Cerrar sidebar móvil'))
    expect(screen.getByText(/Sidebar \(cerrado\)/)).toBeInTheDocument()
  })
})
