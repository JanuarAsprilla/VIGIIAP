import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import SoportePanel from '@/components/topbar/SoportePanel'
import AjustesPanel from '@/components/topbar/AjustesPanel'
import NotificacionesPanel from '@/components/topbar/NotificacionesPanel'
import type { Notificacion } from '@/types'

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

const uiMock = { density: 'normal' as const, setDensity: vi.fn(), notifications: true, setNotifications: vi.fn() }
vi.mock('@/contexts/UIContext', () => ({ useUI: () => uiMock }))

const themeMock = { isDark: false, toggleTheme: vi.fn() }
vi.mock('@/contexts/ThemeContext', () => ({ useTheme: () => themeMock }))

beforeEach(() => {
  vi.clearAllMocks()
  uiMock.density = 'normal'
  uiMock.notifications = true
  themeMock.isDark = false
})

function withRouter(ui: ReactNode) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

describe('SoportePanel', () => {
  test('muestra los canales de contacto de soporte IIAP', () => {
    withRouter(<SoportePanel onClose={vi.fn()} />)
    expect(screen.getByText('soportegis@iiap.org.co')).toBeInTheDocument()
    expect(screen.getByText('(604) 271-1600')).toBeInTheDocument()
  })

  test('radicar solicitud técnica cierra el panel', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    withRouter(<SoportePanel onClose={onClose} />)
    await user.click(screen.getByText('Radicar Solicitud Técnica'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('AjustesPanel', () => {
  test('resalta la densidad activa y permite cambiarla', async () => {
    const user = userEvent.setup()
    withRouter(<AjustesPanel onClose={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Normal/i })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: /Cómodo/i }))
    expect(uiMock.setDensity).toHaveBeenCalledWith('comfortable')
  })

  test('el switch de tema llama a toggleTheme y refleja el estado actual', () => {
    themeMock.isDark = true
    withRouter(<AjustesPanel onClose={vi.fn()} />)
    expect(screen.getByText('Modo oscuro activo')).toBeInTheDocument()
    expect(screen.getByLabelText('Cambiar a modo claro')).toHaveAttribute('aria-pressed', 'true')
  })

  test('el switch de notificaciones invierte el valor actual', async () => {
    const user = userEvent.setup()
    withRouter(<AjustesPanel onClose={vi.fn()} />)
    await user.click(screen.getByLabelText('Desactivar notificaciones'))
    expect(uiMock.setNotifications).toHaveBeenCalledWith(false)
  })

  test('"Listo" cierra el panel', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    withRouter(<AjustesPanel onClose={onClose} />)
    await user.click(screen.getByText('Listo'))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('NotificacionesPanel', () => {
  const items: Notificacion[] = [
    { id: 'n1', mensaje: 'Nueva solicitud recibida', tipo: 'solicitud', creado_en: new Date().toISOString(), link: '/solicitudes' },
    { id: 'n2', mensaje: 'Usuario registrado', tipo: 'usuario', creado_en: new Date().toISOString(), link: '/admin/usuarios' },
  ]

  test('muestra el conteo de no leídas y permite marcar todas como leídas', async () => {
    const onMarkAllRead = vi.fn()
    const user = userEvent.setup()
    withRouter(
      <NotificacionesPanel items={items} readIds={[]} onClose={vi.fn()} onMarkRead={vi.fn()} onMarkAllRead={onMarkAllRead} />,
    )
    expect(screen.getByText('2')).toBeInTheDocument()
    await user.click(screen.getByText('Marcar todas como leídas'))
    expect(onMarkAllRead).toHaveBeenCalledWith(['n1', 'n2'])
  })

  test('cuando todo está leído, muestra el estado vacío y oculta el botón de marcar todas', () => {
    withRouter(
      <NotificacionesPanel items={items} readIds={['n1', 'n2']} onClose={vi.fn()} onMarkRead={vi.fn()} onMarkAllRead={vi.fn()} />,
    )
    expect(screen.getByText('Todo al día')).toBeInTheDocument()
    expect(screen.queryByText('Marcar todas como leídas')).not.toBeInTheDocument()
  })

  test('seleccionar una notificación la marca como leída y cierra el panel', async () => {
    const onMarkRead = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    withRouter(
      <NotificacionesPanel items={items} readIds={[]} onClose={onClose} onMarkRead={onMarkRead} onMarkAllRead={vi.fn()} />,
    )
    await user.click(screen.getByText('Nueva solicitud recibida'))
    expect(onMarkRead).toHaveBeenCalledWith('n1')
    expect(onClose).toHaveBeenCalled()
  })
})
