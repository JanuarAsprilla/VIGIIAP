import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import AdminSidebar from '@/components/AdminSidebar'
import { ROLES } from '@/lib/constants/roles'

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

const authMock = {
  user: { name: 'Ana Restrepo', role: ROLES.ADMIN, initials: 'AR' } as { name: string; role: string; initials: string } | null,
  logout: vi.fn(),
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderSidebar(mobileOpen: boolean, onClose = vi.fn()) {
  return { onClose, ...render(<MemoryRouter><AdminSidebar mobileOpen={mobileOpen} onClose={onClose} /></MemoryRouter>) }
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.user = { name: 'Ana Restrepo', role: ROLES.ADMIN, initials: 'AR' }
})

describe('AdminSidebar — navegación', () => {
  test('renderiza los enlaces de todas las secciones', () => {
    renderSidebar(false)
    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Categorías')).toBeInTheDocument()
    expect(screen.getByText('Actividad')).toBeInTheDocument()
  })

  test('sin drawer móvil abierto, el contenido solo aparece una vez (versión desktop)', () => {
    renderSidebar(false)
    expect(screen.getAllByText('Dashboard')).toHaveLength(1)
  })

  test('con el drawer móvil abierto, el contenido se duplica (desktop + drawer)', () => {
    renderSidebar(true)
    expect(screen.getAllByText('Dashboard')).toHaveLength(2)
  })

  test('la sección Super Admin solo aparece para el rol Super Administrador', () => {
    renderSidebar(false)
    expect(screen.queryByText('Gestión de Admins')).not.toBeInTheDocument()
  })

  test('con rol Super Administrador, muestra la sección exclusiva', () => {
    authMock.user = { name: 'Root', role: ROLES.SUPER_ADMIN, initials: 'RT' }
    renderSidebar(false)
    expect(screen.getByText('Gestión de Admins')).toBeInTheDocument()
  })
})

describe('AdminSidebar — usuario y cierre de sesión', () => {
  test('muestra el nombre y rol del usuario autenticado', () => {
    renderSidebar(false)
    expect(screen.getByText('Ana Restrepo')).toBeInTheDocument()
    expect(screen.getByText(ROLES.ADMIN)).toBeInTheDocument()
  })

  test('cerrar sesión llama a logout() y a onClose()', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSidebar(false)
    await user.click(screen.getByText('Cerrar Sesión'))
    expect(authMock.logout).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })
})

describe('AdminSidebar — drawer móvil', () => {
  test('clic en el overlay llama a onClose', async () => {
    const user = userEvent.setup()
    const { onClose, container } = renderSidebar(true)
    const overlay = container.querySelector('.fixed.inset-0.z-50.bg-black\\/40')
    expect(overlay).not.toBeNull()
    await user.click(overlay as Element)
    expect(onClose).toHaveBeenCalled()
  })

  test('el botón de cerrar menú llama a onClose', async () => {
    const user = userEvent.setup()
    const { onClose } = renderSidebar(true)
    await user.click(screen.getAllByLabelText('Cerrar menú')[0])
    expect(onClose).toHaveBeenCalled()
  })
})
