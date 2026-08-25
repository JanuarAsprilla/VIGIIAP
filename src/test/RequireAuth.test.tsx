/**
 * Tests for the route guards in RequireAuth.tsx — the components that gate
 * every protected route and the whole admin panel. useAuth() is mocked with
 * realistic AuthUser shapes (mirroring normalizeUser() in AuthContext.tsx)
 * so each guard's actual role logic is exercised, not just a stub.
 */
import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import type { ReactElement } from 'react'
import RequireAuth, {
  RequireInvestigador, RequireAdmin, RequireSuperAdmin, RequireVerified,
} from '@/components/RequireAuth'
import { ROLES } from '@/lib/constants/roles'

vi.mock('@/contexts/AuthContext', () => ({ useAuth: vi.fn() }))
import { useAuth } from '@/contexts/AuthContext'

// Mirrors normalizeUser() in AuthContext.tsx exactly, so guards see the same
// shape they see in production instead of a hand-picked partial mock.
const ROLE_LABEL: Record<string, string> = {
  super_admin: ROLES.SUPER_ADMIN, admin_sig: ROLES.ADMIN, investigador: ROLES.INVESTIGADOR,
  tecnico: ROLES.TECNICO, institucional: ROLES.INSTITUCIONAL, publico: ROLES.PUBLICO, visitante: ROLES.VISITANTE,
}
function makeUser(rolBackend: keyof typeof ROLE_LABEL) {
  return {
    id: 'u1', name: 'Test User', email: 't@iiap.gov.co',
    role: ROLE_LABEL[rolBackend], rol: rolBackend,
    tipo: rolBackend === 'visitante' ? 'visitante' : null,
    isVisitante: rolBackend === 'visitante',
    initials: 'TU', institucion: null, twoFactorEnabled: false,
  }
}

function mockAuth(overrides: Record<string, unknown>) {
  vi.mocked(useAuth).mockReturnValue({
    isAuthenticated: false, initializing: false, user: null,
    isAdmin: false, isSuperAdmin: false, isVisitante: false,
    loading: false, login: vi.fn(), loginVisitante: vi.fn(), logout: vi.fn(),
    register: vi.fn(), refreshProfile: vi.fn(),
    ...overrides,
     
  } as any)
}

function renderGuard(Guard: () => ReactElement) {
  return render(
    <MemoryRouter initialEntries={['/protegido']}>
      <Routes>
        <Route element={<Guard />}>
          <Route path="/protegido" element={<div>Contenido protegido</div>} />
        </Route>
        <Route path="/login" element={<div>Pantalla de login</div>} />
        <Route path="/" element={<div>Home pública</div>} />
        <Route path="/solicitar-acceso" element={<div>Solicitar acceso</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireAuth', () => {
  test('shows a spinner while the session is still initializing', () => {
    mockAuth({ initializing: true })
    renderGuard(RequireAuth)
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.queryByText('Contenido protegido')).not.toBeInTheDocument()
  })

  test('redirects to /login when there is no session', () => {
    mockAuth({ isAuthenticated: false })
    renderGuard(RequireAuth)
    expect(screen.getByText('Pantalla de login')).toBeInTheDocument()
  })

  test('renders the protected route when authenticated', () => {
    mockAuth({ isAuthenticated: true, user: makeUser('publico') })
    renderGuard(RequireAuth)
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })
})

describe('RequireAdmin', () => {
  test('redirects to / when the user is not admin_sig/super_admin', () => {
    mockAuth({ isAuthenticated: true, isAdmin: false, user: makeUser('investigador') })
    renderGuard(RequireAdmin)
    expect(screen.getByText('Home pública')).toBeInTheDocument()
  })

  test('renders the admin panel when isAdmin is true', () => {
    mockAuth({ isAuthenticated: true, isAdmin: true, user: makeUser('admin_sig') })
    renderGuard(RequireAdmin)
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })
})

describe('RequireSuperAdmin', () => {
  test('redirects to / for a plain admin_sig (not super_admin)', () => {
    mockAuth({ isAuthenticated: true, isAdmin: true, isSuperAdmin: false, user: makeUser('admin_sig') })
    renderGuard(RequireSuperAdmin)
    expect(screen.getByText('Home pública')).toBeInTheDocument()
  })

  test('renders for super_admin', () => {
    mockAuth({ isAuthenticated: true, isAdmin: true, isSuperAdmin: true, user: makeUser('super_admin') })
    renderGuard(RequireSuperAdmin)
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })
})

describe('RequireVerified — gates /perfil y /solicitudes', () => {
  test.each(['visitante', 'publico'] as const)('redirects %s to /solicitar-acceso', (rol) => {
    mockAuth({ isAuthenticated: true, user: makeUser(rol) })
    renderGuard(RequireVerified)
    expect(screen.getByText('Solicitar acceso')).toBeInTheDocument()
  })

  test.each(['investigador', 'tecnico', 'institucional', 'admin_sig', 'super_admin'] as const)(
    'allows %s through', (rol) => {
      mockAuth({ isAuthenticated: true, user: makeUser(rol) })
      renderGuard(RequireVerified)
      expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
    },
  )
})

describe('RequireInvestigador — gates /geovisor y /herramientas', () => {
  test.each(['visitante', 'publico'] as const)('redirects %s to /', (rol) => {
    mockAuth({ isAuthenticated: true, user: makeUser(rol) })
    renderGuard(RequireInvestigador)
    expect(screen.getByText('Home pública')).toBeInTheDocument()
  })

  test('allows investigador through', () => {
    mockAuth({ isAuthenticated: true, user: makeUser('investigador') })
    renderGuard(RequireInvestigador)
    expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
  })

  // El docstring del componente y el comentario en App.tsx dicen ambos
  // "Requiere Investigador o Admin (bloquea Público y Visitante)" — pero el
  // código solo bloquea publico/visitante, así que tecnico/institucional
  // también pasan hoy. Este test documenta el comportamiento REAL (no lo
  // que dice el comentario) para que un cambio futuro sea intencional, no
  // accidental. Ver nota en el PR: es una decisión de producto pendiente,
  // no algo que este PR deba decidir unilateralmente.
  test.each(['tecnico', 'institucional'] as const)(
    'el código actual también deja pasar a %s, aunque el comentario del guard dice "Investigador o Admin"',
    (rol) => {
      mockAuth({ isAuthenticated: true, user: makeUser(rol) })
      renderGuard(RequireInvestigador)
      expect(screen.getByText('Contenido protegido')).toBeInTheDocument()
    },
  )
})
