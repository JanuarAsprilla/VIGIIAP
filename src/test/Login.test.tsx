import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from '@/pages/auth/Login'

const navigateSpy = vi.fn()
let locationState: unknown = undefined
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>()
  return {
    ...actual,
    useNavigate: () => navigateSpy,
    useLocation: () => ({ state: locationState }),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
  locationState = undefined
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

  test('no renderiza ningún formulario propio', () => {
    const { container } = renderLogin()
    expect(container).toBeEmptyDOMElement()
  })
})
