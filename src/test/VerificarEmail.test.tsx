import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import VerificarEmail from '@/pages/auth/VerificarEmail'

vi.mock('@/hooks/usePlatformStats', () => ({ usePlatformStats: () => [] }))

function renderPage() {
  return render(<VerificarEmail />, { wrapper: MemoryRouter })
}

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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), post: vi.fn() } }))
import api from '@/lib/api'

beforeEach(() => {
  vi.clearAllMocks()
  paramToken = 'a'.repeat(32)
})

describe('VerificarEmail — validación de formato del token (M-05)', () => {
  test('un token demasiado corto redirige a login sin llamar a la API', () => {
    paramToken = 'corto'
    renderPage()

    expect(navigateSpy).toHaveBeenCalledWith('/login?error=token-invalido', { replace: true })
    expect(api.get).not.toHaveBeenCalled()
  })

  test('un token con caracteres no permitidos redirige a login', () => {
    paramToken = `${'a'.repeat(20)}!!!`
    renderPage()

    expect(navigateSpy).toHaveBeenCalledWith('/login?error=token-invalido', { replace: true })
  })

  test('un token con formato válido sí llama a la API de verificación', () => {
    vi.mocked(api.get).mockResolvedValue({})
    renderPage()

    expect(api.get).toHaveBeenCalledWith(`/auth/verificar-email/${paramToken}`)
    expect(navigateSpy).not.toHaveBeenCalled()
  })
})

describe('VerificarEmail — resultados', () => {
  test('verificación exitosa muestra el mensaje de éxito', async () => {
    vi.mocked(api.get).mockResolvedValue({ alreadyVerified: false })
    renderPage()
    expect(await screen.findByText('¡Correo verificado!')).toBeInTheDocument()
  })

  test('un correo ya verificado antes muestra el mensaje correspondiente', async () => {
    vi.mocked(api.get).mockResolvedValue({ alreadyVerified: true })
    renderPage()
    expect(await screen.findByText('Ya verificado')).toBeInTheDocument()
  })

  test('un token expirado ofrece reenviar el correo de verificación', async () => {
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('El enlace ha expirado.'), { status: 400 }))
    renderPage()
    expect(await screen.findByText('Enlace expirado')).toBeInTheDocument()
  })

  test('un error genérico muestra "Enlace no válido"', async () => {
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('No encontrado'), { status: 400 }))
    renderPage()
    expect(await screen.findByText('Enlace no válido')).toBeInTheDocument()
  })
})

describe('VerificarEmail — reenvío tras expirar', () => {
  test('enviar el formulario de reenvío llama a la API y muestra confirmación', async () => {
    vi.mocked(api.get).mockRejectedValue(Object.assign(new Error('El enlace ha expirado.'), { status: 400 }))
    vi.mocked(api.post).mockResolvedValue({})

    const user = userEvent.setup()
    renderPage()
    await screen.findByText('Enlace expirado')

    await user.type(screen.getByPlaceholderText('tu@correo.com'), 'ana@iiap.gov.co')
    await user.click(screen.getByRole('button', { name: /Reenviar verificación/i }))

    expect(api.post).toHaveBeenCalledWith('/auth/reenviar-verificacion', { email: 'ana@iiap.gov.co' })
    expect(await screen.findByText(/recibirás el enlace en breve/i)).toBeInTheDocument()
  })
})
