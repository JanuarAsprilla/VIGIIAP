import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, test, expect, vi } from 'vitest'
import Footer from '../components/FooterBar'

// ── Mocks ──────────────────────────────────────────────────────────────────────
vi.mock('framer-motion', () => ({
  motion: {
    div:     ({ children, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
    section: ({ children, ...p }: React.HTMLAttributes<HTMLElement>) => <section {...p}>{children}</section>,
    footer:  ({ children, ...p }: React.HTMLAttributes<HTMLElement>) => <footer {...p}>{children}</footer>,
    span:    ({ children, ...p }: React.HTMLAttributes<HTMLSpanElement>) => <span {...p}>{children}</span>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ── Helpers ────────────────────────────────────────────────────────────────────
function withRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>)
}

// ── FooterBar ──────────────────────────────────────────────────────────────────
describe('FooterBar', () => {
  test('renders brand name', () => {
    withRouter(<Footer />)
    expect(screen.getByText('VIGIA-IIAP')).toBeInTheDocument()
  })

  test('renders IIAP institution description', () => {
    const { container } = withRouter(<Footer />)
    expect(container.textContent).toMatch(/Instituto de Investigaciones/i)
  })

  test('renders Quibdó location', () => {
    withRouter(<Footer />)
    expect(screen.getByText(/Quibdó/i)).toBeInTheDocument()
  })

  test('renders resource links — Guía, FAQ, Términos', () => {
    withRouter(<Footer />)
    expect(screen.getByText('Guía de Usuario')).toBeInTheDocument()
    expect(screen.getByText('Preguntas Frecuentes')).toBeInTheDocument()
    expect(screen.getByText('Términos de Uso')).toBeInTheDocument()
  })

  test('resource links point to correct paths', () => {
    withRouter(<Footer />)
    const guia = screen.getByRole('link', { name: /Guía de Usuario/i })
    const faq  = screen.getByRole('link', { name: /Preguntas Frecuentes/i })
    const tos  = screen.getByRole('link', { name: /Términos de Uso/i })
    expect(guia).toHaveAttribute('href', '/guia-usuario')
    expect(faq).toHaveAttribute('href', '/faq')
    expect(tos).toHaveAttribute('href', '/terminos')
  })

  test('renders copyright with current year', () => {
    withRouter(<Footer />)
    const year = new Date().getFullYear().toString()
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument()
  })

  test('renders social link labels', () => {
    withRouter(<Footer />)
    expect(screen.getByLabelText('Facebook IIAP')).toBeInTheDocument()
    expect(screen.getByLabelText('Twitter IIAP')).toBeInTheDocument()
  })
})
