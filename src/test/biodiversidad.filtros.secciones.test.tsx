import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

const opciones = vi.hoisted(() => ({ por: {} as Record<string, unknown> }))
vi.mock('@/hooks/useBiodiversidad', () => ({
  useBiodiversidadOpciones: (_g: string, campo: string, _p: unknown, on: boolean) => ({ data: on ? opciones.por[campo] : undefined, isFetching: false, isError: false }),
  useBiodiversidadSugerencias: () => ({ data: undefined, isFetching: false, isError: false }),
}))

import SeccionFuente from '@/components/herramientas/biodiversidad/filtros/SeccionFuente'
import SeccionTiempo from '@/components/herramientas/biodiversidad/filtros/SeccionTiempo'
import SeccionCalidad from '@/components/herramientas/biodiversidad/filtros/SeccionCalidad'
import MiniMapa from '@/components/herramientas/biodiversidad/mapa/MiniMapa'
import { FILTROS_VACIOS, type Filtros } from '@/components/herramientas/biodiversidad/lib/filtros'

const f = (c: Partial<Filtros> = {}): Filtros => ({ ...FILTROS_VACIOS, ...c })
const UUID = 'e1050db2-9faf-4d72-b860-295debaf9d2a'

beforeEach(() => {
  opciones.por = {
    entidad: { valores: [{ valor: UUID, nombre: 'IIAP', registros: 2792 }] },
    conjunto: { valores: [{ valor: 'bfde67fa-9938-46d8-a1bb-28b82505b716', nombre: 'Colección X', registros: 10 }] },
    tipo_evidencia: { valores: [{ valor: 'HUMAN_OBSERVATION', nombre: 'HUMAN_OBSERVATION', registros: 12291 }] },
  }
})

describe('secciones del panel', () => {
  test('fuente: elegir entidad y conjunto con nombre legible y quitar', async () => {
    const onCambio = vi.fn()
    render(<SeccionFuente grupo="anfibios" filtros={f({ entidad: UUID, nombreEntidad: 'IIAP' })} params={{}} onCambio={onCambio} />)
    expect(screen.getByRole('combobox', { name: 'Entidad publicadora' })).toHaveValue('IIAP')
    await userEvent.click(screen.getByRole('button', { name: 'Quitar Entidad publicadora' }))
    expect(onCambio).toHaveBeenLastCalledWith({ entidad: null, nombre_entidad: null, conjunto: null, nombre_conjunto: null })
    await userEvent.click(screen.getByRole('combobox', { name: 'Conjunto de datos' }))
    await userEvent.click(screen.getByRole('option', { name: /Colección X/ }))
    expect(onCambio).toHaveBeenLastCalledWith({ conjunto: 'bfde67fa-9938-46d8-a1bb-28b82505b716', nombre_conjunto: 'Colección X' })
  })
  test('tiempo: evidencia traducida, años acotados', async () => {
    const onCambio = vi.fn()
    render(<SeccionTiempo grupo="anfibios" filtros={f()} params={{}} desde={2000} hasta={2025} onCambio={onCambio} />)
    await userEvent.selectOptions(screen.getByLabelText('Desde'), '2010')
    expect(onCambio).toHaveBeenLastCalledWith({ anio_desde: '2010' })
    await userEvent.selectOptions(screen.getByLabelText('Hasta'), '2020')
    expect(onCambio).toHaveBeenLastCalledWith({ anio_hasta: '2020' })
    await userEvent.click(screen.getByRole('combobox', { name: 'Tipo de evidencia' }))
    await userEvent.click(screen.getByRole('option', { name: /Observación humana/ }))
    expect(onCambio).toHaveBeenLastCalledWith({ evidencia: 'HUMAN_OBSERVATION' })
  })
  test('calidad: interruptores de foto y ubicación visible', async () => {
    const onCambio = vi.fn()
    const { rerender } = render(<SeccionCalidad filtros={f()} onCambio={onCambio} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Solo con foto' }))
    expect(onCambio).toHaveBeenLastCalledWith({ con_foto: '1' })
    await userEvent.click(screen.getByRole('switch', { name: 'Solo con ubicación visible' }))
    expect(onCambio).toHaveBeenLastCalledWith({ con_ubicacion: '1' })
    rerender(<SeccionCalidad filtros={f({ conFoto: true, conUbicacion: true })} onCambio={onCambio} />)
    await userEvent.click(screen.getByRole('switch', { name: 'Solo con foto' }))
    expect(onCambio).toHaveBeenLastCalledWith({ con_foto: null })
    await userEvent.click(screen.getByRole('switch', { name: 'Solo con ubicación visible' }))
    expect(onCambio).toHaveBeenLastCalledWith({ con_ubicacion: null })
  })
})

describe('MiniMapa', () => {
  test('monta el mapa del registro con el contorno del municipio, la incertidumbre y el punto, y lo desmonta', () => {
    vi.stubGlobal('ResizeObserver', class { observe() { /* sin efecto */ } disconnect() { /* sin efecto */ } })
    const geo = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { c: '05837', n: 'Turbo', d: 'Antioquia' }, geometry: { type: 'Polygon', coordinates: [[[-77, 8], [-76.5, 8], [-76.5, 8.4], [-77, 8.4], [-77, 8]]] } }] }
    const { container, unmount } = render(<MiniMapa lat={8.1} lon={-76.8} incertidumbreM={300} codigoMunicipal="05837" geo={geo as never} descripcion="Mapa de prueba" />)
    expect(screen.getByRole('img', { name: 'Mapa de prueba' })).toBeInTheDocument()
    expect(container.querySelectorAll('path').length).toBe(3)
    unmount()
    vi.unstubAllGlobals()
  })
  test('sin geometría ni incertidumbre dibuja solo el punto', () => {
    vi.stubGlobal('ResizeObserver', class { observe() { /* sin efecto */ } disconnect() { /* sin efecto */ } })
    const { container } = render(<MiniMapa lat={8.1} lon={-76.8} incertidumbreM={null} codigoMunicipal="00000" geo={undefined} descripcion="x" />)
    expect(container.querySelectorAll('path').length).toBe(1)
    vi.unstubAllGlobals()
  })
})
