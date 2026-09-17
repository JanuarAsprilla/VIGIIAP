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

const loginVisitanteMock = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ loginVisitante: loginVisitanteMock }) }))

function renderLoginPanel(rectOverrides: Partial<DOMRect> = {}) {
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
    <LoginPanel onClose={onClose} anchorRef={anchorRef} boxRef={boxRef} onNavigateAuthModal={onNavigateAuthModal} />,
    { wrapper: MemoryRouter },
  )
  return { ...utils, onClose, boxRef, anchorEl, onNavigateAuthModal }
}

beforeEach(() => {
  document.body.innerHTML = ''
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  loginVisitanteMock.mockReset()
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

describe('LoginPanel — paso de bienvenida', () => {
  test('se abre en el paso de bienvenida, sin mostrar el formulario de credenciales de una vez', () => {
    renderLoginPanel()
    expect(screen.getByText(/Bienvenido a VIGIA-IIAP/)).toBeInTheDocument()
    expect(screen.queryByText('LoginForm')).not.toBeInTheDocument()
  })

  test('clic en "Iniciar sesión" pasa al formulario de credenciales', async () => {
    const user = userEvent.setup()
    renderLoginPanel()
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))
    expect(screen.getByText('LoginForm')).toBeInTheDocument()
  })

  test('clic en "Continuar como visitante" entra directo sin pasar por el formulario', async () => {
    loginVisitanteMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    const { onClose } = renderLoginPanel()
    await user.click(screen.getByRole('button', { name: /Continuar como visitante/ }))
    expect(loginVisitanteMock).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  test('clic en "Solicitar acceso" desde la bienvenida abre ese panel sin pasar por el formulario', async () => {
    const user = userEvent.setup()
    const { onClose, onNavigateAuthModal } = renderLoginPanel()
    await user.click(screen.getByRole('button', { name: /Solicitar acceso/ }))
    expect(onNavigateAuthModal).toHaveBeenCalledWith('solicitar')
    expect(onClose).toHaveBeenCalled()
  })

  test('cuando `from` viene de una ruta protegida, se salta la bienvenida y abre directo el formulario', () => {
    const anchorEl = document.createElement('div')
    vi.spyOn(anchorEl, 'getBoundingClientRect').mockReturnValue({
      top: 56, bottom: 56, left: 900, right: 980, width: 80, height: 24,
      x: 900, y: 56, toJSON: () => ({}),
    } as DOMRect)
    document.body.appendChild(anchorEl)
    const anchorRef = createRef<HTMLDivElement>()
    anchorRef.current = anchorEl
    const boxRef = createRef<HTMLDivElement>()

    render(
      <LoginPanel onClose={vi.fn()} from="/perfil" anchorRef={anchorRef} boxRef={boxRef} onNavigateAuthModal={vi.fn()} />,
      { wrapper: MemoryRouter },
    )
    expect(screen.getByText('LoginForm')).toBeInTheDocument()
  })
})
