import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FichaPuntoEditor from '@/components/admin/geovisores/fichas/FichaPuntoEditor'
import type { FeatureFichaEstado } from '@/types'

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: { children: React.ReactNode }) => <div data-testid="mapa">{children}</div>,
  CircleMarker: ({ center }: { center: [number, number] }) => <div data-testid="marcador" data-center={center.join(',')} />,
}))
vi.mock('@/components/geovisor-viewer/BasemapCapas', () => ({
  default: ({ basemapId }: { basemapId: string }) => <div data-testid="basemap">{basemapId}</div>,
}))

vi.mock('@/components/admin/geovisores/fichas/MediosFichaGrid', () => ({
  default: ({ valor, medios }: { valor: string; medios: unknown[] }) => (
    <div data-testid="medios-grid" data-valor={valor} data-n-medios={medios.length} />
  ),
}))

vi.mock('@/hooks/useFichasPunto', () => ({
  useFicha: vi.fn(),
  useUpsertFicha: vi.fn(),
}))
import { useFicha, useUpsertFicha } from '@/hooks/useFichasPunto'

const featureFixture: FeatureFichaEstado = {
  valor: 'EST-014', etiqueta: 'Quibdó Centro', centroide: [-76.66, 5.69],
  nFeatures: 1, estado: 'incompleta', fichaId: 'f1', nImagenes: 0, nVideos: 0,
  tieneDescripcion: false, actualizadoEn: null,
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useFicha).mockReturnValue({ data: null, isLoading: false } as unknown as ReturnType<typeof useFicha>)
  vi.mocked(useUpsertFicha).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue({}), isPending: false } as unknown as ReturnType<typeof useUpsertFicha>)
})

describe('FichaPuntoEditor — carga y mapa de referencia', () => {
  test('muestra la etiqueta y el identificador de la feature', () => {
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)
    expect(screen.getByText('Quibdó Centro')).toBeInTheDocument()
    expect(screen.getByText('EST-014')).toBeInTheDocument()
  })

  test('el mapa centra el marcador en [lat, lng], invertido desde el centroide GeoJSON [lng, lat]', () => {
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)
    expect(screen.getByTestId('marcador')).toHaveAttribute('data-center', '5.69,-76.66')
  })

  test('precarga título y descripción cuando ya existe una ficha', () => {
    vi.mocked(useFicha).mockReturnValue({
      data: { id: 'f1', titulo: 'Estación río Atrato', descripcion: 'Monitorea el nivel del río desde 2020.', medios: [] },
      isLoading: false,
    } as unknown as ReturnType<typeof useFicha>)
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    expect(screen.getByLabelText(/Título/i)).toHaveValue('Estación río Atrato')
    expect(screen.getByLabelText(/Descripción/i)).toHaveValue('Monitorea el nivel del río desde 2020.')
  })

  test('pasa el valor de la feature y los medios de la ficha a MediosFichaGrid', () => {
    vi.mocked(useFicha).mockReturnValue({
      data: { id: 'f1', titulo: null, descripcion: '', medios: [{ id: 'm1' }, { id: 'm2' }] },
      isLoading: false,
    } as unknown as ReturnType<typeof useFicha>)
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    const grid = screen.getByTestId('medios-grid')
    expect(grid).toHaveAttribute('data-valor', 'EST-014')
    expect(grid).toHaveAttribute('data-n-medios', '2')
  })

  test('sin ficha todavía, MediosFichaGrid recibe una lista de medios vacía (no se rompe)', () => {
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)
    expect(screen.getByTestId('medios-grid')).toHaveAttribute('data-n-medios', '0')
  })
})

