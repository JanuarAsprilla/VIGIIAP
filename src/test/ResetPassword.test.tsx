import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import ResetPassword from '@/pages/auth/ResetPassword'

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

let paramToken: string | undefined = 'a'.repeat(32)
const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useParams: () => ({ token: paramToken }),
    useNavigate: () => navigateSpy,
  }
})

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }))
import api from '@/lib/api'

function renderPage() {
  return render(<ResetPassword />, { wrapper: MemoryRouter })
}

beforeEach(() => {
  vi.clearAllMocks()
  paramToken = 'a'.repeat(32)
})

describe('ResetPassword — validación de formato del token (M-05)', () => {
  test('un token inválido redirige a recuperar-password sin llamar a la API', () => {
    paramToken = 'corto'
    renderPage()
    expect(navigateSpy).toHaveBeenCalledWith('/recuperar-password?error=token-invalido', { replace: true })
  })
})

describe('ResetPassword — validación de contraseña', () => {
  test('una contraseña corta muestra error y no llama a la API', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Nueva contraseña'), 'corta')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'corta')
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/i }))

    expect(await screen.findByText('La contraseña debe tener al menos 8 caracteres')).toBeInTheDocument()
    expect(api.post).not.toHaveBeenCalled()
  })

  test('contraseñas que no coinciden muestran el error específico', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Sup3r$ecreta')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'OtraDistinta1!')
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/i }))

    expect(await screen.findByText('Las contraseñas no coinciden')).toBeInTheDocument()
  })
})

describe('ResetPassword — envío', () => {
  test('con datos válidos llama a la API con el token correcto y muestra éxito', async () => {
    vi.mocked(api.post).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Sup3r$ecreta')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Sup3r$ecreta')
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/i }))

    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', { token: paramToken, password: 'Sup3r$ecreta' })
    expect(await screen.findByText('¡Contraseña actualizada!')).toBeInTheDocument()
  })

  test('un enlace expirado muestra el error del servidor sin avanzar a éxito', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('El enlace de recuperación ha expirado.'))
    const user = userEvent.setup()
    renderPage()
    await user.type(screen.getByLabelText('Nueva contraseña'), 'Sup3r$ecreta')
    await user.type(screen.getByLabelText('Confirmar contraseña'), 'Sup3r$ecreta')
    await user.click(screen.getByRole('button', { name: /Actualizar contraseña/i }))

    expect(await screen.findByText('El enlace de recuperación ha expirado.')).toBeInTheDocument()
    expect(screen.queryByText('¡Contraseña actualizada!')).not.toBeInTheDocument()
  })
})
