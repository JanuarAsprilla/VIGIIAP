import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CambiarPasswordExpirada from '@/pages/auth/CambiarPasswordExpirada'

const navigateSpy = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return { ...actual, useNavigate: () => navigateSpy }
})

vi.mock('@/lib/api', () => ({ default: { post: vi.fn() } }))
import api from '@/lib/api'

beforeEach(() => { vi.clearAllMocks() })

describe('CambiarPasswordExpirada — validación', () => {
  test('el botón está deshabilitado hasta que ambas contraseñas sean válidas y coincidan', async () => {
    const user = userEvent.setup()
    render(<CambiarPasswordExpirada />)
    const submit = screen.getByRole('button', { name: /Cambiar contraseña/i })
    expect(submit).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Sup3r$ecreta')
    expect(submit).toBeDisabled()

    await user.type(screen.getByPlaceholderText('Repita la contraseña'), 'OtraDistinta1!')
    expect(screen.getByText(/no coinciden/i)).toBeInTheDocument()
    expect(submit).toBeDisabled()
  })

  test('con ambas contraseñas iguales y fuertes, el botón se habilita', async () => {
    const user = userEvent.setup()
    render(<CambiarPasswordExpirada />)
    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Sup3r$ecreta')
    await user.type(screen.getByPlaceholderText('Repita la contraseña'), 'Sup3r$ecreta')

    expect(screen.getByRole('button', { name: /Cambiar contraseña/i })).not.toBeDisabled()
  })
})

describe('CambiarPasswordExpirada — envío', () => {
  test('un envío exitoso muestra confirmación y redirige a login', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    vi.mocked(api.post).mockResolvedValue({})

    const user = userEvent.setup()
    render(<CambiarPasswordExpirada />)
    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Sup3r$ecreta')
    await user.type(screen.getByPlaceholderText('Repita la contraseña'), 'Sup3r$ecreta')
    await user.click(screen.getByRole('button', { name: /Cambiar contraseña/i }))

    expect(await screen.findByText('¡Contraseña actualizada!')).toBeInTheDocument()
    expect(api.post).toHaveBeenCalledWith('/auth/change-expired-password', { nuevaPassword: 'Sup3r$ecreta' })

    vi.advanceTimersByTime(2500)
    expect(navigateSpy).toHaveBeenCalledWith('/login', { replace: true })
    vi.useRealTimers()
  })

  test('un fallo del servidor muestra el error y no redirige', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('El token de sesión expiró, inicia sesión de nuevo'))

    const user = userEvent.setup()
    render(<CambiarPasswordExpirada />)
    await user.type(screen.getByPlaceholderText('Mínimo 8 caracteres'), 'Sup3r$ecreta')
    await user.type(screen.getByPlaceholderText('Repita la contraseña'), 'Sup3r$ecreta')
    await user.click(screen.getByRole('button', { name: /Cambiar contraseña/i }))

    expect(await screen.findByText('El token de sesión expiró, inicia sesión de nuevo')).toBeInTheDocument()
    expect(navigateSpy).not.toHaveBeenCalled()
  })
})
