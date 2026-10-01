import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FichaCapaConfigRow from '@/components/admin/geovisores/fichas/FichaCapaConfigRow'

vi.mock('@/hooks/useFichasPunto', () => ({
  useAtributosCapa: vi.fn(),
  useConfigFichasCapa: vi.fn(),
  useUpsertConfigFichasCapa: vi.fn(),
  useFeaturesFichas: vi.fn(),
  useEliminarConfigFichasCapa: vi.fn(),
}))
import {
  useAtributosCapa, useConfigFichasCapa, useUpsertConfigFichasCapa, useFeaturesFichas, useEliminarConfigFichasCapa,
} from '@/hooks/useFichasPunto'

vi.mock('@/components/admin/geovisores/fichas/FichasCapaModal', () => ({
  default: ({ capaNombre, onClose }: { capaNombre: string; onClose: () => void }) => (
    <div data-testid="fichas-modal">
      <span>Modal de {capaNombre}</span>
      <button onClick={onClose}>cerrar-modal-test</button>
    </div>
  ),
}))

const atributosFixture = [{ nombre: 'codigo_estacion', tipo: 'string' }, { nombre: 'nombre_estacion', tipo: 'string' }]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAtributosCapa).mockReturnValue({ data: atributosFixture, isLoading: false } as unknown as ReturnType<typeof useAtributosCapa>)
  vi.mocked(useConfigFichasCapa).mockReturnValue({ data: null, isLoading: false } as unknown as ReturnType<typeof useConfigFichasCapa>)
  vi.mocked(useUpsertConfigFichasCapa).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false } as unknown as ReturnType<typeof useUpsertConfigFichasCapa>)
  vi.mocked(useFeaturesFichas).mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useFeaturesFichas>)
  vi.mocked(useEliminarConfigFichasCapa).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false } as unknown as ReturnType<typeof useEliminarConfigFichasCapa>)
})

describe('FichaCapaConfigRow — quitar la configuración', () => {
  const configExistente = { id: 'cfg1', conexionGeoserverId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo_estacion', campoEtiqueta: null, creadoEn: '', actualizadoEn: '' }
  const conConfig = () => vi.mocked(useConfigFichasCapa).mockReturnValue({ data: configExistente, isLoading: false } as unknown as ReturnType<typeof useConfigFichasCapa>)
  const montar = () => render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)

  test('sin config todavía no ofrece quitarla', () => {
    montar()
    expect(screen.queryByRole('button', { name: /Quitar configuración/i })).not.toBeInTheDocument()
  })

  test('con config, pide confirmación antes de quitarla y no llama a la mutación todavía', async () => {
    conConfig()
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useEliminarConfigFichasCapa).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useEliminarConfigFichasCapa>)
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('button', { name: /Quitar configuración/i }))

    expect(screen.getByText(/¿Quitar la configuración de esta capa\?/i)).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('cancelar la confirmación no quita nada', async () => {
    conConfig()
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useEliminarConfigFichasCapa).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useEliminarConfigFichasCapa>)
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('button', { name: /Quitar configuración/i }))
    await user.click(screen.getByRole('button', { name: /^Cancelar$/i }))

    expect(screen.queryByText(/¿Quitar la configuración de esta capa\?/i)).not.toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('confirmar la quita y deja el selector de identificador en blanco para rehacerla', async () => {
    conConfig()
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useEliminarConfigFichasCapa).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useEliminarConfigFichasCapa>)
    const user = userEvent.setup()
    montar()
    expect(screen.getByLabelText(/Atributo identificador/i)).toHaveValue('codigo_estacion')
    await user.click(screen.getByRole('button', { name: /Quitar configuración/i }))
    await user.click(screen.getByRole('button', { name: /Sí, quitar/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ configId: 'cfg1', conexionId: 'c1', capaId: 'ws:estaciones' })
    expect(await screen.findByLabelText(/Atributo identificador/i)).toHaveValue('')
  })

  test('si el servidor la rechaza (con fichas o en uso), muestra su mensaje y conserva el identificador', async () => {
    conConfig()
    const mutateAsync = vi.fn().mockRejectedValue(new Error('No se puede quitar la configuración: la capa ya tiene 3 fichas. Elimínalas antes.'))
    vi.mocked(useEliminarConfigFichasCapa).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useEliminarConfigFichasCapa>)
    const user = userEvent.setup()
    montar()
    await user.click(screen.getByRole('button', { name: /Quitar configuración/i }))
    await user.click(screen.getByRole('button', { name: /Sí, quitar/i }))

    expect(await screen.findByText(/la capa ya tiene 3 fichas/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Atributo identificador/i)).toHaveValue('codigo_estacion')
  })
})

