import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, createRef, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import LoginPanel from '@/components/topbar/LoginPanel'

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
vi.mock('@/components/auth/LoginForm', () => ({
  default: () => <div>LoginForm</div>,
}))

function renderLoginPanel(rectOverrides: Partial<DOMRect> = {}, extraProps: { onBack?: () => void; from?: string } = {}) {
  const anchorEl = document.createElement('div')
  vi.spyOn(anchorEl, 'getBoundingClientRect').mockReturnValue({
    top: 56, bottom: 56, left: 900, right: 980, width: 80, height: 24,
    x: 900, y: 56, toJSON: () => ({}),
    ...rectOverrides,
  } as DOMRect)
  document.body.appendChild(anchorEl)

  const anchorRef = createRef<HTMLDivElement>()
  anchorRef.current = anchorEl
  const boxRef = createRef<HTMLDivElement>()
  const onClose = vi.fn()
  const onNavigateAuthModal = vi.fn()

  const utils = render(
    <LoginPanel onClose={onClose} anchorRef={anchorRef} boxRef={boxRef} onNavigateAuthModal={onNavigateAuthModal} {...extraProps} />,
    { wrapper: MemoryRouter },
  )
  return { ...utils, onClose, boxRef, anchorEl, onNavigateAuthModal }
}

beforeEach(() => {
  document.body.innerHTML = ''
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
})

describe('LoginPanel — portal a document.body', () => {
  test('el scrim y el panel se renderizan fuera del árbol donde se montó el componente (escapan al containing block del TopBar)', () => {
    const { container } = renderLoginPanel()
    // El contenedor de render() de RTL no contiene el scrim/panel — viven
    // directamente en document.body vía createPortal, no como hijos del
    // subárbol donde LoginPanel fue montado.
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })

  test('el scrim cubre todo el viewport (fixed inset-0), no solo el TopBar', () => {
    renderLoginPanel()
    const scrim = document.querySelector('.fixed.inset-0.z-40')
    expect(scrim).not.toBeNull()
  })
})

describe('LoginPanel — posicionamiento vía getBoundingClientRect() del anchor', () => {
  test('ancla el panel justo debajo y a la derecha del botón (mismo comportamiento visual que el CSS anterior)', () => {
    renderLoginPanel({ bottom: 56, right: 980 })
    const panel = screen.getByRole('dialog')
    expect(panel.style.position).toBe('fixed')
    expect(panel.style.top).toBe('64px') // bottom(56) + GAP_PX(8)
    expect(panel.style.right).toBe('300px') // innerWidth(1280) - right(980)
  })

  test('recalcula la posición si la ventana cambia de tamaño', () => {
    const { anchorEl } = renderLoginPanel({ bottom: 56, right: 980 })
    vi.spyOn(anchorEl, 'getBoundingClientRect').mockReturnValue({
      top: 40, bottom: 40, left: 700, right: 780, width: 80, height: 24,
      x: 700, y: 40, toJSON: () => ({}),
    } as DOMRect)

    act(() => { window.dispatchEvent(new Event('resize')) })

    const panel = screen.getByRole('dialog')
    expect(panel.style.top).toBe('48px')
  })
})

describe('LoginPanel — boxRef para el detector de "clic afuera" de TopBar', () => {
  test('boxRef.current apunta al nodo real del panel (no al scrim) tras montar', () => {
    const { boxRef } = renderLoginPanel()
    expect(boxRef.current).not.toBeNull()
    expect(boxRef.current).toBe(screen.getByRole('dialog'))
  })
})

describe('LoginPanel — cerrar', () => {
  test('clic en el scrim llama a onClose', async () => {
    const user = userEvent.setup()
    const { onClose } = renderLoginPanel()
    const scrim = document.querySelector('.fixed.inset-0.z-40') as HTMLElement
    await user.click(scrim)
    expect(onClose).toHaveBeenCalled()
  })

  test('el botón "Cerrar" del panel llama a onClose', async () => {
    const user = userEvent.setup()
    const { onClose } = renderLoginPanel()
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })
})

describe('LoginPanel — muestra siempre el formulario de credenciales (es un panel aparte de WelcomePanel)', () => {
  test('renderiza LoginForm de inmediato, sin paso previo', () => {
    renderLoginPanel()
    expect(screen.getByText('LoginForm')).toBeInTheDocument()
  })
})

describe('LoginPanel — botón "volver"', () => {
  test('con onBack, muestra la flecha de volver y la llama al pulsarla', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    renderLoginPanel({}, { onBack })
    await user.click(screen.getByRole('button', { name: 'Volver a bienvenida' }))
    expect(onBack).toHaveBeenCalled()
  })

  test('sin onBack (abierto directo por redirect desde una ruta protegida), no hay a dónde volver', () => {
    renderLoginPanel({}, { from: '/perfil' })
    expect(screen.queryByRole('button', { name: 'Volver a bienvenida' })).not.toBeInTheDocument()
  })
})
