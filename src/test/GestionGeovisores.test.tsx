import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import GestionGeovisores from '@/pages/admin/GestionGeovisores'

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

vi.mock('@/hooks/useGeovisores', () => ({
  useGeovisoresList: vi.fn(),
  useCreateGeovisor: vi.fn(),
  useUpdateGeovisor: vi.fn(),
  useUploadGeovisorThumbnail: vi.fn(),
  useToggleGeovisorActivo: vi.fn(),
  useDeleteGeovisor: vi.fn(),
  useCompletitudGeovisor: vi.fn(),
}))
import {
  useGeovisoresList, useCreateGeovisor, useUpdateGeovisor, useUploadGeovisorThumbnail, useToggleGeovisorActivo, useDeleteGeovisor,
  useCompletitudGeovisor,
} from '@/hooks/useGeovisores'

vi.mock('@/hooks/useCategorias', () => ({
  useCategoriasList: () => ({ data: [] }),
  useCreateCategoria: () => ({ mutateAsync: vi.fn() }),
}))

vi.mock('@/hooks/useConexionesGeoserver', () => ({
  useConexionesGeoserverList: vi.fn(),
  useWorkspacesDeConexion: vi.fn(),
}))
import { useConexionesGeoserverList, useWorkspacesDeConexion } from '@/hooks/useConexionesGeoserver'

// El formulario consulta qué capas con fichas siguen sin configurar; el detalle se prueba
// en useFichasPunto.test.tsx y GeovisorFormModal.test.tsx, acá basta con que no haya ninguna.
vi.mock('@/hooks/useFichasPunto', () => ({
  useCapasSinConfigFichas: () => [] as string[],
}))

function makeGeovisor(overrides: Record<string, unknown> = {}) {
  return {
    id: 'geovisor-1', slug: 'geologia-choco', titulo: 'Geología del Chocó',
    subtitulo: null, descripcion: null, cita: null, categoria: 'Geología',
    conexionGeoserverId: 'conexion-1', workspacesGeoserver: ['t_15_geologia'],
    capasSeleccionadas: ['t_15_geologia:fallas'],
    capasConFicha: [],
    colorPorTema: {}, centro: { lat: 5.55, lng: -76.6 }, zoomInicial: 8,
    basemapDefecto: 'calles', areaMaxHa: null, presetsArea: [],
    visibilidad: 'publico',
    presentacion: { mostrarMetricas: true, mostrarImagenes: false, camposPopup: [] },
    thumbnailUrl: null, activo: true, orden: 0, creadoEn: '2026-01-01', ...overrides,
  }
}

function makeConexion(overrides: Record<string, unknown> = {}) {
  return { id: 'conexion-1', nombre: 'GeoServer institucional', url: 'https://geoserver.test/geoserver', usuario_lectura: 'lector', timeout_ms: 20000, activo: true, creado_en: '', actualizado_en: '', ...overrides }
}

/** Avanza con «Siguiente» hasta el último paso y pulsa «Crear geovisor». */
async function crearGeovisor(user: ReturnType<typeof userEvent.setup>) {
  for (let i = 0; i < 5 && !screen.queryByRole('button', { name: /Crear geovisor/i }); i++) {
    await user.click(screen.getByRole('button', { name: /Siguiente/i }))
  }
  await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useGeovisoresList).mockReturnValue({
    data: { data: [makeGeovisor()], meta: { total: 1 } }, isLoading: false,
  } as unknown as ReturnType<typeof useGeovisoresList>)
  vi.mocked(useConexionesGeoserverList).mockReturnValue({
    data: [makeConexion()],
  } as unknown as ReturnType<typeof useConexionesGeoserverList>)
  vi.mocked(useWorkspacesDeConexion).mockReturnValue({
    data: [{ id: 't_15_geologia', nombre: 'Geologia', totalCapas: 3, capas: [{ id: 't_15_geologia:fallas', nombre: 'Fallas', tipo: 'vectorial' }] }], isFetching: false,
  } as unknown as ReturnType<typeof useWorkspacesDeConexion>)
  vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(makeGeovisor()), isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
  vi.mocked(useUpdateGeovisor).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(makeGeovisor()), isPending: false } as unknown as ReturnType<typeof useUpdateGeovisor>)
  vi.mocked(useUploadGeovisorThumbnail).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUploadGeovisorThumbnail>)
  vi.mocked(useToggleGeovisorActivo).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useToggleGeovisorActivo>)
  vi.mocked(useDeleteGeovisor).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteGeovisor>)
  vi.mocked(useCompletitudGeovisor).mockReturnValue({ data: undefined } as unknown as ReturnType<typeof useCompletitudGeovisor>)
})

