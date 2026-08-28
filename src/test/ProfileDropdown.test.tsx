import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import ProfileDropdown from '@/components/topbar/ProfileDropdown'
import { ROLES } from '@/lib/constants/roles'
import type { AuthUser } from '@/contexts/AuthContext'

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

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    name: 'Ana Restrepo',
    email: 'ana@example.com',
    initials: 'AR',
    role: ROLES.INVESTIGADOR,
    isVisitante: false,
    ...overrides,
  } as AuthUser
}

const onClose = vi.fn()
const onLogout = vi.fn()

function renderDropdown(user: AuthUser | null) {
  return render(
    <MemoryRouter>
      <ProfileDropdown user={user} onClose={onClose} onLogout={onLogout} />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('ProfileDropdown — usuario no verificado', () => {
  test('muestra la insignia "Sin verificar" y el CTA de solicitar acceso, sin ítems de sesión completa', () => {
    renderDropdown(makeUser({ isVisitante: true, role: ROLES.VISITANTE }))
    expect(screen.getByText('Sin verificar')).toBeInTheDocument()
    expect(screen.getByText('Solicitar acceso institucional')).toBeInTheDocument()
    expect(screen.queryByText('Mi Perfil')).not.toBeInTheDocument()
    expect(screen.queryByText('Mis Solicitudes')).not.toBeInTheDocument()
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument()
  })
})

describe('ProfileDropdown — usuario verificado', () => {
  test('investigador ve su perfil y solicitudes, pero no el panel admin', () => {
    renderDropdown(makeUser({ role: ROLES.INVESTIGADOR }))
    expect(screen.getByText('Mi Perfil')).toBeInTheDocument()
    expect(screen.getByText('Mis Solicitudes')).toBeInTheDocument()
    expect(screen.queryByText('Panel Admin')).not.toBeInTheDocument()
    expect(screen.getByText(ROLES.INVESTIGADOR)).toBeInTheDocument()
  })

  test('admin_sig ve el Panel Admin y la insignia "Admin SIG"', () => {
    renderDropdown(makeUser({ role: ROLES.ADMIN }))
    expect(screen.getByText('Panel Admin')).toBeInTheDocument()
    expect(screen.getByText('Admin SIG')).toBeInTheDocument()
  })

  test('super_admin ve el Panel Admin y la insignia "Super Admin"', () => {
    renderDropdown(makeUser({ role: ROLES.SUPER_ADMIN }))
    expect(screen.getByText('Panel Admin')).toBeInTheDocument()
    expect(screen.getByText('Super Admin')).toBeInTheDocument()
  })

  test('clic en un ítem de navegación cierra el panel', async () => {
    const user = userEvent.setup()
    renderDropdown(makeUser({ role: ROLES.INVESTIGADOR }))
    await user.click(screen.getByText('Mi Perfil'))
    expect(onClose).toHaveBeenCalled()
  })

  test('clic en "Cerrar Sesión" llama a onLogout', async () => {
    const user = userEvent.setup()
    renderDropdown(makeUser({ role: ROLES.INVESTIGADOR }))
    await user.click(screen.getByText('Cerrar Sesión'))
    expect(onLogout).toHaveBeenCalled()
  })
})
