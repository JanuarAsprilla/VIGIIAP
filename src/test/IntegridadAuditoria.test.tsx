import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import IntegridadAuditoria from '@/components/admin/actividad/IntegridadAuditoria'

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

function renderComponente() {
  const qc = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}><IntegridadAuditoria /></QueryClientProvider>)
}

beforeEach(() => vi.clearAllMocks())

describe('IntegridadAuditoria', () => {
  test('no consulta nada hasta que se pulsa el botón', () => {
    renderComponente()
    expect(api.get).not.toHaveBeenCalled()
  })

  test('una cadena íntegra muestra cuántos eventos se verificaron', async () => {
    vi.mocked(api.get).mockResolvedValue({ integra: true, verificados: 120, desde: '2026-01-01', hasta: '2026-10-11', problemas: [] })
    const user = userEvent.setup()
    renderComponente()

    await user.click(screen.getByRole('button', { name: 'Verificar integridad' }))

    expect(await screen.findByText(/Íntegro: 120 eventos verificados/)).toBeInTheDocument()
    expect(api.get).toHaveBeenCalledWith('/admin/audit/integridad')
  })

  test('una cadena comprometida lista los eventos con problemas y su causa', async () => {
    vi.mocked(api.get).mockResolvedValue({
      integra: false, verificados: 10, desde: null, hasta: null,
      problemas: [
        { id: 'e1', secuencia: '7', creado_en: '2026-10-01T10:00:00Z', problema: 'contenido_alterado' },
        { id: 'e2', secuencia: '9', creado_en: '2026-10-02T10:00:00Z', problema: 'evento_faltante' },
      ],
    })
    const user = userEvent.setup()
    renderComponente()

    await user.click(screen.getByRole('button', { name: 'Verificar integridad' }))

    expect(await screen.findByText('Se encontraron 2 evento(s) con problemas.')).toBeInTheDocument()
    expect(screen.getByText(/Contenido alterado/)).toBeInTheDocument()
    expect(screen.getByText(/Evento faltante antes de este/)).toBeInTheDocument()
    expect(screen.getByText('#7')).toBeInTheDocument()
  })

  test('un fallo de la consulta lo avisa y deja volver a intentar', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    renderComponente()

    await user.click(screen.getByRole('button', { name: 'Verificar integridad' }))

    expect(await screen.findByText(/No se pudo verificar la integridad/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Verificar integridad' })).toBeEnabled()
  })
})
