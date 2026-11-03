import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mutaciones = vi.hoisted(() => ({
  cambiar: vi.fn(), guardar: vi.fn(), borrar: vi.fn(), solicitar: vi.fn(),
}))
const datos = vi.hoisted(() => ({ estado: null as unknown, ejecuciones: { ejecuciones: [] as unknown[] }, usuario: null as unknown }))

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: datos.usuario }) }))
vi.mock('@/hooks/useActualizacionBiodiversidad', () => {
  const exito = (fn: (arg: unknown) => void) => () => ({
    mutate: (arg: unknown, opts?: { onSuccess?: () => void }) => { fn(arg); opts?.onSuccess?.() }, isPending: false,
  })
  return {
    useEstadoActualizacion: () => ({ data: datos.estado, isPending: false, isError: false, error: null }),
    useEjecucionesActualizacion: () => ({ data: datos.ejecuciones, isPending: false }),
    useCambiarAjustes: exito(mutaciones.cambiar),
    useGuardarCredencial: exito(mutaciones.guardar),
    useBorrarCredencial: exito(mutaciones.borrar),
    useSolicitarActualizacion: exito(mutaciones.solicitar),
  }
})

import DatosBiodiversidad from '@/pages/admin/DatosBiodiversidad'

const SUPER = { id: 'u-super', rol: 'super_admin', nombre: 'Super' }
const ADMIN_EDITA = { id: 'u-ana', rol: 'admin_sig', nombre: 'Ana', modulos: [{ modulo: 'biodiversidad_datos', puede_ver: true, puede_editar: true }] }
const ADMIN_VE = { id: 'u-beto', rol: 'admin_sig', nombre: 'Beto', modulos: [{ modulo: 'biodiversidad_datos', puede_ver: true, puede_editar: false }] }

const estado = (extra: Record<string, unknown> = {}) => ({
  ajustes: { modo: 'publico', activa: true, frecuencia_dias: 30, credencial_usuario_id: null, credencial_nombre: null, actualizado_en: '2026-11-01T10:00:00Z' },
  cifrado_disponible: true,
  credenciales: [],
  ultimas_ejecuciones: [
    { id: 1, tarea: 'frescura', disparador: 'programada', estado: 'ok', creado_en: '2026-11-01T07:00:00Z', inicio: null, fin: '2026-11-01T07:05:00Z',
      resumen: { grupos: { aves: { gbif: 1070, base: 1000, crecimiento_pct: 7 } } } },
  ],
  cortes: [{ grupo: 'aves', desde: 2000, hasta: 2025, fecha_fuente: '2026-10-20T00:00:00Z', registros: 2919072 }],
  ...extra,
})

beforeEach(() => {
  Object.values(mutaciones).forEach((m) => m.mockClear())
  datos.estado = estado()
  datos.ejecuciones = { ejecuciones: [{ id: 5, tarea: 'fotos', disparador: 'manual', estado: 'error', creado_en: '2026-11-02T08:00:00Z', inicio: null, fin: null, solicitado_por: 'Ana', resumen: { mensaje: 'GBIF no respondió' } }] }
  datos.usuario = SUPER
})

