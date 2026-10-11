import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn(), put: vi.fn(), post: vi.fn().mockResolvedValue({}) } }))
import api from '@/lib/api'

const authMock = { user: { name: 'Root', role: 'Super Administrador', rol: 'super_admin' } }
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))

function renderPage() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <MemoryRouter>
      <QueryClientProvider client={qc}><Configuracion /></QueryClientProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(api.get).mockResolvedValue({})
})

describe('Configuracion — carga remota', () => {
  test('precarga los campos generales con la config remota', async () => {
    vi.mocked(api.get).mockResolvedValue(
      { siteName: 'Portal de Prueba', modoMantenimiento: 'true', mensajeMantenimiento: 'En mantenimiento' },
    )

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

describe('Configuracion — páginas legales (Política de Privacidad y Términos de Uso)', () => {
  test('precarga la política de privacidad y los términos de uso desde la config remota', async () => {
    vi.mocked(api.get).mockResolvedValue({
      politicaPrivacidad: 'Texto de la política guardado.',
      terminosUso: 'Texto de los términos guardado.',
    })

    renderPage()

    expect(await screen.findByDisplayValue('Texto de la política guardado.')).toBeInTheDocument()
    expect(await screen.findByDisplayValue('Texto de los términos guardado.')).toBeInTheDocument()
  })

  test('guardar incluye politicaPrivacidad y terminosUso en el payload', async () => {
    vi.mocked(api.get).mockResolvedValue({
      politicaPrivacidad: 'Política original.',
      terminosUso: 'Términos originales.',
    })
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()
    await screen.findByDisplayValue('Política original.')

    const terminosTextarea = screen.getByDisplayValue('Términos originales.')
    await user.clear(terminosTextarea)
    await user.type(terminosTextarea, 'Términos actualizados.')
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(await screen.findByRole('button', { name: /¡Guardado!/i })).toBeInTheDocument()
    expect(api.put).toHaveBeenCalledWith('/admin/configuracion', expect.objectContaining({
      politicaPrivacidad: 'Política original.',
      terminosUso: 'Términos actualizados.',
    }))
  })
})

describe('Configuracion — modo mantenimiento', () => {
  test('activar el modo mantenimiento revela el campo de mensaje', async () => {
    const user = userEvent.setup()
    renderPage()

    expect(screen.queryByLabelText('Mensaje de mantenimiento')).not.toBeInTheDocument()

    const section = screen.getByText('Activar modo mantenimiento').closest('.flex.items-center.justify-between')! as HTMLElement
    const toggle = within(section).getByRole('switch')
    await user.click(toggle)

    await waitFor(() => expect(screen.getByLabelText('Mensaje de mantenimiento')).toBeInTheDocument())
  })

  test('desactivarlo de nuevo oculta el campo de mensaje', async () => {
    const user = userEvent.setup()
    renderPage()

    const section = screen.getByText('Activar modo mantenimiento').closest('.flex.items-center.justify-between')! as HTMLElement
    const toggle = within(section).getByRole('switch')
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

    const row = screen.getByText('Notificar nuevos inicios de sesión').closest('.flex.items-center.justify-between')! as HTMLElement
    const toggle = within(row).getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'true')
  })

  test('los switches de roles y permisos se pueden desactivar', async () => {
    const user = userEvent.setup()
    renderPage()

    const row = screen.getByText('Requerir aprobación de administrador para nuevos usuarios').closest('.flex.items-center.justify-between')! as HTMLElement
    const toggle = within(row).getByRole('switch')
    expect(toggle).toHaveAttribute('aria-checked', 'true')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-checked', 'false')
  })

  test('describe los tres roles del sistema', () => {
    renderPage()
    expect(screen.getByText(/Acceso completo al panel de administración/)).toBeInTheDocument()
    expect(screen.getByText(/Solo acceso al inicio de sesión y módulos públicos/)).toBeInTheDocument()
  })

  test('ya no expone el toggle de reporte semanal — ese flujo se movió a un reporte bajo demanda', () => {
    renderPage()
    expect(screen.queryByText('Reporte semanal de actividad')).not.toBeInTheDocument()
  })

  test('enlaza a la pestaña Reportes de Actividad para generar el reporte', () => {
    renderPage()
    const link = screen.getByRole('link', { name: /Generar reporte de actividad/i })
    expect(link).toHaveAttribute('href', '/admin/actividad?tab=reportes')
  })
})

describe('Configuracion — SMTP (solo super_admin)', () => {
  test('admin_sig no ve la sección de Correo (SMTP)', () => {
    authMock.user = { name: 'Admin', role: 'Administrador SIG', rol: 'admin_sig' }
    renderPage()
    expect(screen.queryByText('Correo (SMTP)')).not.toBeInTheDocument()
    authMock.user = { name: 'Root', role: 'Super Administrador', rol: 'super_admin' }
  })

  test('super_admin sí ve la sección y sus campos', async () => {
    renderPage()
    expect(await screen.findByText('Correo (SMTP)')).toBeInTheDocument()
    expect(screen.getByLabelText('Servidor (host)')).toBeInTheDocument()
    expect(screen.getByLabelText('Puerto')).toBeInTheDocument()
  })

  test('precarga host/puerto/usuario, pero NUNCA la contraseña (el backend no la devuelve)', async () => {
    vi.mocked(api.get).mockResolvedValue(
      { mail_host: 'smtp.instituto.co', mail_port: '465', mail_user: 'x@iiap.org.co', mail_pass_configurado: true },
    )
    renderPage()

    expect(await screen.findByDisplayValue('smtp.instituto.co')).toBeInTheDocument()
    expect(screen.getByDisplayValue('465')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('')
    expect(screen.getByText('(ya hay una guardada)')).toBeInTheDocument()
  })

  test('si no se escribe una contraseña nueva, no se manda mail_pass en el guardado', async () => {
    vi.mocked(api.get).mockResolvedValue({ mail_pass_configurado: true })
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    await screen.findByText('(ya hay una guardada)')
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    const body = vi.mocked(api.put).mock.calls[0][1] as Record<string, unknown>
    expect(body).not.toHaveProperty('mail_pass')
  })

  test('si se escribe una contraseña nueva, sí se incluye en el guardado', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/^Contraseña/), 'clave-nueva-123')
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(api.put).toHaveBeenCalledWith('/admin/configuracion', expect.objectContaining({ mail_pass: 'clave-nueva-123' }))
  })

  test('el botón "mostrar" revela la contraseña en texto plano', async () => {
    const user = userEvent.setup()
    renderPage()

    const input = screen.getByLabelText(/^Contraseña/)
    expect(input).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(input).toHaveAttribute('type', 'text')
  })

  test('"Enviar correo de prueba" llama al endpoint y muestra confirmación', async () => {
    const user = userEvent.setup()
    renderPage()

    await user.click(screen.getByRole('button', { name: /Enviar correo de prueba/i }))

    expect(api.post).toHaveBeenCalledWith('/admin/configuracion/probar-correo')
    expect(await screen.findByText(/Enviado — revisa tu bandeja/i)).toBeInTheDocument()
  })

  test('si el correo de prueba falla, muestra el mensaje de error del backend', async () => {
    const user = userEvent.setup()
    renderPage()
    vi.mocked(api.post).mockRejectedValueOnce(new Error('SMTP no configurado'))

    await user.click(screen.getByRole('button', { name: /Enviar correo de prueba/i }))

    expect(await screen.findByText('SMTP no configurado')).toBeInTheDocument()
  })

  test('precarga correo remitente y su nombre', async () => {
    vi.mocked(api.get).mockResolvedValue({ mail_remitente: 'notificaciones@iiap.org.co', mail_remitente_nombre: 'VIGIIAP' })
    renderPage()

    expect(await screen.findByDisplayValue('notificaciones@iiap.org.co')).toBeInTheDocument()
    expect(screen.getByDisplayValue('VIGIIAP')).toBeInTheDocument()
  })

  test('guarda correo remitente y su nombre', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText(/Correo remitente/i), 'alertas@iiap.org.co')
    await user.type(screen.getByLabelText('Nombre del remitente'), 'VIGIIAP — IIAP')
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(api.put).toHaveBeenCalledWith('/admin/configuracion', expect.objectContaining({
      mail_remitente: 'alertas@iiap.org.co', mail_remitente_nombre: 'VIGIIAP — IIAP',
    }))
  })
})

