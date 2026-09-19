import { describe, test, expect, vi, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, createRef, type ReactNode } from 'react'
import { User } from 'lucide-react'
import CenteredAuthPanel from '@/components/auth/CenteredAuthPanel'

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

function renderPanel(blocking?: boolean) {
  const boxRef = createRef<HTMLDivElement>()
  const onClose = vi.fn()
  const utils = render(
    <CenteredAuthPanel title="Título" icon={User} onClose={onClose} boxRef={boxRef} blocking={blocking}>
      <p>Contenido</p>
    </CenteredAuthPanel>,
  )
  return { ...utils, onClose, boxRef }
}

afterEach(() => { document.body.style.overflow = '' })

describe('CenteredAuthPanel — blocking por defecto (LoginPanel, RecuperarPasswordPanel, SolicitarAccesoPanel, CompletarPerfilPanel)', () => {
  test('renderiza el scrim de fondo', () => {
    renderPanel()
    expect(document.querySelector('.fixed.inset-0.z-40')).not.toBeNull()
  })

  test('bloquea el scroll del body mientras está montado', () => {
    renderPanel()
    expect(document.body.style.overflow).toBe('hidden')
  })

  test('aria-modal es true', () => {
    renderPanel()
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  test('clic en el scrim llama a onClose', async () => {
    const user = userEvent.setup()
    const { onClose } = renderPanel()
    await user.click(document.querySelector('.fixed.inset-0.z-40') as HTMLElement)
    expect(onClose).toHaveBeenCalled()
  })
})

describe('CenteredAuthPanel — blocking={false} (WelcomePanel, requisito de verificación de marca OAuth de Google)', () => {
  test('no renderiza el scrim de fondo', () => {
    renderPanel(false)
    expect(document.querySelector('.fixed.inset-0.z-40')).toBeNull()
  })

  test('no bloquea el scroll del body', () => {
    renderPanel(false)
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  test('aria-modal es false', () => {
    renderPanel(false)
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'false')
  })

  test('el botón "Cerrar" del header sigue llamando a onClose', async () => {
    const user = userEvent.setup()
    const { onClose } = renderPanel(false)
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))
    expect(onClose).toHaveBeenCalled()
  })
})
