import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const mutaciones = vi.hoisted(() => ({ general: vi.fn(), subir: vi.fn(), quitar: vi.fn(), herramienta: vi.fn() }))
const datos = vi.hoisted(() => ({
  panel: null as unknown, usuario: null as unknown, cargando: false, error: false,
}))

vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: datos.usuario }) }))
vi.mock('@/hooks/useInformesAdmin', () => {
  const exito = (fn: (arg: unknown) => void) => () => ({
    mutate: (arg: unknown, opts?: { onSuccess?: () => void }) => { fn(arg); opts?.onSuccess?.() }, isPending: false,
  })
  return {
    usePanelInformes: () => ({ data: datos.panel, isPending: datos.cargando, isError: datos.error, error: null }),
    useActualizarGeneral: exito(mutaciones.general),
    useSubirLogo: exito(mutaciones.subir),
    useQuitarLogo: exito(mutaciones.quitar),
    useActualizarHerramientaInforme: exito(mutaciones.herramienta),
  }
})

import Informes from '@/pages/admin/Informes'

const SUPER = { id: 'u-super', rol: 'super_admin', nombre: 'Super' }
const ADMIN_EDITA = { id: 'u-ana', rol: 'admin_sig', modulos: [{ modulo: 'informes', puede_ver: true, puede_editar: true }] }
const ADMIN_VE = { id: 'u-beto', rol: 'admin_sig', modulos: [{ modulo: 'informes', puede_ver: true, puede_editar: false }] }

const panel = (extra: { general?: Record<string, unknown>; herramientas?: unknown[] } = {}) => ({
  general: {
    institucion: 'Vigía · IIAP', subtitulo: null, pie: null, aviso: null, color_primario: '#009846', color_acento: '#0F172A',
    logo_url: null, acceso: 'usuarios', formatos: ['pdf', 'xlsx'], actualizado_en: '2026-11-11T10:00:00Z', ...extra.general,
  },
  herramientas: extra.herramientas ?? [
    { clave: 'biodiversidad', titulo: 'Observatorio de Biodiversidad', activo: true, formatos: null, max_filas: 5000, configurada: true },
    { clave: 'conversor', titulo: 'Conversor de Coordenadas', activo: false, formatos: null, max_filas: 5000, configurada: false },
  ],
})

beforeEach(() => {
  Object.values(mutaciones).forEach((m) => m.mockClear())
  datos.panel = panel()
  datos.usuario = SUPER
  datos.cargando = false
  datos.error = false
})

