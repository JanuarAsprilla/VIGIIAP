import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

const estado = vi.hoisted(() => ({ config: undefined as unknown }))
const navegar = vi.hoisted(() => vi.fn())
const generar = vi.hoisted(() => vi.fn())
const guardar = vi.hoisted(() => vi.fn())

vi.mock('@/hooks/useConfiguracionInforme', () => ({ useConfiguracionInforme: () => ({ data: estado.config }) }))
vi.mock('react-router-dom', async (importOriginal) => ({ ...(await importOriginal<typeof import('react-router-dom')>()), useNavigate: () => navegar }))
vi.mock('@/lib/generarInforme', () => ({ generarArchivo: generar, guardarArchivo: guardar }))

import BotonDescargarInforme from '@/components/informes/BotonDescargarInforme'
import type { DatosInforme } from '@/lib/generarInforme'

const PLANTILLA = { institucion: 'Vigía · IIAP', subtitulo: null, pie: null, aviso: null, colorPrimario: '#009846', colorAcento: '#0F172A', logoUrl: null }
const config = (extra: Record<string, unknown> = {}) => ({
  habilitado: true, puedeDescargar: true, requiereSesion: true, formatos: ['pdf', 'xlsx'], maxFilas: 5000, plantilla: PLANTILLA, ...extra,
})
const DATOS = { titulo: 'Informe', generadoEn: new Date(), filtros: [], secciones: [], fuente: [], nombreArchivo: 'informe' } as DatosInforme

function pintar(construir = vi.fn().mockResolvedValue(DATOS)) {
  const vista = render(<MemoryRouter initialEntries={['/herramientas?grupo=aves']}><BotonDescargarInforme herramienta="biodiversidad" construir={construir} /></MemoryRouter>)
  return { construir, ...vista }
}

beforeEach(() => {
  vi.clearAllMocks()
  estado.config = config()
  generar.mockResolvedValue({ blob: new Blob(['x']), nombre: 'informe.pdf' })
})

describe('BotonDescargarInforme', () => {
  test('no aparece mientras carga, si el informe está apagado o si no hay formatos', () => {
    estado.config = undefined
    expect(pintar().container).toBeEmptyDOMElement()
    estado.config = config({ habilitado: false, formatos: [] })
    expect(pintar().container).toBeEmptyDOMElement()
    estado.config = config({ formatos: [] })
    expect(pintar().container).toBeEmptyDOMElement()
  })

  test('sin sesión, cuando el servidor la exige, invita a iniciarla y vuelve a esta página', async () => {
    estado.config = config({ puedeDescargar: false })
    const { construir } = pintar()
    const boton = screen.getByRole('button', { name: /Descargar informe/ })
    expect(boton).toHaveAccessibleName(/requiere iniciar sesión/)
    await userEvent.click(boton)
    expect(navegar).toHaveBeenCalledWith('/login', { state: { from: expect.objectContaining({ pathname: '/herramientas', search: '?grupo=aves' }) } })
    expect(construir).not.toHaveBeenCalled()
  })

  test('con varios formatos abre un menú con solo los habilitados', async () => {
    pintar()
    const disparador = screen.getByRole('button', { name: 'Descargar informe' })
    expect(disparador).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(disparador)
    expect(disparador).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getAllByRole('menuitem').map((i) => i.textContent)).toEqual(['PDF', 'Excel'])
  })

  test('elegir un formato reúne los datos con el tope, genera el archivo, lo guarda y avisa', async () => {
    const { construir } = pintar()
    await userEvent.click(screen.getByRole('button', { name: 'Descargar informe' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'PDF' }))
    await waitFor(() => expect(guardar).toHaveBeenCalled())
    expect(construir).toHaveBeenCalledWith(5000, expect.any(AbortSignal))
    expect(generar).toHaveBeenCalledWith('pdf', DATOS, PLANTILLA, expect.any(AbortSignal))
    expect(guardar).toHaveBeenCalledWith(expect.any(Blob), 'informe.pdf')
    expect(screen.getByRole('status')).toHaveTextContent('Informe descargado: informe.pdf')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('mientras prepara el informe el botón queda ocupado', async () => {
    let terminar: (d: DatosInforme) => void = () => {}
    const construir = vi.fn().mockReturnValue(new Promise<DatosInforme>((resolver) => { terminar = resolver }))
    pintar(construir)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar informe' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'Excel' }))
    expect(screen.getByRole('button', { name: /Preparando informe/ })).toBeDisabled()
    terminar(DATOS)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Descargar informe' })).toBeEnabled())
  })

  test('con un solo formato descarga directo, sin menú', async () => {
    estado.config = config({ formatos: ['xlsx'] })
    pintar()
    const boton = screen.getByRole('button', { name: 'Descargar informe (Excel)' })
    expect(boton).not.toHaveAttribute('aria-haspopup')
    await userEvent.click(boton)
    await waitFor(() => expect(generar).toHaveBeenCalledWith('xlsx', DATOS, PLANTILLA, expect.any(AbortSignal)))
  })

  test('si falla, lo dice, no guarda nada y deja volver a intentar', async () => {
    const construir = vi.fn().mockRejectedValue(new Error('sin conexión'))
    pintar(construir)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar informe' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'PDF' }))
    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/No se pudo generar el informe/))
    expect(guardar).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Descargar informe' })).toBeEnabled()
  })

  test('Escape y un clic afuera cierran el menú; las flechas recorren las opciones', async () => {
    pintar()
    const disparador = screen.getByRole('button', { name: 'Descargar informe' })
    await userEvent.click(disparador)
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'PDF' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'Excel' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('menuitem', { name: 'PDF' })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}')
    expect(screen.getByRole('menuitem', { name: 'Excel' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    expect(disparador).toHaveFocus()

    await userEvent.click(disparador)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await userEvent.click(document.body)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  test('al salir de la página cancela lo que estaba preparando', async () => {
    let senal: AbortSignal | null = null
    const construir = vi.fn((_: number, s: AbortSignal) => { senal = s; return new Promise<DatosInforme>(() => {}) })
    const { unmount } = pintar(construir)
    await userEvent.click(screen.getByRole('button', { name: 'Descargar informe' }))
    await userEvent.click(screen.getByRole('menuitem', { name: 'PDF' }))
    expect((senal as AbortSignal | null)?.aborted).toBe(false)
    unmount()
    expect((senal as AbortSignal | null)?.aborted).toBe(true)
  })
})