describe('Configuracion — Ajustes Avanzados (solo super_admin)', () => {
  test('admin_sig no ve la sección', () => {
    authMock.user = { name: 'Admin', role: 'Administrador SIG', rol: 'admin_sig' }
    renderPage()
    expect(screen.queryByText('Ajustes Avanzados')).not.toBeInTheDocument()
    authMock.user = { name: 'Root', role: 'Super Administrador', rol: 'super_admin' }
  })

  test('precarga los tres campos con la config remota', async () => {
    vi.mocked(api.get).mockResolvedValue(
      { cors_extra_origins: 'https://staging.iiap.org.co', rate_limit_max: '250', admin_email_fallback: 'respaldo@iiap.org.co' },
    )
    renderPage()

    expect(await screen.findByDisplayValue('https://staging.iiap.org.co')).toBeInTheDocument()
    expect(screen.getByDisplayValue('250')).toBeInTheDocument()
    expect(screen.getByDisplayValue('respaldo@iiap.org.co')).toBeInTheDocument()
  })

  test('el campo de límite de peticiones solo acepta dígitos', async () => {
    const user = userEvent.setup()
    renderPage()

    const input = screen.getByPlaceholderText('100')
    await user.type(input, 'a1b2c3')
    expect(input).toHaveValue('123')
  })

  test('guardar incluye los tres ajustes en el payload', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    await user.type(screen.getByLabelText('Dominios adicionales permitidos (CORS)'), 'https://extra.co')
    await user.type(screen.getByPlaceholderText('100'), '300')
    await user.type(screen.getByLabelText('Correo de respaldo para alertas admin'), 'r@iiap.org.co')
    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(api.put).toHaveBeenCalledWith('/admin/configuracion', expect.objectContaining({
      cors_extra_origins: 'https://extra.co',
      rate_limit_max: '300',
      admin_email_fallback: 'r@iiap.org.co',
    }))
  })
})

