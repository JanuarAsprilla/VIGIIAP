import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/auth/Login'

const navigateSpy = vi.fn()
let locationState: unknown = undefined
let locationSearch = ''
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateSpy,
    useLocation: () => ({ state: locationState, search: locationSearch }),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  locationState = undefined
  locationSearch = ''
})

function renderLogin() {
  return render(<Login />, { wrapper: MemoryRouter })
}

describe('Login — /login ya no es una página, reenvía a "/" pidiendo abrir el panel', () => {
  test('sin from previo, reenvía a "/" con openLogin y from undefined', () => {
    renderLogin()
    expect(navigateSpy).toHaveBeenCalledWith('/', {
      replace: true,
      state: { openLogin: true, from: undefined },
    })
  })

  test('preserva el from que traía location.state (de RequireAuth/RequireAdmin/etc.)', () => {
    locationState = { from: { pathname: '/mapas' } }
    renderLogin()
    expect(navigateSpy).toHaveBeenCalledWith('/', {
      replace: true,
      state: { openLogin: true, from: { pathname: '/mapas' } },
    })
  })

  test('REGRESIÓN: tras Google con 2FA (/login?requiresTwoFactor=1) lleva a la pantalla del código, no a "/"', () => {
    locationSearch = '?requiresTwoFactor=1'
    renderLogin()
    expect(navigateSpy).toHaveBeenCalledOnce()
    expect(navigateSpy).toHaveBeenCalledWith('/verificar-2fa', { replace: true })
  })

  test('otro valor del parámetro no se interpreta como 2FA', () => {
    locationSearch = '?requiresTwoFactor=0'
    renderLogin()
    expect(navigateSpy).toHaveBeenCalledWith('/', { replace: true, state: { openLogin: true, from: undefined } })
  })

  test('no renderiza ningún formulario propio', () => {
    const { container } = renderLogin()
    expect(container).toBeEmptyDOMElement()
  })
})
