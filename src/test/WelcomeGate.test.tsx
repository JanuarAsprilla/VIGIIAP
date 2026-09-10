import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import WelcomeGate from '@/components/WelcomeGate'

const STORAGE_KEY = 'vigiiap_welcome_seen'

const loginVisitanteMock = vi.fn().mockResolvedValue({})
const authMock: { isAuthenticated: boolean } = { isAuthenticated: false }
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: authMock.isAuthenticated, loginVisitante: loginVisitanteMock }),
}))

function renderGate() {
  return render(<MemoryRouter><WelcomeGate /></MemoryRouter>)
}

beforeEach(() => {
  vi.clearAllMocks()
  authMock.isAuthenticated = false
  localStorage.clear()
})

describe('WelcomeGate — aviso de bienvenida para quien no tiene sesión', () => {
  test('aparece en la primera visita de alguien sin sesión', () => {
    renderGate()
    expect(screen.getByRole('dialog', { name: /Bienvenido a VIGIA-IIAP/i })).toBeInTheDocument()
  })

  test('no aparece si ya está autenticado', () => {
    authMock.isAuthenticated = true
    renderGate()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('no vuelve a aparecer tras haberse cerrado una vez — persiste en localStorage', () => {
    localStorage.setItem(STORAGE_KEY, '1')
    renderGate()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('"Ahora no" cierra el aviso y lo marca como visto', async () => {
    const user = userEvent.setup()
    renderGate()
    await user.click(screen.getByText('Ahora no, solo quiero mirar'))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem(STORAGE_KEY)).toBe('1')
  })

  test('"Continuar como visitante" llama a loginVisitante y cierra el aviso', async () => {
    const user = userEvent.setup()
    renderGate()
    await user.click(screen.getByText('Continuar como visitante'))
    expect(loginVisitanteMock).toHaveBeenCalled()
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('"Solicitar acceso institucional" enlaza a /solicitar-acceso y cierra el aviso', async () => {
    const user = userEvent.setup()
    renderGate()
    const link = screen.getByRole('link', { name: /Solicitar acceso institucional/i })
    expect(link).toHaveAttribute('href', '/solicitar-acceso')
    await user.click(link)
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  test('Escape cierra el aviso', async () => {
    const user = userEvent.setup()
    renderGate()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