describe('Configuracion — Seguridad (solo super_admin)', () => {
  test('admin_sig no ve la sección', () => {
    authMock.user = { name: 'Admin', role: 'Administrador SIG', rol: 'admin_sig' }
    renderPage()
    expect(screen.queryByText('Seguridad')).not.toBeInTheDocument()
    authMock.user = { name: 'Root', role: 'Super Administrador', rol: 'super_admin' }
  })

  test('precarga los tres campos con la config remota', async () => {
    vi.mocked(api.get).mockResolvedValue(
      { passwordExpiryDays: '60', passwordMinLength: '12', require2faAdmins: 'true' },
    )
    renderPage()

    expect(await screen.findByDisplayValue('60')).toBeInTheDocument()
    expect(screen.getByDisplayValue('12')).toBeInTheDocument()
    const row = screen.getByText('Exigir 2FA a administradores').closest('.flex.items-center.justify-between')! as HTMLElement
    expect(within(row).getByRole('switch')).toHaveAttribute('aria-checked', 'true')
  })

  test('sin config remota, usa los valores por defecto (90 días, 8 caracteres, 2FA no exigido)', async () => {
    renderPage()

    expect(await screen.findByDisplayValue('90')).toBeInTheDocument()
    expect(screen.getByDisplayValue('8')).toBeInTheDocument()
    const row = screen.getByText('Exigir 2FA a administradores').closest('.flex.items-center.justify-between')! as HTMLElement
    expect(within(row).getByRole('switch')).toHaveAttribute('aria-checked', 'false')
  })

  test('el campo de longitud mínima solo acepta dígitos', async () => {
    const user = userEvent.setup()
    renderPage()

    const input = await screen.findByDisplayValue('8')
    await user.clear(input)
    await user.type(input, 'a1b2c')
    expect(input).toHaveValue('12')
  })

  test('guardar incluye los tres ajustes de seguridad en el payload', async () => {
    vi.mocked(api.put).mockResolvedValue({})
    const user = userEvent.setup()
    renderPage()

    const expiryInput = await screen.findByDisplayValue('90')
    await user.clear(expiryInput)
    await user.type(expiryInput, '45')

    const row = screen.getByText('Exigir 2FA a administradores').closest('.flex.items-center.justify-between')! as HTMLElement
    await user.click(within(row).getByRole('switch'))

    await user.click(screen.getByRole('button', { name: /Guardar Cambios/i }))

    expect(api.put).toHaveBeenCalledWith('/admin/configuracion', expect.objectContaining({
      passwordExpiryDays: '45',
      passwordMinLength: '8',
      require2faAdmins: 'true',
    }))
  })
})
