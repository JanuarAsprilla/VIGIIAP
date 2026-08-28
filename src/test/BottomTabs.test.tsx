import { describe, test, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import BottomTabs from '@/components/BottomTabs'
import { ROLES } from '@/lib/constants/roles'

type MockUser = { role: string; isVisitante?: boolean } | null
const authMock: { isAuthenticated: boolean; user: MockUser } = { isAuthenticated: false, user: null }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderTabs() {
  return render(<MemoryRouter><BottomTabs /></MemoryRouter>)
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
  test('los módulos protegidos aparecen bloqueados', () => {
    renderTabs()
    expect(screen.queryByRole('link', { name: /Mapas/i })).not.toBeInTheDocument()
    expect(screen.getByText('Mapas').closest('[aria-disabled="true"]')).not.toBeNull()
  })
})

describe('BottomTabs — rol Público', () => {
  test('los módulos protegidos permanecen bloqueados', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: ROLES.PUBLICO }
    renderTabs()
    expect(screen.queryByRole('link', { name: /Documentos/i })).not.toBeInTheDocument()
  })
})

describe('BottomTabs — rol Visitante', () => {
  test('los módulos protegidos deberían permanecer bloqueados, igual que en Sidebar/TopBar', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: ROLES.VISITANTE, isVisitante: true }
    renderTabs()
    expect(screen.queryByRole('link', { name: /Herramientas/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Solicitudes/i })).not.toBeInTheDocument()
  })
})

describe('BottomTabs — usuario verificado', () => {
  test('los módulos protegidos se desbloquean como enlaces reales', () => {
    authMock.isAuthenticated = true
    authMock.user = { role: ROLES.INVESTIGADOR }
    renderTabs()
    expect(screen.getByRole('link', { name: /Mapas/i })).toHaveAttribute('href', '/mapas')
    expect(screen.getByRole('link', { name: /Solicitudes/i })).toHaveAttribute('href', '/solicitudes')
  })
})
