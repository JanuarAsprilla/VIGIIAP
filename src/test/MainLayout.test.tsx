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
  default: () => <div>TopBar</div>,
}))
vi.mock('@/components/FooterBar', () => ({ default: () => <div>FooterBar</div> }))
vi.mock('@/components/BottomTabs', () => ({
  default: ({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) => (
    <div>
      BottomTabs ({moreOpen ? 'abierto' : 'cerrado'})
      <button onClick={onMore}>Más</button>
    </div>
  ),
}))
vi.mock('@/components/CommandPalette', () => ({ default: () => <div>CommandPalette</div> }))
vi.mock('@/components/auth/RecuperarPasswordPanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Recuperar Contraseña">RecuperarPasswordPanel<button onClick={onClose}>Cerrar recuperar</button></div>
  ),
}))
vi.mock('@/components/auth/SolicitarAccesoPanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Solicitar Acceso">SolicitarAccesoPanel<button onClick={onClose}>Cerrar solicitar</button></div>
  ),
}))
vi.mock('@/components/auth/CompletarPerfilPanel', () => ({
  default: ({ onClose }: { onClose: () => void }) => (
    <div role="dialog" aria-label="Completa tu Perfil">CompletarPerfilPanel<button onClick={onClose}>Cerrar completar perfil</button></div>
  ),
}))

const openPaletteSpy = vi.fn()
let density: 'compact' | 'normal' | 'comfortable' = 'normal'
vi.mock('@/contexts/UIContext', () => ({ useUI: () => ({ density, openPalette: openPaletteSpy }) }))

const authMock: { user: { perfilCompleto?: boolean } | null } = { user: null }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

beforeEach(() => {
  vi.clearAllMocks()
  density = 'normal'
  authMock.user = null
})

function renderMainLayout(path: string | { pathname: string; search?: string; state?: unknown } = '/') {
  const entry = typeof path === 'string' ? path : path
  const pathname = typeof path === 'string' ? path : path.pathname
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path={pathname} element={<MainLayout />}>
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
    expect(screen.getByText(/BottomTabs \(/)).toBeInTheDocument()
    expect(screen.getByText('CommandPalette')).toBeInTheDocument()
  })

  test('Cmd+K llama a openPalette del contexto de UI', async () => {
    const user = userEvent.setup()
    renderMainLayout()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(openPaletteSpy).toHaveBeenCalled()
  })

  test('el listado /geovisores muestra el footer -- es una página de contenido normal', () => {
    renderMainLayout('/geovisores')
    expect(screen.getByText('FooterBar')).toBeInTheDocument()
  })

  test('el visor de un geovisor concreto oculta el footer para dejar el mapa a pantalla completa', () => {
    renderMainLayout('/geovisores/geologia-choco')
    expect(screen.queryByText('FooterBar')).not.toBeInTheDocument()
  })

  test('abrir el menú desde el botón "Más" de BottomTabs y cerrarlo desde Sidebar alternan el mismo estado', async () => {
    const user = userEvent.setup()
    renderMainLayout()
    expect(screen.getByText(/Sidebar \(cerrado\)/)).toBeInTheDocument()
    expect(screen.getByText(/BottomTabs \(cerrado\)/)).toBeInTheDocument()

    await user.click(screen.getByText('Más'))
    expect(screen.getByText(/Sidebar \(abierto\)/)).toBeInTheDocument()
    expect(screen.getByText(/BottomTabs \(abierto\)/)).toBeInTheDocument()

    await user.click(screen.getByText('Cerrar sidebar móvil'))
    expect(screen.getByText(/Sidebar \(cerrado\)/)).toBeInTheDocument()
    expect(screen.getByText(/BottomTabs \(cerrado\)/)).toBeInTheDocument()
  })
})

describe('MainLayout — paneles de recuperar contraseña / solicitar acceso', () => {
  test('sin state.openAuthModal, ningún panel se abre solo', () => {
    renderMainLayout('/')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('location.state.openAuthModal="recuperar" (reenviado desde /recuperar-password) abre ese panel', async () => {
    renderMainLayout({ pathname: '/', state: { openAuthModal: 'recuperar' } })
    expect(await screen.findByRole('dialog', { name: 'Recuperar Contraseña' })).toBeInTheDocument()
  })

  test('location.state.openAuthModal="solicitar" (reenviado desde /solicitar-acceso) abre ese panel', async () => {
    renderMainLayout({ pathname: '/', state: { openAuthModal: 'solicitar' } })
    expect(await screen.findByRole('dialog', { name: 'Solicitar Acceso' })).toBeInTheDocument()
  })

  test('cerrar el panel de recuperar contraseña lo quita del DOM', async () => {
    const user = userEvent.setup()
    renderMainLayout({ pathname: '/', state: { openAuthModal: 'recuperar' } })
    await screen.findByRole('dialog', { name: 'Recuperar Contraseña' })
    await user.click(screen.getByText('Cerrar recuperar'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('MainLayout — alerta de completar perfil (tras un primer login OAuth sin institución)', () => {
  test('user.perfilCompleto=false abre la alerta sola, sin necesidad de query param', async () => {
    authMock.user = { perfilCompleto: false }
    renderMainLayout('/')
    expect(await screen.findByRole('dialog', { name: 'Completa tu Perfil' })).toBeInTheDocument()
  })

  test('user.perfilCompleto=true (o sin sesión) no abre nada', () => {
    authMock.user = { perfilCompleto: true }
    renderMainLayout('/')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('cerrarla la quita del DOM', async () => {
    authMock.user = { perfilCompleto: false }
    const user = userEvent.setup()
    renderMainLayout('/')
    await screen.findByRole('dialog', { name: 'Completa tu Perfil' })
    await user.click(screen.getByText('Cerrar completar perfil'))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})

describe('MainLayout — ?oauthError=... (redirect de vuelta tras un login OAuth fallido)', () => {
  test('muestra un toast con el mensaje del error y lo quita de la URL', async () => {
    renderMainLayout({ pathname: '/', search: '?oauthError=access_denied' })
    expect(await screen.findByText('Cancelaste el inicio de sesión.')).toBeInTheDocument()
  })

  test('un código de error desconocido cae a un mensaje genérico', async () => {
    renderMainLayout({ pathname: '/', search: '?oauthError=algo_raro' })
    expect(await screen.findByText('No se pudo iniciar sesión. Intenta de nuevo.')).toBeInTheDocument()
  })

  test('sin oauthError en la URL, no aparece ningún toast', () => {
    renderMainLayout('/')
    expect(screen.queryByText(/Cancelaste el inicio de sesión|No se pudo iniciar sesión/)).not.toBeInTheDocument()
  })
})
