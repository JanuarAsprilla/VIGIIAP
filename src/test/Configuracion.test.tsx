import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Configuracion from '@/pages/admin/Configuracion'

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

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), put: vi.fn() } }))
import api from '@/lib/api'

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={qc}><Configuracion /></QueryClientProvider>)
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockResolvedValue({ data: {} })
})

describe('Configuracion — carga remota', () => {
  test('precarga los campos generales con la config remota', async () => {
    vi.mocked(api.get).mockResolvedValue({
      data: { siteName: 'Portal de Prueba', modoMantenimiento: 'true', mensajeMantenimiento: 'En mantenimiento' },
    })

    renderPage()

    expect(await screen.findByDisplayValue('Portal de Prueba')).toBeInTheDocument()
    expect(await screen.findByText('Mensaje de mantenimiento')).toBeInTheDocument()
  })
})

describe('Configuracion — guardar', () => {
  test('guardar exitosamente muestra "¡Guardado!" y luego vuelve al estado normal', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(await screen.findByRole('button', { name: /¡Guardado!/i })).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith('/admin/configuracion', expect.objectContaining({
      modoMantenimiento: 'false',
    }))
  })

  test('un fallo al guardar muestra "Error al guardar"', async () => {
    vi.mocked(api.put).mockRejectedValue(new Error('fail'))
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(await screen.findByRole('button', { name: /Error al guardar/i })).toBeInTheDocument()
  })
})

describe('Configuracion — modo mantenimiento', () => {
  test('activar el modo mantenimiento revela el campo de mensaje', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByLabelText('Mensaje de mantenimiento')).not.toBeInTheDocument()

    const section = screen.getByText('Activar modo mantenimiento').closest('.flex.items-center.justify-between')!
    const toggle = section.querySelector('div[class*="w-10"]') as HTMLElement
    await user.click(toggle)

    await waitFor(() => expect(screen.getByLabelText('Mensaje de mantenimiento')).toBeInTheDocument())
  })

  test('desactivarlo de nuevo oculta el campo de mensaje', async () => {
    const user = userEvent.setup()
    renderPage()

    const section = screen.getByText('Activar modo mantenimiento').closest('.flex.items-center.justify-between')!
    const toggle = section.querySelector('div[class*="w-10"]') as HTMLElement
    await user.click(toggle)
    await waitFor(() => expect(screen.getByLabelText('Mensaje de mantenimiento')).toBeInTheDocument())

    await user.click(toggle)
    await waitFor(() => expect(screen.queryByLabelText('Mensaje de mantenimiento')).not.toBeInTheDocument())
  })
})

describe('Configuracion — edición de campos generales', () => {
  test('editar el nombre del sistema y guardarlo envía el valor actualizado', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    const input = await screen.findByDisplayValue('VIGIA-IIAP')
    await user.clear(input)
    await user.type(input, 'Portal Ambiental')
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(api.put).toHaveBeenCalledWith('/admin/configuracion', expect.objectContaining({ siteName: 'Portal Ambiental' }))
  })
})

describe('Configuracion — notificaciones y roles', () => {
  test('los switches de notificaciones se pueden activar y desactivar', async () => {
    const user = userEvent.setup()
    renderPage()

    const row = screen.getByText('Notificar nuevos inicios de sesión').closest('.flex.items-center.justify-between')!
    const toggle = row.querySelector('div[class*="w-10"]') as HTMLElement
    expect(toggle.className).not.toContain('bg-primary-800')

    await user.click(toggle)
    expect(toggle.className).toContain('bg-primary-800')
  })

  test('los switches de roles y permisos se pueden desactivar', async () => {
    const user = userEvent.setup()
    renderPage()

    const row = screen.getByText('Requerir aprobación de administrador para nuevos usuarios').closest('.flex.items-center.justify-between')!
    const toggle = row.querySelector('div[class*="w-10"]') as HTMLElement
    expect(toggle.className).toContain('bg-primary-800')

    await user.click(toggle)
    expect(toggle.className).not.toContain('bg-primary-800')
  })

  test('describe los tres roles del sistema', () => {
    renderPage()
    expect(screen.getByText(/Acceso completo al panel de administración/)).toBeInTheDocument()
    expect(screen.getByText(/Solo acceso al inicio de sesión y módulos públicos/)).toBeInTheDocument()
  })
})
