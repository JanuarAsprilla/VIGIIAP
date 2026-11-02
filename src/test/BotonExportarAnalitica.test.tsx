import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('@/lib/exportarAnaliticaExcel', () => ({ exportarAnaliticaExcel: vi.fn() }))
import { exportarAnaliticaExcel } from '@/lib/exportarAnaliticaExcel'
import BotonExportarAnalitica from '@/components/admin/actividad/BotonExportarAnalitica'

const RANGO = { desde: '2026-01-08', hasta: '2026-01-15T23:59:59.999Z' }

beforeEach(() => vi.clearAllMocks())

describe('BotonExportarAnalitica', () => {
  test('al hacer clic exporta el rango recibido', async () => {
    vi.mocked(exportarAnaliticaExcel).mockResolvedValue(undefined)

    render(<BotonExportarAnalitica rango={RANGO} />)
    await userEvent.click(screen.getByRole('button', { name: /exportar a excel/i }))

    expect(exportarAnaliticaExcel).toHaveBeenCalledWith(RANGO)
  })

  test('mientras exporta queda deshabilitado para evitar descargas duplicadas', async () => {
    let terminar: () => void = () => {}
    vi.mocked(exportarAnaliticaExcel).mockReturnValue(new Promise<void>((resolver) => { terminar = resolver }))

    render(<BotonExportarAnalitica rango={RANGO} />)
    await userEvent.click(screen.getByRole('button', { name: /exportar a excel/i }))

    expect(screen.getByRole('button', { name: /exportando/i })).toBeDisabled()
    terminar()
    await waitFor(() => expect(screen.getByRole('button', { name: /exportar a excel/i })).toBeEnabled())
  })

  test('si la exportación falla lo dice y permite reintentar', async () => {
    vi.mocked(exportarAnaliticaExcel).mockRejectedValue(new Error('500'))

    render(<BotonExportarAnalitica rango={RANGO} />)
    await userEvent.click(screen.getByRole('button', { name: /exportar a excel/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/no se pudo exportar/i)
    expect(screen.getByRole('button', { name: /exportar a excel/i })).toBeEnabled()
  })
})
