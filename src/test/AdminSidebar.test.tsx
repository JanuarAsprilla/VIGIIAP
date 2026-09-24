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

interface MockUser {
  name: string
  role: string
  rol?: string
  initials: string
  modulos?: { modulo: string; puede_ver: boolean; puede_editar: boolean }[]
}
const authMock = {
  user: { name: 'Ana Restrepo', role: ROLES.ADMIN, initials: 'AR' } as MockUser | null,
  logout: vi.fn(),
}
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderSidebar(mobileOpen: boolean, onClose = vi.fn(), initialPath = '/') {
  return {
    onClose,
    ...render(
      <MemoryRouter initialEntries={[initialPath]}>
        <AdminSidebar mobileOpen={mobileOpen} onClose={onClose} />
      </MemoryRouter>,
    ),
  }
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

  test('el enlace de la ruta activa muestra el indicador de activo; los demás no', () => {
    renderSidebar(false, vi.fn(), '/admin/usuarios')
    const usuariosLink = screen.getByText('Usuarios').closest('a')!
    const dashboardLink = screen.getByText('Dashboard').closest('a')!

    expect(usuariosLink.querySelector('.bg-primary-300')).not.toBeNull()
    expect(dashboardLink.querySelector('.bg-primary-300')).toBeNull()
  })

  test('en la ruta raíz del panel (/admin), el Dashboard es la única ruta activa (end: true)', () => {
    renderSidebar(false, vi.fn(), '/admin')
    const dashboardLink = screen.getByText('Dashboard').closest('a')!
    const usuariosLink = screen.getByText('Usuarios').closest('a')!

    expect(dashboardLink.querySelector('.bg-primary-300')).not.toBeNull()
    expect(usuariosLink.querySelector('.bg-primary-300')).toBeNull()
  })
})

describe('AdminSidebar — permisos por módulo (admin_sig delegado)', () => {
  test('un admin_sig con permisos restringidos solo ve los módulos habilitados', () => {
    authMock.user = {
      name: 'Delegado', role: ROLES.ADMIN, rol: 'admin_sig', initials: 'DL',
      modulos: [
        { modulo: 'solicitudes', puede_ver: true,  puede_editar: true },
        { modulo: 'documentos',  puede_ver: false, puede_editar: false },
      ],
    }
    renderSidebar(false)

    expect(screen.getByText('Dashboard')).toBeInTheDocument() // sin módulo asociado, siempre visible
    expect(screen.getByText('Solicitudes')).toBeInTheDocument()
    expect(screen.queryByText('Documentos')).not.toBeInTheDocument()
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument() // sin fila en modulos = deniega por defecto
  })

  test('un admin_sig sin ningún módulo de Gestión habilitado oculta la sección completa', () => {
    authMock.user = {
      name: 'Delegado', role: ROLES.ADMIN, rol: 'admin_sig', initials: 'DL',
      modulos: [{ modulo: 'actividad', puede_ver: true, puede_editar: false }],
    }
    renderSidebar(false)

    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument()
    expect(screen.queryByText('Documentos')).not.toBeInTheDocument()
    expect(screen.getByText('Actividad')).toBeInTheDocument()
  })

  test('super_admin ve todos los módulos aunque no traiga el campo modulos', () => {
    authMock.user = { name: 'Root', role: ROLES.SUPER_ADMIN, rol: 'super_admin', initials: 'RT' }
    renderSidebar(false)
    expect(screen.getByText('Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Documentos')).toBeInTheDocument()
  })

  // "Actividad" agrupa las pestañas de los módulos 'actividad' y 'reportes'
  // (ver pages/admin/Actividad.tsx) -- el enlace del sidebar debe verse con
  // cualquiera de los dos, no solo cuando el admin_sig tiene ambos.
  test('admin_sig con solo el módulo "reportes" (sin "actividad") sigue viendo el enlace Actividad', () => {
    authMock.user = {
      name: 'Delegado', role: ROLES.ADMIN, rol: 'admin_sig', initials: 'DL',
      modulos: [{ modulo: 'reportes', puede_ver: true, puede_editar: false }],
    }
    renderSidebar(false)
    expect(screen.getByText('Actividad')).toBeInTheDocument()
  })

  test('admin_sig con solo el módulo "actividad" (sin "reportes") sigue viendo el enlace Actividad', () => {
    authMock.user = {
      name: 'Delegado', role: ROLES.ADMIN, rol: 'admin_sig', initials: 'DL',
      modulos: [{ modulo: 'actividad', puede_ver: true, puede_editar: false }],
    }
    renderSidebar(false)
    expect(screen.getByText('Actividad')).toBeInTheDocument()
  })

  test('admin_sig sin "actividad" ni "reportes" no ve el enlace Actividad', () => {
    authMock.user = {
      name: 'Delegado', role: ROLES.ADMIN, rol: 'admin_sig', initials: 'DL',
      modulos: [{ modulo: 'solicitudes', puede_ver: true, puede_editar: true }],
    }
    renderSidebar(false)
    expect(screen.queryByText('Actividad')).not.toBeInTheDocument()
  })
})

describe('AdminSidebar — usuario y cierre de sesión', () => {
  test('no duplica el nombre/rol del usuario (ya visibles en el TopBar)', () => {
    renderSidebar(false)
    expect(screen.queryByText('Ana Restrepo')).not.toBeInTheDocument()
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
