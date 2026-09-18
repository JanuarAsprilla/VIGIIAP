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

const conexionesFixture = [{ id: 'c1', nombre: 'GeoServer IIAP' }]
const workspacesFixture: WorkspaceOption[] = [
  {
    id: 't_15_geologia', nombre: 'Geologia', totalCapas: 2,
    capas: [
      { id: 't_15_geologia:unidades', nombre: 'Unidades litológicas', tipo: 'vectorial' },
      { id: 't_15_geologia:fallas', nombre: 'Fallas geológicas', tipo: 'vectorial' },
    ],
  },
  {
    id: 't_20_hidrologia', nombre: 'Hidrologia', totalCapas: 1,
    capas: [
      { id: 't_20_hidrologia:cuencas', nombre: 'Cuencas hidrográficas', tipo: 'raster' },
    ],
  },
]

function makeGeovisor(overrides: Partial<GeovisorRaw> = {}): GeovisorRaw {
  return {
    id: '1', slug: 'geologia-choco', titulo: 'Geología del Chocó', subtitulo: 'Unidades',
    descripcion: 'Descripción', cita: 'Cita sugerida', categoria: 'Geología', conexionGeoserverId: 'c1',
    workspacesGeoserver: ['t_15_geologia'], capasSeleccionadas: ['t_15_geologia:unidades'],
    colorPorTema: { t_15_geologia: '#123456' },
    centro: { lat: 5.55, lng: -76.6 }, zoomInicial: 9, basemapDefecto: 'satelite',
    areaMaxHa: 5000, presetsArea: [{ nombre: 'Zona norte', geometria: { type: 'Polygon', coordinates: [[[1, 2], [3, 4], [5, 6], [1, 2]]] } }],
    visibilidad: 'usuarios',
    presentacion: { mostrarMetricas: true, mostrarImagenes: true, campoImagenUrl: 'foto_url', camposPopup: [{ campo: 'MGUCR_SIMBL', alias: 'Símbolo' }] },
    thumbnailUrl: 'https://cdn.test/thumb.png', activo: true, orden: 0, creadoEn: '2026-01-01', ...overrides,
  }
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
  test('precarga todos los campos del geovisor que se está editando', () => {
    render(<GeovisorFormModal open editing={makeGeovisor()} onClose={vi.fn()} onSaved={vi.fn()} />)

    expect(screen.getByLabelText(/^Título/i)).toHaveValue('Geología del Chocó')
    expect(screen.getByLabelText(/^Categoría/i)).toHaveValue('Geología')
    expect(screen.getByLabelText(/Latitud centro/i)).toHaveValue(5.55)
    expect(screen.getByLabelText(/Longitud centro/i)).toHaveValue(-76.6)
    expect(screen.getByLabelText(/Zoom inicial/i)).toHaveValue(9)
    expect(screen.getByLabelText(/Mapa base por defecto/i)).toHaveValue('satelite')
    expect(screen.getByRole('checkbox', { name: /Unidades litológicas/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Fallas geológicas/i })).not.toBeChecked()
    expect(screen.getByDisplayValue('Zona norte')).toBeInTheDocument()
    expect(screen.getByDisplayValue('MGUCR_SIMBL')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Símbolo')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Guardar cambios/i })).toBeInTheDocument()
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

  test('geovisor legado (sin capasSeleccionadas, solo workspacesGeoserver) precarga todas las capas de ese workspace', async () => {
    const legado = makeGeovisor({ capasSeleccionadas: [], workspacesGeoserver: ['t_15_geologia'] })
    render(<GeovisorFormModal open editing={legado} onClose={vi.fn()} onSaved={vi.fn()} />)

    expect(await screen.findByRole('checkbox', { name: /Unidades litológicas/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Fallas geológicas/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Cuencas hidrográficas/i })).not.toBeChecked()
  })
})

describe('GeovisorFormModal — capas y color por tema', () => {
  test('sin conexión elegida muestra el aviso de vista previa en vez de la sección de capas', () => {
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
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

  test('sin capas seleccionadas, la sección de color muestra la nota en vez de selectores', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')

    expect(screen.getByText(/Selecciona una o más capas en la sección 2/i)).toBeInTheDocument()
  })

  test('marcar dos capas de dos temas distintos agrega un selector de color por cada tema', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('checkbox', { name: /Unidades litológicas/i }))
    await user.click(screen.getByRole('checkbox', { name: /Cuencas hidrográficas/i }))

    expect(screen.queryByText(/Selecciona una o más capas/i)).not.toBeInTheDocument()
    expect(document.querySelectorAll('input[type="color"]')).toHaveLength(2)
    expect(screen.getByText(/2 capas seleccionadas, de 2 temas distintos/i)).toBeInTheDocument()
  })

  test('desmarcar todas las capas de un tema quita su selector de color', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    const checkbox = screen.getByRole('checkbox', { name: /Unidades litológicas/i })
    await user.click(checkbox)
    await user.click(checkbox)

    expect(document.querySelectorAll('input[type="color"]')).toHaveLength(0)
  })

  test('el filtro de búsqueda esconde las capas que no coinciden', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.type(screen.getByPlaceholderText(/Buscar capa por nombre/i), 'cuencas')

    expect(screen.queryByRole('checkbox', { name: /Unidades litológicas/i })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /Cuencas hidrográficas/i })).toBeInTheDocument()
  })
})