describe('FichaPuntoEditor — refresco de la ficha desde el servidor', () => {
  const fichaConMedios = (n: number, extra: Record<string, unknown> = {}) => ({
    data: { id: 'f1', titulo: 'Original', descripcion: 'Descripción original del punto.', medios: Array.from({ length: n }, (_, i) => ({ id: `m${i}` })), ...extra },
    isLoading: false,
  } as unknown as ReturnType<typeof useFicha>)

  test('subir un medio (la ficha se refresca) no pisa el texto que aún no se guardó', async () => {
    vi.mocked(useFicha).mockReturnValue(fichaConMedios(0))
    const user = userEvent.setup()
    const { rerender } = render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    await user.clear(screen.getByLabelText(/Descripción/i))
    await user.type(screen.getByLabelText(/Descripción/i), 'Texto nuevo sin guardar todavía')

    vi.mocked(useFicha).mockReturnValue(fichaConMedios(1))
    rerender(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    expect(screen.getByLabelText(/Descripción/i)).toHaveValue('Texto nuevo sin guardar todavía')
    expect(screen.getByTestId('medios-grid')).toHaveAttribute('data-n-medios', '1')
  })

  test('sin cambios locales, un cambio llegado del servidor sí se refleja', () => {
    vi.mocked(useFicha).mockReturnValue(fichaConMedios(0))
    const { rerender } = render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    vi.mocked(useFicha).mockReturnValue(fichaConMedios(0, { descripcion: 'Descripción editada por otra persona.' }))
    rerender(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    expect(screen.getByLabelText(/Descripción/i)).toHaveValue('Descripción editada por otra persona.')
  })
})

describe('FichaPuntoEditor — contador de descripción', () => {
  test('el contador refleja los caracteres escritos contra el mínimo de 20', async () => {
    const user = userEvent.setup()
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    await user.type(screen.getByLabelText(/Descripción/i), 'Muy corta')
    expect(screen.getByText('9/20')).toBeInTheDocument()
    expect(screen.getByText(/hace falta un mínimo de 20 caracteres/i)).toBeInTheDocument()
  })

  test('con 20 caracteres o más, desaparece el aviso de mínimo', async () => {
    const user = userEvent.setup()
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    await user.type(screen.getByLabelText(/Descripción/i), 'Esta descripción ya tiene más de veinte caracteres')
    expect(screen.queryByText(/hace falta un mínimo/i)).not.toBeInTheDocument()
  })
})

describe('FichaPuntoEditor — guardar', () => {
  test('"Guardar" llama a la mutación y a onGuardado, no a onGuardarYSiguiente', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useUpsertFicha).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpsertFicha>)
    const onGuardado = vi.fn()
    const onGuardarYSiguiente = vi.fn()
    const user = userEvent.setup()
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={onGuardado} onGuardarYSiguiente={onGuardarYSiguiente} />)

    await user.type(screen.getByLabelText(/Descripción/i), 'Una descripción cualquiera')
    await user.click(screen.getByRole('button', { name: /^Guardar$/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ valor: 'EST-014', titulo: undefined, descripcion: 'Una descripción cualquiera' })
    expect(onGuardado).toHaveBeenCalled()
    expect(onGuardarYSiguiente).not.toHaveBeenCalled()
  })

  test('"Guardar y siguiente pendiente" llama a onGuardarYSiguiente', async () => {
    const onGuardarYSiguiente = vi.fn()
    const user = userEvent.setup()
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={onGuardarYSiguiente} />)

    await user.click(screen.getByRole('button', { name: /Guardar y siguiente pendiente/i }))
    expect(onGuardarYSiguiente).toHaveBeenCalled()
  })

  test('un error del servidor se muestra sin perder lo escrito', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Fallo de red'))
    vi.mocked(useUpsertFicha).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpsertFicha>)
    const user = userEvent.setup()
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    await user.type(screen.getByLabelText(/Descripción/i), 'Una descripción cualquiera')
    await user.click(screen.getByRole('button', { name: /^Guardar$/i }))

    expect(await screen.findByText('Fallo de red')).toBeInTheDocument()
    expect(screen.getByLabelText(/Descripción/i)).toHaveValue('Una descripción cualquiera')
  })

  test('guardar sin descripción no está bloqueado -- guardar siempre está permitido, solo publicar se bloquea después', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    vi.mocked(useUpsertFicha).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpsertFicha>)
    const user = userEvent.setup()
    render(<FichaPuntoEditor configId="cfg1" feature={featureFixture} onGuardado={vi.fn()} onGuardarYSiguiente={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /^Guardar$/i }))
    expect(mutateAsync).toHaveBeenCalledWith({ valor: 'EST-014', titulo: undefined, descripcion: '' })
  })
})
