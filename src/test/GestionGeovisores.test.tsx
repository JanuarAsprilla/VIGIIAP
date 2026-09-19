import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
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
  useToggleGeovisorActivo: vi.fn(),
  useDeleteGeovisor: vi.fn(),
}))
import {
  useGeovisoresList, useCreateGeovisor, useUpdateGeovisor, useToggleGeovisorActivo, useDeleteGeovisor,
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

function makeGeovisor(overrides: Record<string, unknown> = {}) {
  return {
    id: 'geovisor-1', slug: 'geologia-choco', titulo: 'Geología del Chocó',
    subtitulo: null, descripcion: null, cita: null, categoria: 'Geología',
    conexionGeoserverId: 'conexion-1', workspacesGeoserver: ['t_15_geologia'],
    capasSeleccionadas: ['t_15_geologia:fallas'],
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
  vi.mocked(useCreateGeovisor).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateGeovisor>)
  vi.mocked(useUpdateGeovisor).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUpdateGeovisor>)
  vi.mocked(useToggleGeovisorActivo).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useToggleGeovisorActivo>)
  vi.mocked(useDeleteGeovisor).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteGeovisor>)
})

describe('GestionGeovisores — listado', () => {
  test('muestra el título del geovisor y el nombre de su conexión', () => {
    render(<GestionGeovisores />)
    expect(screen.getByText('Geología del Chocó')).toBeInTheDocument()
    expect(screen.getByText('GeoServer institucional')).toBeInTheDocument()
  })

  test('sin conexiones registradas, el botón de crear está deshabilitado y muestra una advertencia', () => {
    vi.mocked(useConexionesGeoserverList).mockReturnValue({ data: [] } as unknown as ReturnType<typeof useConexionesGeoserverList>)
    render(<GestionGeovisores />)
    expect(screen.getByRole('button', { name: /Nuevo geovisor/i })).toBeDisabled()
    expect(screen.getByText(/Todavía no hay ninguna conexión GeoServer registrada/i)).toBeInTheDocument()
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
})

describe('GestionGeovisores — eliminar', () => {
  test('confirmar elimina el geovisor seleccionado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteGeovisor>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Eliminar'))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(mutateAsync).toHaveBeenCalledWith('geovisor-1')
  })

  test('cancelar en el modal de confirmación no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useDeleteGeovisor).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteGeovisor>)

    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Eliminar'))
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Sí, eliminar/i })).not.toBeInTheDocument()
  })
})

describe('GestionGeovisores — editar', () => {
  test('el botón Editar abre el formulario precargado con los datos del geovisor', async () => {
    const user = userEvent.setup()
    render(<GestionGeovisores />)
    await user.click(screen.getByTitle('Editar'))

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
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

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
    await user.click(screen.getByRole('button', { name: /Visibilidad y presentación/i }))
    await user.click(screen.getByRole('switch', { name: 'Mostrar imágenes en el popup' }))
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

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
    await user.click(screen.getByRole('button', { name: /Crear geovisor/i }))

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

    expect(screen.getByText('Geología del Chocó')).toBeInTheDocument()
    expect(screen.getByText('Hidrología Amazónica')).toBeInTheDocument()

    await user.type(screen.getByLabelText(/Buscar geovisor por título/i), 'hidro')
    expect(screen.queryByText('Geología del Chocó')).not.toBeInTheDocument()
    expect(screen.getByText('Hidrología Amazónica')).toBeInTheDocument()

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
    expect(screen.getByText('Geología del Chocó')).toBeInTheDocument()
    expect(screen.queryByText('Hidrología Amazónica')).not.toBeInTheDocument()

    await user.click(pill)
    expect(screen.getByText('Geología del Chocó')).toBeInTheDocument()
    expect(screen.getByText('Hidrología Amazónica')).toBeInTheDocument()
  })
})