describe('GestionGeovisores — listado', () => {
  test('muestra el título del geovisor y el nombre de su conexión', () => {
    render(<GestionGeovisores />)
    // La tarjeta muestra el título tanto en la etiqueta siempre visible como
    // en el panel de detalle (oculto hasta expandir) -- ambas coinciden con el texto.
    expect(screen.getAllByText('Geología del Chocó').length).toBeGreaterThan(0)
    expect(screen.getByText('GeoServer institucional')).toBeInTheDocument()
  })

  test('sin conexiones registradas, el botón de crear está deshabilitado y muestra una advertencia', () => {
    vi.mocked(useConexionesGeoserverList).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useConexionesGeoserverList>)
    render(<GestionGeovisores />)
    expect(screen.getByRole('button', { name: /Nuevo geovisor/i })).toBeDisabled()
    expect(screen.getByText(/Todavía no hay ninguna conexión GeoServer registrada/i)).toBeInTheDocument()
  })
})

describe('GestionGeovisores — estado de error', () => {
  // Antes, un fallo de la petición (429, sesión a medio expirar, etc.) hacía
  // que la lista se viera igual que "no hay geovisores" -- sin ninguna
  // señal visible del error. Regresión para que quede distinguible.
  test('un error de carga muestra un aviso explícito y un botón de reintentar, no una lista vacía silenciosa', async () => {
    const refetch = vi.fn()
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: undefined, isLoading: false, isError: true, refetch, isRefetching: false,
    } as unknown as ReturnType<typeof useGeovisoresList>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)

    expect(screen.getByText('No se pudieron cargar los geovisores')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(refetch).toHaveBeenCalled()
  })
})

