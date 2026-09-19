import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import GeovisorFormModal from '@/components/admin/geovisores/GeovisorFormModal'
import type { GeovisorRaw, WorkspaceOption } from '@/types'

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

vi.mock('@/hooks/useConexionesGeoserver', () => ({
  useConexionesGeoserverList: vi.fn(),
  useWorkspacesDeConexion: vi.fn(),
}))
import { useConexionesGeoserverList, useWorkspacesDeConexion } from '@/hooks/useConexionesGeoserver'

vi.mock('@/hooks/useGeovisores', () => ({
  useCreateGeovisor: vi.fn(),
  useUpdateGeovisor: vi.fn(),
}))
import { useCreateGeovisor, useUpdateGeovisor } from '@/hooks/useGeovisores'

vi.mock('@/hooks/useCategorias', () => ({
  useCategoriasList: () => ({ data: [] }),
  useCreateCategoria: () => ({ mutateAsync: vi.fn() }),
}))

// El mapa en vivo (react-leaflet real) se prueba aparte en GeovisorMapaConstructor.test.tsx --
// acá se reemplaza por botones de prueba que disparan los mismos callbacks que dispararía el
// mapa real (mover vista, agregar/eliminar preset), para probar el cableado del formulario sin
// montar Leaflet.
vi.mock('@/components/admin/geovisores/GeovisorMapaConstructor', () => ({
  default: ({ conexionId, workspacesSeleccionados, presetsArea, onMoverMapa, onAgregarPreset, onEliminarPreset }: {
    conexionId: string | null
    workspacesSeleccionados: WorkspaceOption[]
    presetsArea: { nombre: string }[]
    onMoverMapa: (lat: number, lng: number, zoom: number) => void
    onAgregarPreset: (preset: { nombre: string; geometria: { type: 'Polygon'; coordinates: number[][][] } }) => void
    onEliminarPreset: (nombre: string) => void
  }) => (
    <div data-testid="mapa-constructor">
      <span data-testid="mapa-conexion">{conexionId ?? 'sin-conexion'}</span>
      <span data-testid="mapa-workspaces">{workspacesSeleccionados.map((w) => w.id).join(',')}</span>
      <span data-testid="mapa-presets">{presetsArea.map((p) => p.nombre).join(',')}</span>
      <button type="button" onClick={() => onMoverMapa(6, -77, 10)}>mover-mapa-test</button>
      <button type="button" onClick={() => onAgregarPreset({ nombre: 'Zona norte', geometria: { type: 'Polygon', coordinates: [[[1, 2], [3, 4], [5, 6], [1, 2]]] } })}>agregar-preset-test</button>
      <button type="button" onClick={() => onEliminarPreset('Zona norte')}>eliminar-preset-test</button>
    </div>
  ),
}))

const conexionesFixture = [{ id: 'c1', nombre: 'GeoServer IIAP' }]
const workspacesFixture: WorkspaceOption[] = [
  { id: 't_15_geologia', nombre: 'Geologia', totalCapas: 3, capas: [{ id: 't_15_geologia:fallas', nombre: 'Fallas', tipo: 'vectorial' }] },
  { id: 't_20_hidrologia', nombre: 'Hidrologia', totalCapas: 5, capas: [{ id: 't_20_hidrologia:rios', nombre: 'Ríos', tipo: 'vectorial' }] },
]

function makeGeovisor(overrides: Partial<GeovisorRaw> = {}): GeovisorRaw {
  return {
    id: '1', slug: 'geologia-choco', titulo: 'Geología del Chocó', subtitulo: 'Unidades',
    descripcion: 'Descripción', cita: 'Cita sugerida', categoria: 'Geología', conexionGeoserverId: 'c1',
    workspacesGeoserver: ['t_15_geologia'], capasSeleccionadas: ['t_15_geologia:fallas'],
    colorPorTema: { t_15_geologia: '#123456' },
    centro: { lat: 5.55, lng: -76.6 }, zoomInicial: 9, basemapDefecto: 'satelite',
    areaMaxHa: 5000, presetsArea: [{ nombre: 'Zona norte', geometria: { type: 'Polygon', coordinates: [[[1, 2], [3, 4], [5, 6], [1, 2]]] } }],
    visibilidad: 'usuarios',
    presentacion: { mostrarMetricas: true, mostrarImagenes: true, campoImagenUrl: 'foto_url', camposPopup: [{ campo: 'MGUCR_SIMBL', alias: 'Símbolo' }] },
    thumbnailUrl: 'https://cdn.test/thumb.png', activo: true, orden: 0, creadoEn: '2026-01-01', ...overrides,
  }
}

