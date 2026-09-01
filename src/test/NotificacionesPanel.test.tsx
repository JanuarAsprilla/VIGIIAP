import { describe, test, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import NotificacionesPanel from '@/components/topbar/NotificacionesPanel'
import type { Notificacion } from '@/types'

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
  return { motion }
})

function makeItem(overrides: Partial<Notificacion> = {}): Notificacion {
  return { id: 'n1', mensaje: 'Nueva solicitud registrada', tipo: 'solicitud', creado_en: new Date().toISOString(), link: '/admin/solicitudes', ...overrides }
}

function renderPanel(props: Partial<Parameters<typeof NotificacionesPanel>[0]> = {}) {
  const defaults = {
    onClose: vi.fn(),
    items: [makeItem()],
    readIds: [] as string[],
    onMarkAllRead: vi.fn(),
    onMarkRead: vi.fn(),
  }
  const merged = { ...defaults, ...props }
  return { ...merged, ...render(<MemoryRouter><NotificacionesPanel {...merged} /></MemoryRouter>) }
}

describe('NotificacionesPanel — estado vacío / con notificaciones', () => {
  test('con todas las notificaciones leídas, muestra "Todo al día" sin badge ni botón de marcar todas', () => {
    renderPanel({ items: [makeItem({ id: 'n1' })], readIds: ['n1'] })
    expect(screen.getByText('Todo al día')).toBeInTheDocument()
    expect(screen.queryByText('Marcar todas como leídas')).not.toBeInTheDocument()
  })

  test('sin notificaciones, también cuenta como "todo al día"', () => {
    renderPanel({ items: [] })
    expect(screen.getByText('Todo al día')).toBeInTheDocument()
  })

  test('con notificaciones sin leer, muestra el conteo y la lista', () => {
    renderPanel({ items: [makeItem({ id: 'n1' }), makeItem({ id: 'n2', mensaje: 'Documento actualizado' })], readIds: [] })
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('Nueva solicitud registrada')).toBeInTheDocument()
    expect(screen.getByText('Documento actualizado')).toBeInTheDocument()
  })
})

describe('NotificacionesPanel — acciones', () => {
  test('marcar todas como leídas llama a onMarkAllRead con todos los ids', async () => {
    const onMarkAllRead = vi.fn()
    const user = userEvent.setup()
    renderPanel({ items: [makeItem({ id: 'n1' }), makeItem({ id: 'n2' })], onMarkAllRead })
    await user.click(screen.getByText('Marcar todas como leídas'))
    expect(onMarkAllRead).toHaveBeenCalledWith(['n1', 'n2'])
  })

  test('hacer clic en una notificación la marca como leída y cierra el panel', async () => {
    const onMarkRead = vi.fn()
    const onClose = vi.fn()
    const user = userEvent.setup()
    renderPanel({ items: [makeItem({ id: 'n1' })], onMarkRead, onClose })
    await user.click(screen.getByText('Nueva solicitud registrada'))
    expect(onMarkRead).toHaveBeenCalledWith('n1')
    expect(onClose).toHaveBeenCalled()
  })

  test('una notificación sin leer muestra el punto indicador; una leída no', () => {
    const { container } = renderPanel({ items: [makeItem({ id: 'n1' })], readIds: [] })
    expect(container.querySelector('.bg-gold-500.rounded-full.w-2')).not.toBeNull()
  })
})

describe('NotificacionesPanel — formato de tiempo relativo', () => {
  test('menos de 1 minuto se muestra como "ahora"', () => {
    renderPanel({ items: [makeItem({ creado_en: new Date().toISOString() })] })
    expect(screen.getByText('ahora')).toBeInTheDocument()
  })

  test('minutos se muestran como "hace N min"', () => {
    const iso = new Date(Date.now() - 5 * 60_000).toISOString()
    renderPanel({ items: [makeItem({ creado_en: iso })] })
    expect(screen.getByText('hace 5 min')).toBeInTheDocument()
  })

  test('horas se muestran como "hace N h"', () => {
    const iso = new Date(Date.now() - 3 * 3_600_000).toISOString()
    renderPanel({ items: [makeItem({ creado_en: iso })] })
    expect(screen.getByText('hace 3 h')).toBeInTheDocument()
  })

  test('días se muestran como "hace N d"', () => {
    const iso = new Date(Date.now() - 2 * 86_400_000).toISOString()
    renderPanel({ items: [makeItem({ creado_en: iso })] })
    expect(screen.getByText('hace 2 d')).toBeInTheDocument()
  })

  test('sin fecha, no muestra ningún texto de tiempo', () => {
    renderPanel({ items: [makeItem({ creado_en: undefined })] })
    expect(screen.queryByText(/hace|ahora/)).not.toBeInTheDocument()
  })
})

describe('NotificacionesPanel — tipos y enlaces', () => {
  test('un tipo desconocido usa el ícono y la etiqueta "General" por defecto', () => {
    renderPanel({ items: [makeItem({ tipo: 'tipo-inexistente' })] })
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  test('sin tipo, también usa la etiqueta "General" por defecto', () => {
    renderPanel({ items: [makeItem({ tipo: undefined })] })
    expect(screen.getByText('General')).toBeInTheDocument()
  })

  test('un tipo "usuario" muestra la etiqueta "Usuario"', () => {
    renderPanel({ items: [makeItem({ tipo: 'usuario' })] })
    expect(screen.getByText('Usuario')).toBeInTheDocument()
  })

  test('sin link, no lanza y no navega a una ruta real', () => {
    renderPanel({ items: [makeItem({ link: undefined })] })
    const href = screen.getByText('Nueva solicitud registrada').closest('a')!.getAttribute('href')
    expect(href).not.toContain('/admin/solicitudes')
  })
})