describe('Datos de biodiversidad (panel de administración)', () => {
  test('muestra los cortes con su fuente y cuánto ha crecido GBIF, y el historial con su motivo', () => {
    render(<DatosBiodiversidad />)
    const fila = screen.getByRole('row', { name: /Aves/ })
    expect(within(fila).getByText('2.919.072')).toBeInTheDocument()
    expect(within(fila).getByText('+7 %')).toBeInTheDocument()
    expect(screen.getByText(/pedida por Ana/)).toBeInTheDocument()
    expect(screen.getByText('GBIF no respondió')).toBeInTheDocument()
  })

  test('el super administrador cambia la configuración; el modo con cuenta espera a que alguien guarde la suya', async () => {
    render(<DatosBiodiversidad />)
    await userEvent.click(screen.getByRole('switch', { name: 'Actualización automática' }))
    expect(mutaciones.cambiar).toHaveBeenLastCalledWith({ activa: false })
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /Cada cuántos días/ }), '15')
    expect(mutaciones.cambiar).toHaveBeenLastCalledWith({ frecuencia_dias: 15 })
    expect(screen.getByRole('radio', { name: /Con cuenta de GBIF/ })).toBeDisabled()
  })

  test('con una cuenta guardada se puede elegir el modo con cuenta y quién la aporta', async () => {
    datos.estado = estado({ credenciales: [{ usuario_id: 'u-ana', nombre: 'Ana', email: 'ana@x.co', gbif_usuario: 'ana_gbif', gbif_correo: 'ana@x.co', actualizado_en: '2026-11-01T10:00:00Z' }] })
    render(<DatosBiodiversidad />)
    await userEvent.click(screen.getByRole('radio', { name: /Con cuenta de GBIF/ }))
    expect(mutaciones.cambiar).toHaveBeenLastCalledWith({ modo: 'cuenta', credencial_usuario_id: 'u-ana' })
    expect(screen.getByRole('list', { name: 'Cuentas de otras personas' })).toBeInTheDocument()
  })

  test('un administrador con el módulo en «editar» pide actualizaciones pero no cambia la configuración', async () => {
    datos.usuario = ADMIN_EDITA
    render(<DatosBiodiversidad />)
    expect(screen.getByRole('switch', { name: 'Actualización automática' })).toBeDisabled()
    expect(screen.getByText(/Solo lectura/)).toBeInTheDocument()
    const botones = screen.getAllByRole('button', { name: 'Actualizar ahora' })
    expect(botones).toHaveLength(3)
    expect(botones[2]).toBeDisabled()
    await userEvent.click(botones[0])
    expect(mutaciones.solicitar).toHaveBeenLastCalledWith('fotos')
    expect(screen.getByRole('status')).toHaveTextContent(/Solicitud enviada/)
  })

  test('quien solo puede ver no tiene botones de actualizar ni la tarjeta de la cuenta de GBIF', () => {
    datos.usuario = ADMIN_VE
    render(<DatosBiodiversidad />)
    expect(screen.queryByRole('button', { name: 'Actualizar ahora' })).not.toBeInTheDocument()
    expect(screen.queryByText('Usuario de GBIF')).not.toBeInTheDocument()
  })

  test('la clave se escribe en un campo de contraseña, se envía una vez y el formulario se vacía', async () => {
    datos.usuario = ADMIN_EDITA
    render(<DatosBiodiversidad />)
    const clave = screen.getByLabelText('Clave') as HTMLInputElement
    expect(clave.type).toBe('password')
    await userEvent.type(screen.getByLabelText('Usuario de GBIF'), 'ana_gbif')
    await userEvent.type(screen.getByLabelText('Correo de la cuenta'), 'ana@x.co')
    await userEvent.type(clave, 'clave-ficticia-123')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar mi cuenta' }))
    expect(mutaciones.guardar).toHaveBeenCalledWith({ gbif_usuario: 'ana_gbif', gbif_correo: 'ana@x.co', clave: 'clave-ficticia-123' })
    expect((screen.getByLabelText('Clave') as HTMLInputElement).value).toBe('')
    expect(document.body.textContent).not.toContain('clave-ficticia-123')
  })

  test('sin clave de cifrado en el servidor avisa y no deja guardar', () => {
    datos.usuario = ADMIN_EDITA
    datos.estado = estado({ cifrado_disponible: false })
    render(<DatosBiodiversidad />)
    expect(screen.getByRole('alert')).toHaveTextContent(/BIODIVERSIDAD_ENCRYPTION_KEY/)
    expect(screen.getByRole('button', { name: 'Guardar mi cuenta' })).toBeDisabled()
  })

  test('muestra y permite quitar la propia cuenta sin mostrar nunca la clave', async () => {
    datos.usuario = ADMIN_EDITA
    datos.estado = estado({ credenciales: [{ usuario_id: 'u-ana', nombre: 'Ana', email: 'ana@x.co', gbif_usuario: 'ana_gbif', gbif_correo: 'ana@x.co', actualizado_en: '2026-11-01T10:00:00Z' }] })
    render(<DatosBiodiversidad />)
    expect(screen.getByText('ana_gbif')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Quitar' }))
    expect(mutaciones.borrar).toHaveBeenCalledWith(undefined)
  })
})