describe('GestionGeovisores — activar/desactivar', () => {
  test('el botón de encendido llama al toggle con el estado invertido', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useToggleGeovisorActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleGeovisorActivo>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Desactivar'))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'geovisor-1', activo: false })
  })

  test('desactivar nunca abre el diálogo de bloqueo, ni siquiera si el backend devolviera GEOVISOR_INCOMPLETO', async () => {
    // El geovisor de este describe ya está activo (activo: true en el fixture
    // base), así que el botón intenta desactivar -- un 409 acá no debería
    // interpretarse jamás como bloqueo de publicación.
    const mutateAsync = vi.fn().mockRejectedValue(Object.assign(new Error('conflicto'), { code: 'GEOVISOR_INCOMPLETO', fields: { publicable: false, capas: [] } }))
    vi.mocked(useToggleGeovisorActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleGeovisorActivo>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Desactivar'))

    expect(await screen.findByText('conflicto')).toBeInTheDocument()
    expect(screen.queryByText('No se puede publicar todavía')).not.toBeInTheDocument()
  })

  test('activar con un 409 GEOVISOR_INCOMPLETO abre el diálogo de bloqueo con las capas pendientes', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(Object.assign(new Error('conflicto'), {
      code: 'GEOVISOR_INCOMPLETO',
      fields: {
        publicable: false,
        capas: [
          { capaId: 't_15_geologia:estaciones', nombre: 'Estaciones climáticas', resumen: { totalFeatures: 200, completas: 149, incompletas: 51, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 }, bloqueantes: 51 },
          { capaId: 't_15_geologia:completa', nombre: 'Capa ya completa', resumen: { totalFeatures: 10, completas: 10, incompletas: 0, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 }, bloqueantes: 0 },
        ],
      },
    }))
    vi.mocked(useToggleGeovisorActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleGeovisorActivo>)
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: { data: [makeGeovisor({ activo: false, capasConFicha: ['t_15_geologia:estaciones'] })], meta: { total: 1 } }, isLoading: false,
    } as unknown as ReturnType<typeof useGeovisoresList>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Activar'))

    expect(await screen.findByText('No se puede publicar todavía')).toBeInTheDocument()
    expect(screen.getByText('Estaciones climáticas')).toBeInTheDocument()
    expect(screen.getByText('51 pendientes')).toBeInTheDocument()
    // Solo la capa con bloqueantes > 0 se lista -- la ya completa no aporta nada a este diálogo.
    expect(screen.queryByText('Capa ya completa')).not.toBeInTheDocument()
  })

  test('si el backend solo devuelve el id como nombre, el diálogo muestra un nombre legible', async () => {
    const idCrudo = 't_19_clima:Estaciones_clima_IDEAM_2017'
    const mutateAsync = vi.fn().mockRejectedValue(Object.assign(new Error('conflicto'), {
      code: 'GEOVISOR_INCOMPLETO',
      fields: { publicable: false, capas: [{ capaId: idCrudo, nombre: idCrudo, resumen: { totalFeatures: 5, completas: 1, incompletas: 4, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 }, bloqueantes: 4 }] },
    }))
    vi.mocked(useToggleGeovisorActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleGeovisorActivo>)
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: { data: [makeGeovisor({ activo: false, capasConFicha: [idCrudo] })], meta: { total: 1 } }, isLoading: false,
    } as unknown as ReturnType<typeof useGeovisoresList>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Activar'))

    expect(await screen.findByText('Estaciones clima IDEAM 2017')).toBeInTheDocument()
    expect(screen.queryByText(idCrudo)).not.toBeInTheDocument()
  })

  test('"Editar geovisor" desde el diálogo de bloqueo abre el formulario de ese geovisor', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(Object.assign(new Error('conflicto'), {
      code: 'GEOVISOR_INCOMPLETO',
      fields: { publicable: false, capas: [{ capaId: 't_15_geologia:estaciones', nombre: 'Estaciones climáticas', resumen: { totalFeatures: 1, completas: 0, incompletas: 1, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 }, bloqueantes: 1 }] },
    }))
    vi.mocked(useToggleGeovisorActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleGeovisorActivo>)
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: { data: [makeGeovisor({ activo: false, capasConFicha: ['t_15_geologia:estaciones'] })], meta: { total: 1 } }, isLoading: false,
    } as unknown as ReturnType<typeof useGeovisoresList>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Activar'))
    await screen.findByText('No se puede publicar todavía')
    await user.click(screen.getByRole('button', { name: 'Editar geovisor' }))

    expect(screen.getByRole('heading', { name: 'Editar geovisor' })).toBeInTheDocument()
    expect(screen.queryByText('No se puede publicar todavía')).not.toBeInTheDocument()
  })

  test('cerrar el diálogo de bloqueo sin editar simplemente lo descarta', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(Object.assign(new Error('conflicto'), {
      code: 'GEOVISOR_INCOMPLETO',
      fields: { publicable: false, capas: [{ capaId: 'c1', nombre: 'Capa X', resumen: { totalFeatures: 1, completas: 0, incompletas: 1, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 }, bloqueantes: 1 }] },
    }))
    vi.mocked(useToggleGeovisorActivo).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useToggleGeovisorActivo>)
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: { data: [makeGeovisor({ activo: false, capasConFicha: ['c1'] })], meta: { total: 1 } }, isLoading: false,
    } as unknown as ReturnType<typeof useGeovisoresList>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Activar'))
    await screen.findByText('No se puede publicar todavía')
    await user.click(screen.getByRole('button', { name: 'Cerrar' }))

    expect(screen.queryByText('No se puede publicar todavía')).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Editar geovisor' })).not.toBeInTheDocument()
  })
})

