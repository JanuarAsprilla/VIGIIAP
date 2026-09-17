import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, createRef, type ReactNode } from 'react'
import WelcomePanel from '@/components/topbar/WelcomePanel'

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

const loginVisitanteMock = vi.fn()
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ loginVisitante: loginVisitanteMock }) }))

function renderWelcomePanel() {
  const anchorEl = document.createElement('div')
  vi.spyOn(anchorEl, 'getBoundingClientRect').mockReturnValue({
    top: 56, bottom: 56, left: 900, right: 980, width: 80, height: 24,
    x: 900, y: 56, toJSON: () => ({}),
  } as DOMRect)
  document.body.appendChild(anchorEl)

  const anchorRef = createRef<HTMLDivElement>()
  anchorRef.current = anchorEl
  const boxRef = createRef<HTMLDivElement>()
  const onClose = vi.fn()
  const onIniciarSesion = vi.fn()
  const onSolicitar = vi.fn()

  const utils = render(
    <WelcomePanel onClose={onClose} onIniciarSesion={onIniciarSesion} onSolicitar={onSolicitar} anchorRef={anchorRef} boxRef={boxRef} />,
  )
  return { ...utils, onClose, onIniciarSesion, onSolicitar }
}

beforeEach(() => {
  document.body.innerHTML = ''
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1280 })
  loginVisitanteMock.mockReset()
})

describe('WelcomePanel — bienvenida antes de pedir credenciales', () => {
  test('explica las dos formas de acceder, sin mostrar el formulario de credenciales', () => {
    renderWelcomePanel()
    expect(screen.getByText(/Bienvenido a VIGIA-IIAP/)).toBeInTheDocument()
    expect(screen.getByText('Institucional')).toBeInTheDocument()
    expect(screen.getByText('Visitante')).toBeInTheDocument()
    expect(screen.queryByText('LoginForm')).not.toBeInTheDocument()
  })

  test('clic en "Iniciar sesión" llama a onIniciarSesion (TopBar cambia al panel de LoginPanel)', async () => {
    const user = userEvent.setup()
    const { onIniciarSesion } = renderWelcomePanel()
    await user.click(screen.getByRole('button', { name: /Iniciar sesión/ }))
    expect(onIniciarSesion).toHaveBeenCalled()
  })

  test('clic en "Continuar como visitante" entra directo, sin pasar por LoginPanel', async () => {
    loginVisitanteMock.mockResolvedValue(undefined)
    const user = userEvent.setup()
    const { onClose } = renderWelcomePanel()
    await user.click(screen.getByRole('button', { name: /Continuar como visitante/ }))
    expect(loginVisitanteMock).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  test('si "Continuar como visitante" falla, muestra el error y no cierra el panel', async () => {
    loginVisitanteMock.mockRejectedValue(new Error('Servidor no disponible'))
    const user = userEvent.setup()
    const { onClose } = renderWelcomePanel()
    await user.click(screen.getByRole('button', { name: /Continuar como visitante/ }))
    expect(await screen.findByText('Servidor no disponible')).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  test('clic en "Solicitar acceso" llama a onSolicitar', async () => {
    const user = userEvent.setup()
    const { onSolicitar } = renderWelcomePanel()
    await user.click(screen.getByRole('button', { name: /Solicitar acceso/ }))
    expect(onSolicitar).toHaveBeenCalled()
  })

  test('el botón "Cerrar" llama a onClose', async () => {
    const user = userEvent.setup()
    const { onClose } = renderWelcomePanel()
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
