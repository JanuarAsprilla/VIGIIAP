import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import OAuthProviders from '@/components/auth/OAuthProviders'

vi.mock('@/lib/api', () => ({
  default: {
    get: vi.fn(),
    defaults: { baseURL: 'https://api.vigiiap.iiap.gov.co/api/v1' },
  },
}))
import api from '@/lib/api'

function renderOAuthProviders() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}><OAuthProviders /></QueryClientProvider>)
}

beforeEach(() => { vi.clearAllMocks() })

describe('OAuthProviders — antes de que resuelva /auth/oauth/providers', () => {
  test('el botón de Google aparece deshabilitado con "Pronto" mientras carga', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {})) // nunca resuelve
    renderOAuthProviders()
    expect(screen.getByRole('button', { name: /Google/ })).toBeDisabled()
    expect(screen.getAllByText('Pronto')).toHaveLength(1)
  })

  test('no muestra Microsoft aunque el backend lo tenga configurado', async () => {
    vi.mocked(api.get).mockResolvedValue({ google: true, microsoft: true })
    renderOAuthProviders()
    expect(await screen.findByRole('link', { name: /Google/ })).toBeInTheDocument()
    expect(screen.queryByText('Microsoft')).not.toBeInTheDocument()
  })

  test('no muestra Apple — requiere Apple Developer Program de pago, no está disponible', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}))
    renderOAuthProviders()
    expect(screen.queryByText('Apple')).not.toBeInTheDocument()
  })
})

describe('OAuthProviders — con /auth/oauth/providers resuelto', () => {
  test('un proveedor configurado (google:true) se renderiza como enlace real al endpoint /start', async () => {
    vi.mocked(api.get).mockResolvedValue({ google: true, microsoft: false })
    renderOAuthProviders()

    const googleLink = await screen.findByRole('link', { name: /Google/ })
    expect(googleLink).toHaveAttribute('href', 'https://api.vigiiap.iiap.gov.co/api/v1/auth/oauth/google/start')

    expect(screen.queryByText('Pronto')).not.toBeInTheDocument()
  })
})
