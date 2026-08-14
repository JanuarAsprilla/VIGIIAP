import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, test, expect, beforeEach } from 'vitest'
import { UIProvider, useUI } from '../contexts/UIContext'

// ─── Helper consumer component ────────────────────────────────────────────────
function UIConsumer() {
  const { density, notifications, notifPrefs, paletteOpen, openPalette, closePalette } = useUI()
  return (
    <div>
      <div data-testid="density">{density}</div>
      <div data-testid="notifications">{String(notifications)}</div>
      <div data-testid="notif-solicitudes">{String(notifPrefs.solicitudes)}</div>
      <div data-testid="notif-mapas">{String(notifPrefs.mapas)}</div>
      <div data-testid="notif-email">{String(notifPrefs.email)}</div>
      <div data-testid="palette-open">{String(paletteOpen)}</div>
      <button onClick={openPalette}>open-palette</button>
      <button onClick={closePalette}>close-palette</button>
    </div>
  )
}

describe('UIContext', () => {
  beforeEach(() => localStorage.clear())

  // ─── Default values ──────────────────────────────────────────────────────────
  test('density defaults to "normal" when localStorage is empty', () => {
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('density').textContent).toBe('normal')
  })

  test('notifications defaults to true when localStorage is empty', () => {
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('notifications').textContent).toBe('true')
  })

  test('notifPrefs defaults have correct boolean shape', () => {
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('notif-solicitudes').textContent).toBe('true')
    expect(screen.getByTestId('notif-mapas').textContent).toBe('false')
    expect(screen.getByTestId('notif-email').textContent).toBe('true')
  })

  test('paletteOpen defaults to false', () => {
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('palette-open').textContent).toBe('false')
  })

  // ─── Stored valid values are used ────────────────────────────────────────────
  test('uses stored compact density from localStorage', () => {
    localStorage.setItem('vigiiap_density_v1', JSON.stringify('compact'))
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('density').textContent).toBe('compact')
  })

  test('uses stored comfortable density from localStorage', () => {
    localStorage.setItem('vigiiap_density_v1', JSON.stringify('comfortable'))
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('density').textContent).toBe('comfortable')
  })

  test('uses stored notifications=false from localStorage', () => {
    localStorage.setItem('vigiiap_notif_enabled_v1', JSON.stringify(false))
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('notifications').textContent).toBe('false')
  })

  // ─── Invalid values fall back to defaults ────────────────────────────────────
  test('rejects invalid density and falls back to "normal"', () => {
    localStorage.setItem('vigiiap_density_v1', JSON.stringify('mega'))
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('density').textContent).toBe('normal')
  })

  test('rejects malformed notifPrefs and falls back to defaults', () => {
    // Store an object with wrong keys
    localStorage.setItem('vigiiap_notif_prefs_v1', JSON.stringify({ foo: true }))
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('notif-mapas').textContent).toBe('false')
  })

  test('rejects array notifPrefs and falls back to defaults', () => {
    localStorage.setItem('vigiiap_notif_prefs_v1', JSON.stringify([true, false]))
    render(<UIProvider><UIConsumer /></UIProvider>)
  })

  test('rejects string notifPrefs and falls back to defaults', () => {
    localStorage.setItem('vigiiap_notif_prefs_v1', JSON.stringify('bad'))
    render(<UIProvider><UIConsumer /></UIProvider>)
    expect(screen.getByTestId('notif-email').textContent).toBe('true')
  })

  // ─── paletteOpen toggle ───────────────────────────────────────────────────────
  test('openPalette sets paletteOpen to true', async () => {
    const user = userEvent.setup()
    render(<UIProvider><UIConsumer /></UIProvider>)
    await user.click(screen.getByRole('button', { name: 'open-palette' }))
    expect(screen.getByTestId('palette-open').textContent).toBe('true')
  })

  test('closePalette sets paletteOpen back to false', async () => {
    const user = userEvent.setup()
    render(<UIProvider><UIConsumer /></UIProvider>)
    await user.click(screen.getByRole('button', { name: 'open-palette' }))
    await user.click(screen.getByRole('button', { name: 'close-palette' }))
    expect(screen.getByTestId('palette-open').textContent).toBe('false')
  })

  // ─── Error boundary ───────────────────────────────────────────────────────────
  test('throws when useUI is used outside UIProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<UIConsumer />)).toThrow('useUI debe usarse dentro de UIProvider')
    spy.mockRestore()
  })
})
