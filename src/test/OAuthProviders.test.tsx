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
  test('los 3 botones aparecen deshabilitados con "Pronto" mientras carga', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {})) // nunca resuelve
    renderOAuthProviders()
    for (const label of ['Google', 'Apple', 'Microsoft']) {
      expect(screen.getByRole('button', { name: new RegExp(label) })).toBeDisabled()
    }
    expect(screen.getAllByText('Pronto')).toHaveLength(3)
  })
})

describe('OAuthProviders — con /auth/oauth/providers resuelto', () => {
  test('un proveedor configurado (google:true) se renderiza como enlace real al endpoint /start', async () => {
    vi.mocked(api.get).mockResolvedValue({ google: true, microsoft: false, apple: false })
    renderOAuthProviders()

    const googleLink = await screen.findByRole('link', { name: /Google/ })
    expect(googleLink).toHaveAttribute('href', 'https://api.vigiiap.iiap.gov.co/api/v1/auth/oauth/google/start')

    // Microsoft y Apple siguen deshabilitados
    expect(screen.getByRole('button', { name: /Microsoft/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Apple/ })).toBeDisabled()
    expect(screen.getAllByText('Pronto')).toHaveLength(2)
  })

  test('con los 3 configurados, no queda ningún botón deshabilitado', async () => {
    vi.mocked(api.get).mockResolvedValue({ google: true, microsoft: true, apple: true })
    renderOAuthProviders()

    expect(await screen.findByRole('link', { name: /Google/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Microsoft/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Apple/ })).toBeInTheDocument()
    expect(screen.queryByText('Pronto')).not.toBeInTheDocument()
  })
})
