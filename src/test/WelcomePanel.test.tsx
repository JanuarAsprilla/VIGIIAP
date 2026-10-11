import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
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
  const boxRef = createRef<HTMLDivElement>()
  const onClose = vi.fn()
  const onIniciarSesion = vi.fn()
  const onSolicitar = vi.fn()

  const utils = render(
    <WelcomePanel onClose={onClose} onIniciarSesion={onIniciarSesion} onSolicitar={onSolicitar} boxRef={boxRef} />,
  )
  return { ...utils, onClose, onIniciarSesion, onSolicitar, boxRef }
}

beforeEach(() => {
  document.body.innerHTML = ''
  document.body.style.overflow = ''
  loginVisitanteMock.mockReset()
})

describe('WelcomePanel — centrado en pantalla (no anclado, a diferencia de LoginPanel)', () => {
  test('se monta en un portal a document.body, fuera del árbol de montaje', () => {
    const { container } = renderWelcomePanel()
    expect(container.querySelector('[role="dialog"]')).toBeNull()
    expect(document.body.querySelector('[role="dialog"]')).not.toBeNull()
  })

  test('boxRef apunta al nodo real del panel para el detector de "clic afuera" de TopBar', () => {
    const { boxRef } = renderWelcomePanel()
    expect(boxRef.current).toBe(screen.getByRole('dialog'))
  })

  describe('no bloqueante (requisito de verificación de marca OAuth de Google)', () => {
    afterEach(() => { document.body.style.overflow = '' })

    test('no bloquea el scroll del body mientras está montado', () => {
      renderWelcomePanel()
      expect(document.body.style.overflow).not.toBe('hidden')
    })

    test('no renderiza el scrim de fondo', () => {
      renderWelcomePanel()
      expect(document.querySelector('.fixed.inset-0.z-40')).toBeNull()
    })

    test('aria-modal es false, ya que el fondo sigue interactuable', () => {
      renderWelcomePanel()
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'false')
    })
  })
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
