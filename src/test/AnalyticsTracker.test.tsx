import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route, Link } from 'react-router-dom'
import AnalyticsTracker from '@/components/AnalyticsTracker'

vi.mock('@/lib/analyticsBeacon', () => ({ enviarPageviewBeacon: vi.fn() }))
import { enviarPageviewBeacon } from '@/lib/analyticsBeacon'

beforeEach(() => {
  vi.clearAllMocks()
  sessionStorage.clear()
})

function renderEn(ruta: string) {
  return render(
    <MemoryRouter initialEntries={[ruta]}>
      <AnalyticsTracker />
      <Routes>
        <Route path="*" element={<div>página</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AnalyticsTracker', () => {
  test('envía un pageview al montar', () => {
    renderEn('/mapas')
    expect(enviarPageviewBeacon).toHaveBeenCalledTimes(1)
    expect(enviarPageviewBeacon).toHaveBeenCalledWith(expect.objectContaining({ ruta: '/mapas' }))
  })

  test('marca esAreaAdmin=true para rutas bajo /admin', () => {
    renderEn('/admin/actividad')
    expect(enviarPageviewBeacon).toHaveBeenCalledWith(expect.objectContaining({ esAreaAdmin: true }))
  })

  test('esAreaAdmin=false para rutas públicas', () => {
    renderEn('/mapas')
    expect(enviarPageviewBeacon).toHaveBeenCalledWith(expect.objectContaining({ esAreaAdmin: false }))
  })

  test('en la primera vista de la sesión, incluye referrerInicial', () => {
    renderEn('/')
    const payload = vi.mocked(enviarPageviewBeacon).mock.calls[0][0]
    expect(payload).toHaveProperty('referrerInicial')
  })

  test('nunca incluye datos de identidad del usuario (sessionId es el único identificador)', () => {
    renderEn('/mapas')
    const payload = vi.mocked(enviarPageviewBeacon).mock.calls[0][0]
    expect(payload).not.toHaveProperty('userId')
    expect(payload).not.toHaveProperty('email')
    expect(payload).not.toHaveProperty('ip')
    expect(typeof payload.sessionId).toBe('string')
  })

  test('navegar a una ruta distinta dispara un segundo pageview con la nueva ruta', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/mapas']}>
        <AnalyticsTracker />
        <Routes>
          <Route path="/mapas" element={<Link to="/documentos">ir</Link>} />
          <Route path="/documentos" element={<div>documentos</div>} />
        </Routes>
      </MemoryRouter>,
    )
    expect(enviarPageviewBeacon).toHaveBeenCalledTimes(1)

    await user.click(screen.getByText('ir'))

    expect(enviarPageviewBeacon).toHaveBeenCalledTimes(2)
    expect(enviarPageviewBeacon).toHaveBeenLastCalledWith(expect.objectContaining({ ruta: '/documentos' }))
  })
})