describe('GeovisorFormModal — presets de área', () => {
  test('agregar un preset con JSON inválido bloquea el envío y muestra el error', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('button', { name: /Agregar preset/i }))
    await user.type(screen.getByPlaceholderText('Nombre del preset'), 'Zona norte')
    await user.type(screen.getByPlaceholderText('{"type":"Polygon","coordinates":[[[...]]]}'), 'esto no es JSON')
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(await screen.findByText('JSON de geometría inválido')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('un preset válido se incluye en el payload como geometría parseada', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeGeovisor())
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('button', { name: /Agregar preset/i }))
    await user.type(screen.getByPlaceholderText('Nombre del preset'), 'Zona norte')
    fireEvent.change(
      screen.getByPlaceholderText('{"type":"Polygon","coordinates":[[[...]]]}'),
      { target: { value: '{"type":"Polygon","coordinates":[[[1,2],[3,4],[5,6],[1,2]]]}' } },
    )
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      presetsArea: [{ nombre: 'Zona norte', geometria: { type: 'Polygon', coordinates: [[[1, 2], [3, 4], [5, 6], [1, 2]]] } }],
    }))
  })

  test('quitar un preset lo elimina del formulario', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Agregar preset/i }))
    expect(screen.getByPlaceholderText('Nombre del preset')).toBeInTheDocument()

    await user.click(screen.getByTitle('Eliminar preset'))
    expect(screen.queryByPlaceholderText('Nombre del preset')).not.toBeInTheDocument()
  })
})

describe('GeovisorFormModal — atributos del popup (camposPopup)', () => {
  test('un atributo sin alias bloquea el envío con el mensaje correspondiente', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('button', { name: /Agregar atributo/i }))
    await user.type(screen.getByPlaceholderText('Atributo (ej: MGUCR_SIMBL)'), 'MGUCR_SIMBL')
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(await screen.findByText('Completa el campo y su alias (o elimina la fila)')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('quitar un atributo lo elimina del formulario', async () => {
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: /Agregar atributo/i }))
    expect(screen.getByPlaceholderText('Atributo (ej: MGUCR_SIMBL)')).toBeInTheDocument()

    await user.click(screen.getByTitle('Eliminar'))
    expect(screen.queryByPlaceholderText('Atributo (ej: MGUCR_SIMBL)')).not.toBeInTheDocument()
  })
})

describe('GeovisorFormModal — visibilidad', () => {
  test('elegir "Acreditados" cambia la visibilidad enviada', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeGeovisor())
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
    const user = userEvent.setup()
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)

    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'c1')
    await user.click(screen.getByRole('button', { name: /Acreditados/i }))
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ visibilidad: 'acreditados' }))
  })

  test('ya no ofrece la generación de reportes con IA — sin funcionalidad real detrás', () => {
    render(<GeovisorFormModal open editing={null} onClose={vi.fn()} onSaved={vi.fn()} />)
    expect(screen.queryByText(/generación de reportes con IA/i)).not.toBeInTheDocument()
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

  test('closed=false no renderiza el formulario', () => {
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
    await user.click(screen.getByRole('checkbox', { name: /Unidades litológicas/i }))
    fireEvent.change(document.querySelector('input[type="color"]')!, { target: { value: '#ff0000' } })

    fireEvent.change(screen.getByLabelText(/Latitud centro/i), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText(/Longitud centro/i), { target: { value: '-77' } })
    fireEvent.change(screen.getByLabelText(/Zoom inicial/i), { target: { value: '10' } })
    await user.selectOptions(screen.getByLabelText(/Mapa base por defecto/i), 'satelite')
    fireEvent.change(screen.getByLabelText(/Área máxima/i), { target: { value: '1000' } })

    await user.click(screen.getByLabelText(/Mostrar métricas/i))
    await user.click(screen.getByLabelText(/Mostrar imágenes/i))
    await user.type(screen.getByLabelText(/Atributo con la URL de la imagen/i), 'foto_url')
    await user.click(screen.getByRole('button', { name: /Agregar atributo/i }))
    await user.type(screen.getByPlaceholderText('Atributo (ej: MGUCR_SIMBL)'), 'MGUCR_SIMBL')
    await user.type(screen.getByPlaceholderText('Nombre legible (ej: Símbolo cronoestratigráfico)'), 'Símbolo')

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