describe('GestionGeovisores — badge de fichas faltantes', () => {
  test('sin capasConFicha, no consulta completitud ni muestra badge', () => {
    render(<GestionGeovisores />) // fixture base: capasConFicha: []
    expect(useCompletitudGeovisor).not.toHaveBeenCalled()
    expect(screen.queryByText(/fichas? faltantes?/i)).not.toBeInTheDocument()
  })

  test('con capasConFicha y fichas pendientes, muestra el badge con el total', () => {
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: { data: [makeGeovisor({ capasConFicha: ['t_15_geologia:estaciones'] })], meta: { total: 1 } }, isLoading: false,
    } as unknown as ReturnType<typeof useGeovisoresList>)
    vi.mocked(useCompletitudGeovisor).mockReturnValue({
      data: { publicable: false, capas: [{ capaId: 't_15_geologia:estaciones', nombre: 'Estaciones', resumen: { totalFeatures: 10, completas: 7, incompletas: 3, sinIdentificador: 0, identificadoresDuplicados: 0, huerfanas: 0 }, bloqueantes: 3 }] },
    } as unknown as ReturnType<typeof useCompletitudGeovisor>)

    render(<GestionGeovisores />)
    expect(screen.getByText('3 fichas faltantes')).toBeInTheDocument()
  })

  test('con capasConFicha pero ya publicable, no muestra badge', () => {
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: { data: [makeGeovisor({ capasConFicha: ['t_15_geologia:estaciones'] })], meta: { total: 1 } }, isLoading: false,
    } as unknown as ReturnType<typeof useGeovisoresList>)
    vi.mocked(useCompletitudGeovisor).mockReturnValue({
      data: { publicable: true, capas: [] },
    } as unknown as ReturnType<typeof useCompletitudGeovisor>)

    render(<GestionGeovisores />)
    expect(screen.queryByText(/fichas? faltantes?/i)).not.toBeInTheDocument()
  })
})

// Editar/Eliminar viven dentro del panel de detalle de la tarjeta, revelado
// solo al hacer clic en ella (mismo patrón que MapaCard en GestionMapas).
function expandirTarjeta(user: ReturnType<typeof userEvent.setup>, titulo: string) {
  return user.click(screen.getByRole('button', { name: new RegExp(`^${titulo}\\. Clic para ver detalle`) }))
}

describe('GestionGeovisores — eliminar', () => {
  test('confirmar elimina el geovisor seleccionado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteGeovisor>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await expandirTarjeta(user, 'Geología del Chocó')
    await user.click(screen.getByRole('button', { name: /Eliminar/i }))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(mutateAsync).toHaveBeenCalledWith('geovisor-1')
  })

  test('cancelar en el modal de confirmación no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useDeleteGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteGeovisor>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await expandirTarjeta(user, 'Geología del Chocó')
    await user.click(screen.getByRole('button', { name: /Eliminar/i }))
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Sí, eliminar/i })).not.toBeInTheDocument()
  })
})

describe('GestionGeovisores — editar', () => {
  test('el botón Editar abre el formulario precargado con los datos del geovisor', async () => {
    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await expandirTarjeta(user, 'Geología del Chocó')
    await user.click(screen.getByRole('button', { name: /Editar/i }))

    expect(screen.getByRole('heading', { name: 'Editar geovisor' })).toBeInTheDocument()
    expect(screen.getByLabelText(/^Título/i)).toHaveValue('Geología del Chocó')
  })
})

