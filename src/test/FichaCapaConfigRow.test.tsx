import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FichaCapaConfigRow from '@/components/admin/geovisores/fichas/FichaCapaConfigRow'

vi.mock('@/hooks/useFichasPunto', () => ({
  useAtributosCapa: vi.fn(),
  useConfigFichasCapa: vi.fn(),
  useUpsertConfigFichasCapa: vi.fn(),
  useFeaturesFichas: vi.fn(),
}))
import {
  useAtributosCapa, useConfigFichasCapa, useUpsertConfigFichasCapa, useFeaturesFichas,
} from '@/hooks/useFichasPunto'

const atributosFixture = [{ nombre: 'codigo_estacion', tipo: 'string' }, { nombre: 'nombre_estacion', tipo: 'string' }]

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useAtributosCapa).mockReturnValue({ data: atributosFixture, isLoading: false } as unknown as ReturnType<typeof useAtributosCapa>)
  vi.mocked(useConfigFichasCapa).mockReturnValue({ data: null, isLoading: false } as unknown as ReturnType<typeof useConfigFichasCapa>)
  vi.mocked(useUpsertConfigFichasCapa).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false } as unknown as ReturnType<typeof useUpsertConfigFichasCapa>)
  vi.mocked(useFeaturesFichas).mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useFeaturesFichas>)
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
})
