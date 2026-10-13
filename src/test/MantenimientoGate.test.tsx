import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import MantenimientoGate from '@/components/MantenimientoGate'

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
vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) => <div className={className}>{children}</div>,
}))

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

const auth = { isAdmin: false, isAuthenticated: false, initializing: false, logout: vi.fn() }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => auth }))

function renderGate(ruta = '/mapas') {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <MantenimientoGate><p>Contenido de la plataforma</p></MantenimientoGate>
    </MemoryRouter>,
  )
}

const estado = (mantenimiento: boolean, mensaje: string | null = null) =>
  vi.mocked(api.get).mockResolvedValue({ mantenimiento, mensaje } as never)

beforeEach(() => {
  vi.clearAllMocks()
  Object.assign(auth, { isAdmin: false, isAuthenticated: false, initializing: false })
})
afterEach(() => vi.useRealTimers())

describe('MantenimientoGate', () => {
  test('con la plataforma operativa muestra la aplicación', async () => {
    estado(false)
    renderGate()

    expect(await screen.findByText('Contenido de la plataforma')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/estado')
  })

  test('en mantenimiento reemplaza toda la aplicación por el aviso, en cualquier ruta', async () => {
    estado(true, 'Volvemos a las 6 pm.')
    renderGate('/mapas')

    expect(await screen.findByText('Sitio en mantenimiento')).toBeInTheDocument()
    expect(screen.getByText('Volvemos a las 6 pm.')).toBeInTheDocument()
    expect(screen.queryByText('Contenido de la plataforma')).not.toBeInTheDocument()
  })

  test.each(['/', '/geovisores/estaciones', '/documentos', '/admin'])('también en %s', async (ruta) => {
    estado(true)
    renderGate(ruta)

    expect(await screen.findByText('Sitio en mantenimiento')).toBeInTheDocument()
  })

  test('sin mensaje configurado usa el mensaje por defecto', async () => {
    estado(true, null)
    renderGate()

    expect(await screen.findByText(/La plataforma está en mantenimiento/)).toBeInTheDocument()
  })

  test.each(['/login', '/recuperar-password', '/reset-password/abc123', '/verificar-2fa'])(
    'deja ver %s para que un administrador pueda entrar',
    async (ruta) => {
      estado(true)
      renderGate(ruta)

      expect(await screen.findByText('Contenido de la plataforma')).toBeInTheDocument()
      expect(screen.queryByText('Sitio en mantenimiento')).not.toBeInTheDocument()
    },
  )

  test('un administrador con sesión sigue usando la plataforma', async () => {
    auth.isAdmin = true
    auth.isAuthenticated = true
    estado(true)
    renderGate('/admin/configuracion')

    expect(await screen.findByText('Contenido de la plataforma')).toBeInTheDocument()
    expect(screen.queryByText('Sitio en mantenimiento')).not.toBeInTheDocument()
  })

  test('mientras se verifica la sesión no muestra el aviso (evita el parpadeo a un administrador)', async () => {
    auth.initializing = true
    estado(true)
    renderGate()

    await act(async () => { await Promise.resolve() })

    expect(screen.queryByText('Sitio en mantenimiento')).not.toBeInTheDocument()
    expect(screen.queryByText('Contenido de la plataforma')).not.toBeInTheDocument()
  })

  test('un usuario con sesión que no es administrador puede cerrarla desde el aviso', async () => {
    auth.isAuthenticated = true
    estado(true)
    const user = userEvent.setup()
    renderGate()

    await user.click(await screen.findByRole('button', { name: 'Cerrar mi sesión' }))

    expect(auth.logout).toHaveBeenCalled()
  })

  test('sin sesión el aviso no ofrece cerrar sesión', async () => {
    estado(true)
    renderGate()

    await screen.findByText('Sitio en mantenimiento')
    expect(screen.queryByRole('button', { name: 'Cerrar mi sesión' })).not.toBeInTheDocument()
  })

  test('un 503 con maintenance:true en cualquier petición lo activa al instante', async () => {
    estado(false)
    renderGate()
    await screen.findByText('Contenido de la plataforma')

    act(() => {
      window.dispatchEvent(new CustomEvent('vigiiap:maintenance', { detail: { message: 'Mantenimiento urgente.' } }))
    })

    expect(await screen.findByText('Mantenimiento urgente.')).toBeInTheDocument()
  })

  test('cuando el mantenimiento termina, la aplicación vuelve sola sin recargar', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    estado(true, 'Volvemos pronto.')
    renderGate()
    await screen.findByText('Sitio en mantenimiento')

    estado(false)
    await act(async () => { await vi.advanceTimersByTimeAsync(31_000) })

    expect(await screen.findByText('Contenido de la plataforma')).toBeInTheDocument()
    expect(screen.queryByText('Sitio en mantenimiento')).not.toBeInTheDocument()
  })

  test('si el estado no se puede consultar, conserva el último conocido en vez de asumir mantenimiento', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    estado(false)
    renderGate()
    await screen.findByText('Contenido de la plataforma')

    vi.mocked(api.get).mockRejectedValue(new Error('sin red'))
    await act(async () => { await vi.advanceTimersByTimeAsync(31_000) })

    expect(screen.getByText('Contenido de la plataforma')).toBeInTheDocument()
  })

  test('al volver a la pestaña vuelve a consultar el estado', async () => {
    estado(false)
    renderGate()
    await screen.findByText('Contenido de la plataforma')
    vi.mocked(api.get).mockClear()
    estado(true, 'Mantenimiento.')

    await act(async () => { document.dispatchEvent(new Event('visibilitychange')) })

    expect(await screen.findByText('Sitio en mantenimiento')).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledTimes(1)
  })
})
