import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import RecuperarPasswordForm from '@/components/auth/RecuperarPasswordForm'
import RecuperarPassword from '@/pages/auth/RecuperarPassword'

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
  return {
    motion,
    AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  }
})

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }))
import api from '@/lib/api'

const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

function renderForm(onClose = vi.fn()) {
  return { onClose, ...render(<RecuperarPasswordForm onClose={onClose} />, { wrapper: MemoryRouter }) }
}

beforeEach(() => { vi.clearAllMocks() })

describe('RecuperarPasswordForm — validación', () => {
  test('un email inválido muestra error y no llama a la API', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Correo Electrónico'), 'no-es-un-correo')
    await user.click(screen.getByRole('button', { name: /Enviar Instrucciones/i }))

    expect(await screen.findByText('Ingrese un correo electrónico válido')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })
})

describe('RecuperarPasswordForm — envío', () => {
  test('un email válido llama a la API y pasa a la pantalla de confirmación', async () => {
    vi.mocked(api.post).mockResolvedValue({ message: 'ok' })
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Correo Electrónico'), 'ana@iiap.gov.co')
    await user.click(screen.getByRole('button', { name: /Enviar Instrucciones/i }))

    expect(api.post).toHaveBeenCalledWith('/auth/recuperar-password', { email: 'ana@iiap.gov.co' })
    expect(await screen.findByText('Correo Enviado')).toBeInTheDocument()
    expect(screen.getByText('ana@iiap.gov.co')).toBeInTheDocument()
  })

  test('si la API falla, se queda en el formulario y muestra el error', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Demasiadas solicitudes, intenta más tarde'))
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Correo Electrónico'), 'ana@iiap.gov.co')
    await user.click(screen.getByRole('button', { name: /Enviar Instrucciones/i }))

    expect(await screen.findByText('Demasiadas solicitudes, intenta más tarde')).toBeInTheDocument()
    expect(screen.queryByText('Correo Enviado')).not.toBeInTheDocument()
  })

  test('"Enviar a otro correo" regresa al formulario vacío', async () => {
    vi.mocked(api.post).mockResolvedValue({ message: 'ok' })
    const user = userEvent.setup()
    renderForm()
    await user.type(screen.getByLabelText('Correo Electrónico'), 'ana@iiap.gov.co')
    await user.click(screen.getByRole('button', { name: /Enviar Instrucciones/i }))
    await screen.findByText('Correo Enviado')

    await user.click(screen.getByRole('button', { name: /Enviar a otro correo/i }))

    expect(screen.getByLabelText('Correo Electrónico')).toHaveValue('')
  })
})

describe('RecuperarPasswordForm — volver al login', () => {
  test('cierra el panel y navega a /login', async () => {
    const user = userEvent.setup()
    const { onClose } = renderForm()
    await user.click(screen.getByRole('button', { name: /Volver al inicio de sesión/i }))

    expect(onClose).toHaveBeenCalled()
    expect(navigateSpy).toHaveBeenCalledWith('/login')
  })
})

describe('RecuperarPassword — /recuperar-password ya no es una página, reenvía a "/"', () => {
  test('reenvía a "/" pidiendo abrir el panel de recuperar contraseña', () => {
    render(<RecuperarPassword />, { wrapper: MemoryRouter })
    expect(navigateSpy).toHaveBeenCalledWith('/', {
      replace: true,
      state: { openAuthModal: 'recuperar' },
    })
  })

  test('no renderiza ningún formulario propio', () => {
    const { container } = render(<RecuperarPassword />, { wrapper: MemoryRouter })
    expect(container).toBeEmptyDOMElement()
  })
})
