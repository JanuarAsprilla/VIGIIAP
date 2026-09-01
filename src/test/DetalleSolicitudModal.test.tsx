import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { DetalleSolicitudModal } from '@/pages/solicitudes/DetalleSolicitudModal'
import type { SolicitudData } from '@/hooks/useSolicitudes'

vi.mock('framer-motion', () => {
  const cache = new Map<string, (p: Record<string, unknown>) => ReactNode>()
  const motion = new Proxy({}, {
    get: (_t, tag: string) => {
      if (!cache.has(tag)) {
        cache.set(tag, ({ children, ...p }: Record<string, unknown>) => createElement(tag, p, children as ReactNode))
      }
      return cache.get(tag)
    },
  })
  return { motion, AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</> }
})

function makeSol(overrides: Partial<SolicitudData> = {}): SolicitudData {
  return {
    id: '#AAA1', _id: 'a', tipo: 'Certificado de Uso de Suelo', tipoRaw: 'uso-suelo',
    subtipo: 'Predio La Esperanza', descripcion: '', fecha: '01/01/2026', creadoEn: '2026-01-01T00:00:00Z',
    estado: 'Pendiente', estadoRaw: 'pendiente', estadoColor: 'orange',
    solicitante: '', email: '', notas: '', respondidaEn: null,
    timeline: ['Recibida', 'Pendiente'], revisor: null, diasPendiente: 0, accionesValidas: [],
    ...overrides,
  }
}

const onClose = vi.fn()
const onNueva = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
})

describe('DetalleSolicitudModal — cierre', () => {
  test('clic en el backdrop cierra el modal', async () => {
    const user = userEvent.setup()
    render(<DetalleSolicitudModal sol={makeSol()} onClose={onClose} onNueva={onNueva} />)
    await user.click(screen.getByRole('dialog'))
    expect(onClose).toHaveBeenCalled()
  })

  test('clic dentro del contenido no cierra el modal', async () => {
    const user = userEvent.setup()
    render(<DetalleSolicitudModal sol={makeSol()} onClose={onClose} onNueva={onNueva} />)
    await user.click(screen.getByText('Certificado de Uso de Suelo'))
    expect(onClose).not.toHaveBeenCalled()
  })

  test('el botón X cierra el modal', async () => {
    const user = userEvent.setup()
    render(<DetalleSolicitudModal sol={makeSol()} onClose={onClose} onNueva={onNueva} />)
    await user.click(screen.getByLabelText('Cerrar'))
    expect(onClose).toHaveBeenCalled()
  })

  test('Escape cierra el modal', async () => {
    const user = userEvent.setup()
    render(<DetalleSolicitudModal sol={makeSol()} onClose={onClose} onNueva={onNueva} />)
    await user.keyboard('{Escape}')
    expect(onClose).toHaveBeenCalled()
  })

  test('el botón "Cerrar" del pie cierra el modal', async () => {
    const user = userEvent.setup()
    render(<DetalleSolicitudModal sol={makeSol()} onClose={onClose} onNueva={onNueva} />)
    const cerrarButtons = screen.getAllByRole('button', { name: 'Cerrar' })
    await user.click(cerrarButtons[cerrarButtons.length - 1])
    expect(onClose).toHaveBeenCalled()
  })
})

describe('DetalleSolicitudModal — contenido según estado', () => {
  test('rechazado muestra la nota como motivo del rechazo y el botón de nueva solicitud', async () => {
    const user = userEvent.setup()
    render(<DetalleSolicitudModal sol={makeSol({ estado: 'Rechazado', estadoColor: 'red', notas: 'Documentación incompleta', timeline: ['Recibida', 'Pendiente', 'En Revisión', 'Rechazado'] })} onClose={onClose} onNueva={onNueva} />)
    expect(screen.getByText('Documentación incompleta')).toBeInTheDocument()
    await user.click(screen.getByText('Nueva Solicitud'))
    expect(onClose).toHaveBeenCalled()
    expect(onNueva).toHaveBeenCalled()
  })

  test('resuelta muestra el banner de trámite completado', () => {
    render(<DetalleSolicitudModal sol={makeSol({ estado: 'Resuelta', estadoColor: 'teal', timeline: ['Recibida', 'Pendiente', 'En Revisión', 'Resuelta'] })} onClose={onClose} onNueva={onNueva} />)
    expect(screen.getByText('Solicitud tramitada')).toBeInTheDocument()
  })

  test('pendiente sin notas muestra el aviso de revisión en curso', () => {
    render(<DetalleSolicitudModal sol={makeSol({ estado: 'Pendiente', notas: '' })} onClose={onClose} onNueva={onNueva} />)
    expect(screen.getByText(/está siendo revisada por el equipo del IIAP/)).toBeInTheDocument()
  })

  test('sin descripción ni subtipo, muestra el texto de respaldo', () => {
    render(<DetalleSolicitudModal sol={makeSol({ descripcion: '', subtipo: '' })} onClose={onClose} onNueva={onNueva} />)
    expect(screen.getByText('Sin descripción')).toBeInTheDocument()
  })

  test('el botón de nueva solicitud solo aparece cuando el estado es Rechazado', () => {
    render(<DetalleSolicitudModal sol={makeSol({ estado: 'Aprobado', estadoColor: 'green' })} onClose={onClose} onNueva={onNueva} />)
    expect(screen.queryByText('Nueva Solicitud')).not.toBeInTheDocument()
  })
})
