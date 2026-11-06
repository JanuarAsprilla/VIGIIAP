import { describe, test, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PoliticaCookies from '@/pages/recursos/PoliticaCookies'

const renderizar = () => render(<MemoryRouter><PoliticaCookies /></MemoryRouter>)

describe('PoliticaCookies', () => {
  test('declara que no hay cookies publicitarias ni analítica de terceros', () => {
    renderizar()
    expect(screen.getByRole('heading', { level: 1, name: /política de cookies/i })).toBeInTheDocument()
    expect(screen.getByText(/no usa cookies publicitarias/i)).toBeInTheDocument()
    expect(screen.getByText(/no se envía a terceros ni se vincula con tu cuenta/i)).toBeInTheDocument()
  })

  test('lista cada cookie que emite el servidor con su duración y finalidad', () => {
    renderizar()
    const tabla = screen.getByRole('table', { name: /cookies estrictamente necesarias/i })
    const esperadas: Array<[string, RegExp]> = [
      ['vigiiap_token', /15 minutos/],
      ['vigiiap_refresh', /30 días/],
      ['vigiiap_2fa_temp', /segundo factor/],
      ['vigiiap_expired_temp', /contraseña vencida/],
      ['vigiiap_oauth_csrf, vigiiap_oauth_cv', /Google o Microsoft/],
    ]
    for (const [nombre, detalle] of esperadas) {
      expect(within(tabla).getByText(nombre).closest('tr')).toHaveTextContent(detalle)
    }
    expect(within(tabla).getAllByRole('row')).toHaveLength(esperadas.length + 1) // + encabezado
    expect(tabla).toHaveTextContent(/HttpOnly|Mantiene tu sesión/)
  })

  test('lista el almacenamiento local, incluido el identificador anónimo de la analítica', () => {
    renderizar()
    const tabla = screen.getByRole('table', { name: /almacenamiento local/i })
    expect(within(tabla).getAllByRole('row')).toHaveLength(8) // 7 claves + encabezado
    expect(within(tabla).getByText('vigiiap_analytics_session').closest('tr')).toHaveTextContent(/anónimo/i)
  })

  test('menciona a los terceros que reciben la IP al cargar los mapas', () => {
    renderizar()
    expect(screen.getByText(/openstreetmap, opentopomap y esri/i)).toBeInTheDocument()
  })

  test('enlaza la política de privacidad', () => {
    renderizar()
    expect(screen.getByRole('link', { name: /política de privacidad/i })).toHaveAttribute('href', '/politica-privacidad')
  })
})