/** Abre una sección del acordeón por su título (secciones 3 y 4 empiezan cerradas). */
async function abrirSeccion(user: ReturnType<typeof userEvent.setup>, titulo: RegExp) {
  await user.click(screen.getByRole('button', { name: titulo }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useConexionesGeoserverList).mockReturnValue({
    data: conexionesFixture,
  } as unknown as ReturnType<typeof useConexionesGeoserverList>)
  vi.mocked(useWorkspacesDeConexion).mockReturnValue({
    data: workspacesFixture, isFetching: false,
  } as unknown as ReturnType<typeof useWorkspacesDeConexion>)
  vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
  vi.mocked(useUpdateGeovisor).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateGeovisor>)
})

describe('GeovisorFormModal — modo edición: prefill', () => {
  test('precarga los campos del geovisor que se está editando', () => {
    render(<GeovisorFormModal open editing={makeGeovisor()} onClose={vi.fn()} onSaved={vi.fn()} />)

    expect(screen.getByLabelText(/^Título/i)).toHaveValue('Geología del Chocó')
    expect(screen.getByLabelText(/^Categoría/i)).toHaveValue('Geología')
    expect(screen.getByRole('checkbox', { name: /Fallas/i })).toBeChecked()
    expect(screen.getByTestId('mapa-presets')).toHaveTextContent('Zona norte')
    expect(screen.getByTestId('mapa-conexion')).toHaveTextContent('c1')
    expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument()
  })

  test('geovisor legado (sin capasSeleccionadas, solo workspacesGeoserver) precarga todas las capas de ese workspace', async () => {
    const legado = makeGeovisor({ capasSeleccionadas: [], workspacesGeoserver: ['t_15_geologia'] })
    render(<GeovisorFormModal open editing={legado} onClose={vi.fn()} onSaved={vi.fn()} />)

    expect(await screen.findByRole('checkbox', { name: /Fallas/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Ríos/i })).not.toBeChecked() // otro workspace, no incluido en el legado
  })

  test('el título del modal dice "Editar geovisor" y el botón de envío "Guardar cambios"', () => {
    render(<GeovisorFormModal open editing={makeGeovisor()} onClose={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByRole('heading', { name: 'Editar geovisor' })).toBeInTheDocument()
  })

  test('enviar en modo edición llama a updateGeovisor con el id y el payload', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeGeovisor())
    vi.mocked(useUpdateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateGeovisor>)
    const onSaved = vi.fn()

    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={makeGeovisor()} onClose={vi.fn()} onSaved={onSaved} />)
    await user.click(screen.getByRole('button', { name: /Guardar cambios/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      id: '1',
      data: expect.objectContaining({ titulo: 'Geología del Chocó' }),
    }))
    expect(onSaved).toHaveBeenCalledWith('Geovisor "Geología del Chocó" actualizado')
  })
})