describe('FichaCapaConfigRow — configuración nueva', () => {
  test('muestra el nombre de la capa y el selector de atributos', () => {
    render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)
    expect(screen.getByText('Estaciones')).toBeInTheDocument()
    expect(within(screen.getByLabelText(/Atributo identificador/i)).getByRole('option', { name: 'codigo_estacion' })).toBeInTheDocument()
  })

  test('el botón "Habilitar" está deshabilitado sin un identificador elegido', () => {
    render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)
    expect(screen.getByRole('button', { name: /Habilitar/i })).toBeDisabled()
  })

  test('elegir un identificador y guardar llama a la mutación con los datos correctos', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useUpsertConfigFichasCapa).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpsertConfigFichasCapa>)
    const user = userEvent.setup()
    render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)

    await user.selectOptions(screen.getByLabelText(/Atributo identificador/i), 'codigo_estacion')
    await user.click(screen.getByRole('button', { name: /Habilitar/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ conexionId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo_estacion', campoEtiqueta: undefined })
  })

  test('un 409 IDENTIFICADOR_BLOQUEADO muestra el mensaje específico de fichas ya cargadas', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(Object.assign(new Error('conflict'), { code: 'IDENTIFICADOR_BLOQUEADO' }))
    vi.mocked(useUpsertConfigFichasCapa).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpsertConfigFichasCapa>)
    const user = userEvent.setup()
    render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)

    await user.selectOptions(screen.getByLabelText(/Atributo identificador/i), 'codigo_estacion')
    await user.click(screen.getByRole('button', { name: /Habilitar/i }))

    expect(await screen.findByText(/Ya hay fichas cargadas con el identificador actual/i)).toBeInTheDocument()
  })
})

describe('FichaCapaConfigRow — configuración ya existente (compartida)', () => {
  test('precarga el identificador guardado y avisa que es compartida', () => {
    vi.mocked(useConfigFichasCapa).mockReturnValue({
      data: { id: 'cfg1', conexionGeoserverId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo_estacion', campoEtiqueta: null, creadoEn: '', actualizadoEn: '' },
      isLoading: false,
    } as unknown as ReturnType<typeof useConfigFichasCapa>)
    render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)

    expect(screen.getByLabelText(/Atributo identificador/i)).toHaveValue('codigo_estacion')
    expect(screen.getByText('Compartida entre geovisores')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Guardar cambios' })).toBeDisabled() // sin cambios todavía
  })

  test('muestra el progreso de completitud cuando hay datos de features', () => {
    vi.mocked(useConfigFichasCapa).mockReturnValue({
      data: { id: 'cfg1', conexionGeoserverId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo_estacion', campoEtiqueta: null, creadoEn: '', actualizadoEn: '' },
      isLoading: false,
    } as unknown as ReturnType<typeof useConfigFichasCapa>)
    vi.mocked(useFeaturesFichas).mockReturnValue({
      data: { resumen: { totalFeatures: 20, completas: 14, incompletas: 6, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 }, features: [], sinIdentificador: [], huerfanas: [] },
    } as unknown as ReturnType<typeof useFeaturesFichas>)
    render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)

    expect(screen.getByText('14/20 completas')).toBeInTheDocument()
  })

  test('el botón "Gestionar fichas" abre el modal de checklist; "cerrar" lo cierra', async () => {
    vi.mocked(useConfigFichasCapa).mockReturnValue({
      data: { id: 'cfg1', conexionGeoserverId: 'c1', capaId: 'ws:estaciones', campoIdentificador: 'codigo_estacion', campoEtiqueta: null, creadoEn: '', actualizadoEn: '' },
      isLoading: false,
    } as unknown as ReturnType<typeof useConfigFichasCapa>)
    const user = userEvent.setup()
    render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)

    expect(screen.queryByTestId('fichas-modal')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Gestionar fichas/i }))

    expect(screen.getByText('Modal de Estaciones')).toBeInTheDocument()
    await user.click(screen.getByText('cerrar-modal-test'))
    expect(screen.queryByTestId('fichas-modal')).not.toBeInTheDocument()
  })
})

describe('FichaCapaConfigRow — sin config todavía', () => {
  test('no ofrece "Gestionar fichas" antes de habilitar la capa (no hay configId para abrir el modal)', () => {
    render(<FichaCapaConfigRow conexionId="c1" capaId="ws:estaciones" capaNombre="Estaciones" />)
    expect(screen.queryByRole('button', { name: /Gestionar fichas/i })).not.toBeInTheDocument()
  })
})
