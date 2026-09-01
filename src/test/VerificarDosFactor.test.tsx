import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import VerificarDosFactor from '@/pages/auth/VerificarDosFactor'

const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

const authMock = { confirmTwoFactor: vi.fn() }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderPage() {
  return render(<VerificarDosFactor />, { wrapper: MemoryRouter })
}

beforeEach(() => { vi.clearAllMocks() })

describe('VerificarDosFactor', () => {
  test('el botón sigue deshabilitado mientras el código tenga menos de 6 dígitos', async () => {
    const user = userEvent.setup()
    renderPage()
    const input = screen.getByLabelText('Código')
    const button = screen.getByRole('button', { name: /verificar/i })

    expect(button).toBeDisabled()
    await user.type(input, '123')
    expect(button).toBeDisabled()
    await user.type(input, '456')
    expect(button).not.toBeDisabled()
  })

  test('un código válido confirma el 2FA y redirige a /admin para un rol admin', async () => {
    authMock.confirmTwoFactor.mockResolvedValue({ role: 'Administrador SIG' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Código'), '123456')
    await user.click(screen.getByRole('button', { name: /verificar/i }))

    expect(authMock.confirmTwoFactor).toHaveBeenCalledWith('123456')
    expect(navigateSpy).toHaveBeenCalledWith('/admin', { replace: true })
  })

  test('un código válido redirige a / para un rol no admin', async () => {
    authMock.confirmTwoFactor.mockResolvedValue({ role: 'Investigador' })
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Código'), '123456')
    await user.click(screen.getByRole('button', { name: /verificar/i }))

    expect(navigateSpy).toHaveBeenCalledWith('/', { replace: true })
  })

  test('un código inválido muestra el mensaje de error del servidor', async () => {
    authMock.confirmTwoFactor.mockRejectedValue(new Error('Código inválido'))
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Código'), '999999')
    await user.click(screen.getByRole('button', { name: /verificar/i }))

    expect(await screen.findByText('Código inválido')).toBeInTheDocument()
    expect(navigateSpy).not.toHaveBeenCalled()
  })

  test('"Volver al inicio de sesión" navega a /login', async () => {
    const user = userEvent.setup()
    renderPage()
    await user.click(screen.getByRole('button', { name: /volver al inicio de sesión/i }))
    expect(navigateSpy).toHaveBeenCalledWith('/login', { replace: true })
  })
})