describe('GeovisorFormModal — capas y color por tema', () => {
  test('sin conexión elegida, el mapa recibe conexionId nulo y se muestra el aviso de vista previa', () => {
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.getByTestId('mapa-conexion')).toHaveTextContent('sin-conexion')
    expect(screen.getByText(/Elige una conexión GeoServer para ver la vista previa en vivo/i)).toBeInTheDocument()
  })

  test('mientras se descubren las capas muestra el spinner', async () => {
    vi.mocked(useWorkspacesDeConexion).mockReturnValue({ data: [], isFetching: true } as unknown as ReturnType<typeof useWorkspacesDeConexion>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    expect(screen.getByText('Descubriendo capas…')).toBeInTheDocument()
  })

  test('conexión sin capas publicadas muestra el mensaje correspondiente', async () => {
    vi.mocked(useWorkspacesDeConexion).mockReturnValue({ data: [], isFetching: false } as unknown as ReturnType<typeof useWorkspacesDeConexion>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    expect(screen.getByText('Esta conexión no publica capas todavía.')).toBeInTheDocument()
  })

  test('marcar una capa agrega el selector de color de su tema y lo refleja en el mapa', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('checkbox', { name: /Fallas/i }))

    expect(document.querySelectorAll('input[type="color"]')).toHaveLength(1)
    expect(screen.getByTestId('mapa-workspaces')).toHaveTextContent('t_15_geologia')
  })

  test('marcar dos capas de dos temas distintos agrega un selector de color por cada tema', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('checkbox', { name: /Fallas/i }))
    await user.click(screen.getByRole('checkbox', { name: /Ríos/i }))

    expect(document.querySelectorAll('input[type="color"]')).toHaveLength(2)
    expect(screen.getByTestId('mapa-workspaces')).toHaveTextContent('t_15_geologia,t_20_hidrologia')
    expect(screen.getByText(/2 capas seleccionadas, de 2 temas distintos/i)).toBeInTheDocument()
  })

  test('desmarcar la única capa seleccionada de un tema quita su selector de color', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    const checkbox = screen.getByRole('checkbox', { name: /Fallas/i })
    await user.click(checkbox)
    await user.click(checkbox)

    expect(document.querySelectorAll('input[type="color"]')).toHaveLength(0)
    expect(screen.getByTestId('mapa-workspaces')).toHaveTextContent('')
  })

  test('el filtro de búsqueda esconde las capas que no coinciden', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.type(screen.getByPlaceholderText(/Buscar capa por nombre/i), 'río')

    expect(screen.queryByRole('checkbox', { name: /Fallas/i })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Ríos/i })).toBeInTheDocument()
  })

  test('ya no ofrece la generación de reportes con IA — sin funcionalidad real detrás', () => {
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.queryByText(/generación de reportes con IA/i)).not.toBeInTheDocument()
  })
})

describe('GeovisorFormModal — mapa y área (constructor visual)', () => {
  test('mover el mapa actualiza el centro/zoom mostrados', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await abrirSeccion(user, /Mapa y área/i)

    await user.click(screen.getByRole('button', { name: 'mover-mapa-test' }))

    expect(screen.getByText('6')).toBeInTheDocument()
    expect(screen.getByText('-77')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  test('agregar un preset desde el mapa lo refleja en el resumen del panel izquierdo', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await abrirSeccion(user, /Mapa y área/i)

    await user.click(screen.getByRole('button', { name: 'agregar-preset-test' }))

    expect(screen.getByText(/1 preset de área: Zona norte/i)).toBeInTheDocument()
  })

  test('un preset agregado se incluye en el payload al enviar', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeGeovisor())
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('button', { name: 'agregar-preset-test' }))
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      presetsArea: [{ nombre: 'Zona norte', geometria: { type: 'Polygon', coordinates: [[[1, 2], [3, 4], [5, 6], [1, 2]]] } }],
    }))
  })

  test('eliminar un preset ya agregado lo quita del resumen y del mapa', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await abrirSeccion(user, /Mapa y área/i)
    await user.click(screen.getByRole('button', { name: 'agregar-preset-test' }))
    await user.click(screen.getByRole('button', { name: 'eliminar-preset-test' }))

    expect(screen.getByTestId('mapa-presets')).toHaveTextContent('')
    expect(screen.queryByText(/^\d+ preset/i)).not.toBeInTheDocument()
  })

  test('un área máxima inválida bloquea el envío', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await abrirSeccion(user, /Mapa y área/i)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    // "0" pasa la restricción HTML5 min=0 del input (que bloquearía el submit nativo
    // antes de correr la validación JS con un valor negativo) pero sigue siendo
    // inválido para la regla de negocio "> 0" -- ejercita el validate() real.
    fireEvent.change(screen.getByLabelText(/Área máxima/i), { target: { value: '0' } })
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(await screen.findByText('Debe ser un número positivo')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

describe('GeovisorFormModal — atributos del popup (camposPopup)', () => {
  test('un atributo sin alias bloquea el envío con el mensaje correspondiente', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await abrirSeccion(user, /Visibilidad y presentación/i)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('button', { name: /^Agregar$/i }))
    await user.type(screen.getByPlaceholderText('Atributo'), 'MGUCR_SIMBL')
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(await screen.findByText('Completa el campo y su alias (o elimina la fila)')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('quitar un atributo lo elimina del formulario', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await abrirSeccion(user, /Visibilidad y presentación/i)
    await user.click(screen.getByRole('button', { name: /^Agregar$/i }))
    expect(screen.getByPlaceholderText('Atributo')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Eliminar atributo 1/i }))
    expect(screen.queryByPlaceholderText('Atributo')).not.toBeInTheDocument()
  })
})

