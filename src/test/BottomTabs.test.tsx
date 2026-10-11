import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomTabs from '@/components/BottomTabs'
import { ROLES } from '@/lib/constants/roles'

type MockUser = { role: string; isVisitante?: boolean } | null
const authMock: { isAuthenticated: boolean; user: MockUser } = { isAuthenticated: false, user: null }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderTabs(props: { onMore?: () => void; moreOpen?: boolean } = {}) {
  const { onMore = vi.fn(), moreOpen = false } = props
  return render(<MemoryRouter><BottomTabs onMore={onMore} moreOpen={moreOpen} /></MemoryRouter>)
}

beforeEach(() => {
  authMock.isAuthenticated = false
  authMock.user = null
})

describe('BottomTabs — Inicio siempre accesible', () => {
  test('Inicio es un enlace real incluso sin sesión', () => {
    renderTabs()
    expect(screen.getByRole('link', { name: /Inicio/i })).toHaveAttribute('href', '/')
  })
})

describe('BottomTabs — sin sesión', () => {
  test('Mapas, Documentos y Herramientas son enlaces reales — son públicos', () => {
    renderTabs()
    expect(screen.getByRole('link', { name: /Mapas/i })).toHaveAttribute('href', '/mapas')
    expect(screen.getByRole('link', { name: /Documentos/i })).toHaveAttribute('href', '/documentos')
    expect(screen.getByRole('link', { name: /Herramientas/i })).toHaveAttribute('href', '/herramientas')
  })

  test('Solicitudes no se muestra en absoluto — no aparece como tab bloqueado, se oculta', () => {
    renderTabs()
    expect(screen.queryByRole('link', { name: /Solicitudes/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Solicitudes')).not.toBeInTheDocument()
  })
})

describe('BottomTabs — rol Público', () => {
  test('Documentos es un enlace real; Solicitudes sigue oculto', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: ROLES.PUBLICO }
    renderTabs()
    expect(screen.getByRole('link', { name: /Documentos/i })).toHaveAttribute('href', '/documentos')
    expect(screen.queryByText('Solicitudes')).not.toBeInTheDocument()
  })
})

describe('BottomTabs — rol Visitante', () => {
  test('Herramientas es un enlace real; Solicitudes sigue oculto', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: ROLES.VISITANTE, isVisitante: true }
    renderTabs()
    expect(screen.getByRole('link', { name: /Herramientas/i })).toHaveAttribute('href', '/herramientas')
    expect(screen.queryByText('Solicitudes')).not.toBeInTheDocument()
  })
})

describe('BottomTabs — usuario verificado', () => {
  test('todos los módulos, incluido Solicitudes, son enlaces reales', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: ROLES.INVESTIGADOR }
    renderTabs()
    expect(screen.getByRole('link', { name: /Mapas/i })).toHaveAttribute('href', '/mapas')
    expect(screen.getByRole('link', { name: /Solicitudes/i })).toHaveAttribute('href', '/solicitudes')
  })
})

describe('BottomTabs — botón Más', () => {
  test('invoca onMore al hacer clic', () => {
    const onMore = vi.fn()
    renderTabs({ onMore })
    screen.getByRole('button', { name: /Más opciones/i }).click()
    expect(onMore).toHaveBeenCalledTimes(1)
  })

  test('refleja el estado abierto vía aria-expanded', () => {
    renderTabs({ moreOpen: true })
    expect(screen.getByRole('button', { name: /Más opciones/i })).toHaveAttribute('aria-expanded', 'true')
  })

  test('refleja el estado cerrado vía aria-expanded', () => {
    renderTabs({ moreOpen: false })
    expect(screen.getByRole('button', { name: /Más opciones/i })).toHaveAttribute('aria-expanded', 'false')
  })
})
