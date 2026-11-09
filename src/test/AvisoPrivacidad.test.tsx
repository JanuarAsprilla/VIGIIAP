import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import AvisoPrivacidad, { CLAVE_AVISO_PRIVACIDAD } from '@/components/AvisoPrivacidad'

const renderizar = () => render(<MemoryRouter><AvisoPrivacidad /></MemoryRouter>)

beforeEach(() => localStorage.clear())
afterEach(() => vi.restoreAllMocks())

describe('AvisoPrivacidad', () => {
  test('la primera vez informa y enlaza las dos políticas', () => {
    renderizar()
    const aviso = screen.getByRole('region', { name: /aviso de privacidad y cookies/i })
    expect(aviso).toHaveTextContent(/no usamos publicidad ni seguimiento de terceros/i)
    expect(screen.getByRole('link', { name: /política de cookies/i })).toHaveAttribute('href', '/politica-cookies')
    expect(screen.getByRole('link', { name: /política de privacidad/i })).toHaveAttribute('href', '/politica-privacidad')
  })

  test('«Entendido» lo cierra y recuerda la decisión', async () => {
    renderizar()
    await userEvent.click(screen.getByRole('button', { name: /entendido/i }))

    expect(screen.queryByRole('region', { name: /aviso de privacidad/i })).not.toBeInTheDocument()
    expect(localStorage.getItem(CLAVE_AVISO_PRIVACIDAD)).toBe('1')
  })

  test('si ya lo viste, no vuelve a salir', () => {
    localStorage.setItem(CLAVE_AVISO_PRIVACIDAD, '1')
    renderizar()
    expect(screen.queryByRole('region', { name: /aviso de privacidad/i })).not.toBeInTheDocument()
  })

  test('sin almacenamiento disponible igual se muestra y se cierra sin romper', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('bloqueado') })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('bloqueado') })

    renderizar()
    expect(screen.getByRole('region', { name: /aviso de privacidad/i })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: /entendido/i }))
    expect(screen.queryByRole('region', { name: /aviso de privacidad/i })).not.toBeInTheDocument()
  })
})