describe('GeovisorFormModal — visibilidad', () => {
  test('elegir "Acreditados" cambia la visibilidad enviada', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeGeovisor())
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await abrirSeccion(user, /Visibilidad y presentación/i)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('button', { name: /Acreditados/i }))
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ visibilidad: 'acreditados' }))
  })

  test('mostrar imágenes en el popup exige el atributo de la URL', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await abrirSeccion(user, /Visibilidad y presentación/i)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('switch', { name: 'Mostrar imágenes en el popup' }))
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(await screen.findByText('Indica qué atributo trae la URL de la imagen')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

describe('GeovisorFormModal — cierre', () => {
  test('el botón Cancelar llama a onClose', async () => {
    const onClose = vi.fn()
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={onClose} onSaved={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: /Cancelar/i }))
    expect(onClose).toHaveBeenCalled()
  })

  test('open=false no renderiza el formulario', () => {
    render(<GeovisorFormModal open={false} editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.queryByRole('heading', { name: 'Nuevo geovisor' })).not.toBeInTheDocument()
  })

  test('un error del servidor al crear se muestra sin cerrar el formulario', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Ya existe un geovisor con ese título'))
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(await screen.findByText('Ya existe un geovisor con ese título')).toBeInTheDocument()
    expect(screen.getByLabelText(/^Título/i)).toBeInTheDocument()
  })
})

describe('GeovisorFormModal — todos los campos opcionales se envían', () => {
  test('completar información general, mapa, color y presentación llega intacto al payload', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeGeovisor())
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.type(screen.getByLabelText(/^Subtítulo/i), 'Unidades litoestratigráficas')
    await user.type(screen.getByLabelText(/^Categoría/i), 'Geología')
    await user.type(screen.getByLabelText(/^Descripción/i), 'Descripción completa')
    await user.type(screen.getByLabelText(/^Cita sugerida/i), 'IIAP (2026)')
    await user.type(screen.getByLabelText(/^URL de portada/i), 'https://cdn.test/thumb.png')

    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('checkbox', { name: /Fallas/i }))
    fireEvent.change(document.querySelector('input[type="color"]')!, { target: { value: '#ff0000' } })

    await abrirSeccion(user, /Mapa y área/i)
    await user.click(screen.getByRole('button', { name: 'mover-mapa-test' }))
    await user.selectOptions(screen.getByLabelText(/Mapa base por defecto/i), 'satelite')
    await user.type(screen.getByLabelText(/Área máxima/i), '1000')

    await abrirSeccion(user, /Visibilidad y presentación/i)
    await user.click(screen.getByRole('switch', { name: 'Mostrar métricas' }))
    await user.click(screen.getByRole('switch', { name: 'Mostrar imágenes en el popup' }))
    await user.type(screen.getByLabelText(/Atributo con la URL de la imagen/i), 'foto_url')
    await user.click(screen.getByRole('button', { name: /^Agregar$/i }))
    await user.type(screen.getByPlaceholderText('Atributo'), 'MGUCR_SIMBL')
    await user.type(screen.getByPlaceholderText('Nombre legible'), 'Símbolo')

    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Geología del Chocó', subtitulo: 'Unidades litoestratigráficas', categoria: 'Geología',
      descripcion: 'Descripción completa', cita: 'IIAP (2026)', thumbnailUrl: 'https://cdn.test/thumb.png',
      centroLat: 6, centroLng: -77, zoomInicial: 10, basemapDefecto: 'satelite', areaMaxHa: 1000,
      colorPorTema: { t_15_geologia: '#ff0000' },
      presentacion: expect.objectContaining({
        mostrarMetricas: false, mostrarImagenes: true, campoImagenUrl: 'foto_url',
        camposPopup: [{ campo: 'MGUCR_SIMBL', alias: 'Símbolo' }],
      }),
    }))
  })
})