describe('Informes (panel de administración)', () => {
  test('por defecto solo descargan las cuentas con sesión y se ofrecen PDF y Excel', () => {
    render(<Informes />)
    expect(screen.getByRole('radio', { name: /Solo cuentas con sesión/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Cualquier persona/ })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /^PDF/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /^Excel/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /^CSV/ })).not.toBeChecked()
  })

  test('abrir la descarga a cualquier persona se guarda al instante', async () => {
    render(<Informes />)
    await userEvent.click(screen.getByRole('radio', { name: /Cualquier persona/ }))
    expect(mutaciones.general).toHaveBeenCalledWith({ acceso: 'publico' })
    expect(screen.getByRole('status')).toHaveTextContent('Configuración guardada.')
  })

  test('los formatos se guardan en orden y nunca se puede quitar el último', async () => {
    render(<Informes />)
    await userEvent.click(screen.getByRole('checkbox', { name: /^CSV/ }))
    expect(mutaciones.general).toHaveBeenLastCalledWith({ formatos: ['pdf', 'xlsx', 'csv'] })
    await userEvent.click(screen.getByRole('checkbox', { name: /^Excel/ }))
    expect(mutaciones.general).toHaveBeenLastCalledWith({ formatos: ['pdf'] })

    datos.panel = panel({ general: { formatos: ['pdf'] } })
    render(<Informes />)
    const casillas = screen.getAllByRole('checkbox', { name: /^PDF/ })
    expect(casillas[casillas.length - 1]).toBeDisabled()
  })

  test('la plantilla se guarda con los valores editados y sin logo explica cómo se ve', async () => {
    render(<Informes />)
    expect(screen.getByRole('button', { name: 'Guardar plantilla' })).toBeDisabled()
    expect(screen.getByText(/Sin logo oficial por ahora/)).toBeInTheDocument()

    const nombre = screen.getByLabelText('Nombre de la institución')
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'IIAP')
    await userEvent.type(screen.getByLabelText('Subtítulo'), 'Observatorio')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar plantilla' }))

    expect(mutaciones.general).toHaveBeenCalledWith(expect.objectContaining({
      institucion: 'IIAP', subtitulo: 'Observatorio', color_primario: '#009846', color_acento: '#0F172A',
    }))
    expect(within(screen.getByRole('figure', { name: 'Vista previa del informe' })).getByText('IIAP')).toBeInTheDocument()
  })

  test('rechaza un nombre muy corto o un color mal escrito sin llamar al servidor', async () => {
    render(<Informes />)
    const nombre = screen.getByLabelText('Nombre de la institución')
    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'I')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar plantilla' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/entre 2 y 120/)

    await userEvent.clear(nombre)
    await userEvent.type(nombre, 'IIAP')
    const hex = screen.getAllByRole('textbox').find((e) => (e as HTMLInputElement).value === '#009846') as HTMLInputElement
    await userEvent.clear(hex)
    await userEvent.type(hex, 'verde')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar plantilla' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/#RRGGBB/)
    expect(mutaciones.general).not.toHaveBeenCalled()
  })

  test('el logo solo acepta PNG, JPG o WebP de hasta 2 MB', () => {
    render(<Informes />)
    const entrada = screen.getByLabelText('Archivo del logo')

    fireEvent.change(entrada, { target: { files: [new File(['x'], 'logo.gif', { type: 'image/gif' })] } })
    expect(screen.getByRole('status')).toHaveTextContent('El logo debe ser PNG, JPG o WebP.')

    const grande = new File(['x'], 'logo.png', { type: 'image/png' })
    Object.defineProperty(grande, 'size', { value: 3 * 1024 * 1024 })
    fireEvent.change(entrada, { target: { files: [grande] } })
    expect(screen.getByRole('status')).toHaveTextContent('El logo pesa más de 2 MB.')
    expect(mutaciones.subir).not.toHaveBeenCalled()

    const bueno = new File(['x'], 'logo.png', { type: 'image/png' })
    fireEvent.change(entrada, { target: { files: [bueno] } })
    expect(mutaciones.subir).toHaveBeenCalledWith(bueno)
  })

  test('con logo se muestra en la vista previa y se puede quitar', async () => {
    datos.panel = panel({ general: { logo_url: 'https://cdn.example.org/informes/logo.webp' } })
    render(<Informes />)
    expect(screen.getByAltText('Logo del informe')).toHaveAttribute('src', 'https://cdn.example.org/informes/logo.webp')
    await userEvent.click(screen.getByRole('button', { name: /Quitar logo/ }))
    expect(mutaciones.quitar).toHaveBeenCalled()
  })

  test('enciende y apaga el informe de Biodiversidad; el conversor aún no genera informes', async () => {
    render(<Informes />)
    await userEvent.click(screen.getByRole('switch', { name: 'Informe de Observatorio de Biodiversidad' }))
    expect(mutaciones.herramienta).toHaveBeenCalledWith({ clave: 'biodiversidad', cambio: { activo: false } })
    expect(screen.getByRole('switch', { name: 'Informe de Conversor de Coordenadas' })).toBeDisabled()
    expect(screen.getByText('Esta herramienta todavía no genera informes.')).toBeInTheDocument()
  })

  test('formatos propios y tope de filas por herramienta, con límites', async () => {
    render(<Informes />)
    const tope = screen.getByLabelText(/^Tope de filas por descarga/)
    await userEvent.clear(tope)
    await userEvent.type(tope, '50')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar formatos y tope' }))
    expect(screen.getByText(/entre 100 y 50\.000/)).toBeInTheDocument()
    expect(mutaciones.herramienta).not.toHaveBeenCalled()

    await userEvent.clear(tope)
    await userEvent.type(tope, '1000')
    await userEvent.click(screen.getByRole('radio', { name: 'Elegir' }))
    const grupo = screen.getByRole('group', { name: 'Formatos de esta herramienta' })
    await userEvent.click(within(grupo).getByRole('checkbox', { name: 'Excel (.xlsx)' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar formatos y tope' }))
    expect(mutaciones.herramienta).toHaveBeenCalledWith({ clave: 'biodiversidad', cambio: { formatos: ['pdf'], max_filas: 1000 } })
  })

  test('usar los formatos generales guarda null', async () => {
    datos.panel = panel({ herramientas: [{ clave: 'biodiversidad', titulo: 'Observatorio de Biodiversidad', activo: true, formatos: ['csv'], max_filas: 2000, configurada: true }] })
    render(<Informes />)
    await userEvent.click(screen.getByRole('radio', { name: /Los generales/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar formatos y tope' }))
    expect(mutaciones.herramienta).toHaveBeenCalledWith({ clave: 'biodiversidad', cambio: { formatos: null, max_filas: 2000 } })
  })

  test('un administrador que solo puede ver no edita nada', () => {
    datos.usuario = ADMIN_VE
    render(<Informes />)
    expect(screen.getByText(/Solo lectura/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Cualquier persona/ })).toBeDisabled()
    expect(screen.queryByRole('button', { name: 'Guardar plantilla' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Subir logo/ })).not.toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Informe de Observatorio de Biodiversidad' })).toBeDisabled()
  })

  test('un administrador con permiso de edición sí puede cambiar', async () => {
    datos.usuario = ADMIN_EDITA
    render(<Informes />)
    await userEvent.click(screen.getByRole('radio', { name: /Cualquier persona/ }))
    expect(mutaciones.general).toHaveBeenCalledWith({ acceso: 'publico' })
  })

  test('muestra un esqueleto mientras carga y un error si falla', () => {
    datos.cargando = true
    const { unmount } = render(<Informes />)
    expect(screen.queryByRole('radio')).not.toBeInTheDocument()
    unmount()

    datos.cargando = false
    datos.error = true
    datos.panel = undefined
    render(<Informes />)
    expect(screen.getByRole('alert')).toHaveTextContent('No se pudo cargar la configuración de informes')
  })
})