describe('GestionGeovisores — formulario de creación', () => {
  test('un título muy corto muestra error y no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByRole('button', { name: /Nuevo geovisor/i }))
    await user.type(screen.getByLabelText(/^Título/i), 'Ab')
    await crearGeovisor(user)

    expect(await screen.findByText('Mínimo 3 caracteres')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('elegir mostrar imágenes sin indicar el atributo bloquea el envío', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByRole('button', { name: /Nuevo geovisor/i }))
    await user.type(screen.getByLabelText(/^Título/i), 'Geología del Chocó')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'conexion-1')
    await user.click(within(screen.getByRole('navigation', { name: /Pasos/i })).getByRole('button', { name: /Publicar$/ }))
    await user.click(screen.getByRole('switch', { name: 'Mostrar imágenes en el popup' }))
    await crearGeovisor(user)

    expect(await screen.findByText('Indica qué atributo trae la URL de la imagen')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('un formulario completo y válido crea el geovisor con la presentación configurada', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(makeGeovisor())
    vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByRole('button', { name: /Nuevo geovisor/i }))
    await user.type(screen.getByLabelText(/^Título/i), 'Hidrología Amazónica')
    await user.selectOptions(screen.getByLabelText(/^Conexión/i), 'conexion-1')
    await crearGeovisor(user)

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({
      titulo: 'Hidrología Amazónica',
      conexionGeoserverId: 'conexion-1',
      visibilidad: 'publico',
      presentacion: expect.objectContaining({ mostrarMetricas: true, mostrarImagenes: false, camposPopup: [] }),
    }))
    expect(await screen.findByText('Geovisor "Hidrología Amazónica" creado')).toBeInTheDocument()
  })
})

describe('GestionGeovisores — buscador y filtro por categoría', () => {
  function mockDosGeovisores() {
    vi.mocked(useGeovisoresList).mockReturnValue({
      data: {
        data: [
          makeGeovisor({ id: 'g1', titulo: 'Geología del Chocó', categoria: 'Geología' }),
          makeGeovisor({ id: 'g2', titulo: 'Hidrología Amazónica', categoria: 'Hidrología' }),
        ],
        meta: { total: 2 },
      },
      isLoading: false,
    } as unknown as ReturnType<typeof useGeovisoresList>)
  }

  test('con una sola categoría entre los geovisores, no se muestran píldoras de filtro', () => {
    render(<GestionGeovisores />)
    expect(screen.queryByRole('button', { name: 'Geología' })).not.toBeInTheDocument()
  })

  test('el buscador filtra por título y muestra un mensaje cuando no hay coincidencias', async () => {
    mockDosGeovisores()
    const user = userEvent.setup()
    render(<GestionGeovisores />)

    expect(screen.getAllByText('Geología del Chocó').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hidrología Amazónica').length).toBeGreaterThan(0)

    await user.type(screen.getByLabelText(/Buscar geovisor por título/i), 'hidro')
    expect(screen.queryByText('Geología del Chocó')).not.toBeInTheDocument()
    expect(screen.getAllByText('Hidrología Amazónica').length).toBeGreaterThan(0)

    await user.clear(screen.getByLabelText(/Buscar geovisor por título/i))
    await user.type(screen.getByLabelText(/Buscar geovisor por título/i), 'no existe nada así')
    expect(screen.getByText('Ningún geovisor coincide con la búsqueda')).toBeInTheDocument()
  })

  test('las píldoras de categoría filtran la lista y se pueden des-seleccionar', async () => {
    mockDosGeovisores()
    const user = userEvent.setup()
    render(<GestionGeovisores />)

    const pill = screen.getByRole('button', { name: 'Geología' })
    await user.click(pill)
    expect(screen.getAllByText('Geología del Chocó').length).toBeGreaterThan(0)
    expect(screen.queryByText('Hidrología Amazónica')).not.toBeInTheDocument()

    await user.click(pill)
    expect(screen.getAllByText('Geología del Chocó').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Hidrología Amazónica').length).toBeGreaterThan(0)
  })
})
