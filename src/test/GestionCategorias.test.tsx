import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import GestionCategorias from '@/pages/admin/GestionCategorias'

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

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/hooks/useCategorias', () => ({
  useCategoriasList: vi.fn(),
  useCreateCategoria: vi.fn(),
  useUploadCategoriaThumbnail: vi.fn(),
  useRenameCategoria: vi.fn(),
  useDeleteCategoria: vi.fn(),
  useUpdateModulosCategoria: vi.fn(),
}))
import {
  useCategoriasList, useCreateCategoria, useUploadCategoriaThumbnail, useRenameCategoria, useDeleteCategoria,
  useUpdateModulosCategoria,
} from '@/hooks/useCategorias'

// El conteo por módulo ahora lo calcula el servidor (ver categorias.service.js)
// y viaja en el propio GET /categorias -- ya no hace falta mockear
// useDocumentosList/useMapasList/useGeovisoresList en esta página.
function makeCategoria(overrides: Record<string, unknown> = {}) {
  return {
    nombre: 'Protocolos', descripcion: '', thumbnail_url: null, activo: true,
    modulos: ['documentos', 'mapas', 'geovisores'],
    conteo: { docs: 0, mapas: 0, geovisores: 0 },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  URL.createObjectURL = vi.fn().mockReturnValue('blob:mock')
  URL.revokeObjectURL = vi.fn()
  vi.mocked(useCategoriasList).mockReturnValue({
    data: [makeCategoria()], isLoading: false,
  } as unknown as ReturnType<typeof useCategoriasList>)
  vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)
  vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)
  vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)
  vi.mocked(useDeleteCategoria).mockReturnValue({ mutateAsync: vi.fn(), isPending: false } as unknown as ReturnType<typeof useDeleteCategoria>)
  vi.mocked(useUpdateModulosCategoria).mockReturnValue({ mutateAsync: vi.fn().mockResolvedValue(undefined), isPending: false } as unknown as ReturnType<typeof useUpdateModulosCategoria>)
})

describe('GestionCategorias — crear categoría', () => {
  test('un nombre vacío muestra error y no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('con nombre válido llama a la mutación con el nombre recortado', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ nombre: 'Informes Técnicos' })
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.type(screen.getByLabelText(/Nombre/i), '  Informes Técnicos  ')
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ nombre: 'Informes Técnicos', modulos: ['documentos', 'mapas', 'geovisores'] })
  })

  test('un error del servidor al crear muestra el mensaje sin cerrar el formulario', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Ya existe una categoría con ese nombre'))
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.type(screen.getByLabelText(/Nombre/i), 'Protocolos')
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(await screen.findByText('Ya existe una categoría con ese nombre')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre/i)).toBeInTheDocument()
  })
})

describe('GestionCategorias — renombrar categoría', () => {
  test('abre el modal con el nombre actual precargado y llama a la mutación con el nuevo nombre', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))

    expect(screen.getByLabelText(/Nuevo nombre/i)).toHaveValue('Protocolos')

    await user.clear(screen.getByLabelText(/Nuevo nombre/i))
    await user.type(screen.getByLabelText(/Nuevo nombre/i), 'Protocolos Ambientales')
    await user.click(screen.getByRole('button', { name: /^Renombrar$/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ nombre: 'Protocolos', nuevoNombre: 'Protocolos Ambientales' })
    expect(await screen.findByText('Categoría renombrada a "Protocolos Ambientales"')).toBeInTheDocument()
  })

  test('un nombre vacío muestra error y no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))
    await user.clear(screen.getByLabelText(/Nuevo nombre/i))
    await user.click(screen.getByRole('button', { name: /^Renombrar$/i }))

    expect(await screen.findByText('El nombre es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('si el nombre no cambió, cierra el modal sin llamar a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))
    await user.click(screen.getByRole('button', { name: /^Renombrar$/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('un error del servidor (nombre duplicado) se muestra sin cerrar el modal', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Ya existe una categoría con ese nombre'))
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))
    await user.clear(screen.getByLabelText(/Nuevo nombre/i))
    await user.type(screen.getByLabelText(/Nuevo nombre/i), 'Hidrología')
    await user.click(screen.getByRole('button', { name: /^Renombrar$/i }))

    expect(await screen.findByText('Ya existe una categoría con ese nombre')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nuevo nombre/i)).toBeInTheDocument()
  })

  test('cancelar no llama a la mutación de renombrado', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useRenameCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useRenameCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Renombrar categoría'))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByLabelText(/Nuevo nombre/i)).not.toBeInTheDocument()
  })
})

describe('GestionCategorias — eliminar categoría', () => {
  test('confirmar la eliminación llama a la mutación con el nombre correcto', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Eliminar categoría'))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(mutateAsync).toHaveBeenCalledWith('Protocolos')
  })

  test('cancelar no llama a la mutación de borrado', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useDeleteCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Eliminar categoría'))
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('si el servidor rechaza la eliminación, muestra un toast de error', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useDeleteCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useDeleteCategoria>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByTitle('Eliminar categoría'))
    await user.click(screen.getByRole('button', { name: /Sí, eliminar/i }))

    expect(await screen.findByText('No se pudo eliminar la categoría')).toBeInTheDocument()
  })
})

describe('GestionCategorias — listado', () => {
  test('estado vacío ofrece crear la primera categoría', () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    render(<GestionCategorias />)
    expect(screen.getByText('No hay categorías')).toBeInTheDocument()
  })

  test('muestra el conteo de documentos que viene del servidor', () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [
        makeCategoria({ nombre: 'Protocolos', conteo: { docs: 2, mapas: 0, geovisores: 0 } }),
        makeCategoria({ nombre: 'Hidrología', conteo: { docs: 1, mapas: 0, geovisores: 0 } }),
      ], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    render(<GestionCategorias />)
    expect(screen.getByText('2 docs')).toBeInTheDocument()
    expect(screen.getByText('1 doc')).toBeInTheDocument()
  })

  // Regresión: la tabla categorias es compartida entre documentos, mapas y
  // geovisores -- una categoría con 0 documentos pero mapas/geovisores no
  // debe leerse como "vacía".
  test('suma mapas y geovisores al conteo, no solo documentos', () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [
        makeCategoria({ nombre: 'Hidrología', conteo: { docs: 0, mapas: 2, geovisores: 0 } }),
        makeCategoria({ nombre: 'Geología', conteo: { docs: 0, mapas: 0, geovisores: 1 } }),
      ], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    render(<GestionCategorias />)
    expect(screen.getByText('2 mapas')).toBeInTheDocument()
    expect(screen.getByText('1 geovisor')).toBeInTheDocument()
    // ninguna de las dos categorías tiene documentos -- el badge no debe mencionarlos
    expect(screen.queryByText(/^\d+ docs?$/)).not.toBeInTheDocument()
  })

  test('una categoría sin documentos, mapas ni geovisores muestra "0 elementos"', () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [makeCategoria({ nombre: 'Sin uso' })], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    render(<GestionCategorias />)
    expect(screen.getByText('0 elementos')).toBeInTheDocument()
  })
})

describe('GestionCategorias — filtro por módulo', () => {
  function setupTresCategorias() {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [
        makeCategoria({ nombre: 'Hidrología', conteo: { docs: 0, mapas: 1, geovisores: 0 } }),
        makeCategoria({ nombre: 'Geología', conteo: { docs: 0, mapas: 0, geovisores: 1 } }),
        makeCategoria({ nombre: 'Sin uso' }),
      ], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)
  }

  test('filtrar por Geovisores solo muestra la categoría con al menos un geovisor', async () => {
    setupTresCategorias()
    const user = userEvent.setup()
    render(<GestionCategorias />)

    await user.click(screen.getByRole('button', { name: 'Geovisores' }))

    expect(screen.getByText('Geología')).toBeInTheDocument()
    expect(screen.queryByText('Hidrología')).not.toBeInTheDocument()
    expect(screen.queryByText('Sin uso')).not.toBeInTheDocument()
  })

  test('filtrar por Mapas solo muestra la categoría con al menos un mapa', async () => {
    setupTresCategorias()
    const user = userEvent.setup()
    render(<GestionCategorias />)

    await user.click(screen.getByRole('button', { name: 'Mapas' }))

    expect(screen.getByText('Hidrología')).toBeInTheDocument()
    expect(screen.queryByText('Geología')).not.toBeInTheDocument()
  })

  test('volver a "Todas" quita el filtro', async () => {
    setupTresCategorias()
    const user = userEvent.setup()
    render(<GestionCategorias />)

    await user.click(screen.getByRole('button', { name: 'Mapas' }))
    await user.click(screen.getByRole('button', { name: 'Todas' }))

    expect(screen.getByText('Hidrología')).toBeInTheDocument()
    expect(screen.getByText('Geología')).toBeInTheDocument()
    expect(screen.getByText('Sin uso')).toBeInTheDocument()
  })

  test('un filtro sin ninguna categoría coincidente muestra el estado vacío específico', async () => {
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [makeCategoria({ nombre: 'Sin uso' })], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: 'Documentos' }))

    expect(screen.getByText('Ninguna categoría tiene documentos todavía.')).toBeInTheDocument()
  })

  test('hacer clic de nuevo en el mismo filtro lo quita (toggle)', async () => {
    setupTresCategorias()
    const user = userEvent.setup()
    render(<GestionCategorias />)

    await user.click(screen.getByRole('button', { name: 'Geovisores' }))
    await user.click(screen.getByRole('button', { name: 'Geovisores' }))

    expect(screen.getByText('Hidrología')).toBeInTheDocument()
    expect(screen.getByText('Sin uso')).toBeInTheDocument()
  })
})

describe('GestionCategorias — imagen de portada al crear', () => {
  function getDropzoneInput(container: HTMLElement) {
    const inputs = container.querySelectorAll('input[type="file"]')
    return inputs[inputs.length - 1] as HTMLInputElement
  }

  test('soltar una imagen en el formulario de nueva categoría la incluye en la creación', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ nombre: 'Sensores' })
    const uploadMutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)
    vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: uploadMutateAsync, isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)

    const user = userEvent.setup()
    const { container } = render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.type(screen.getByLabelText(/Nombre/i), 'Sensores')

    const img = new File(['x'], 'portada.png', { type: 'image/png' })
    const input = getDropzoneInput(container)
    fireEvent.drop(input.closest('div')!, { dataTransfer: { files: [img] } })
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ nombre: 'Sensores', modulos: ['documentos', 'mapas', 'geovisores'] })
    expect(uploadMutateAsync).toHaveBeenCalledWith({ nombre: 'Sensores', file: img })
    expect(await screen.findByText('Categoría "Sensores" creada')).toBeInTheDocument()
  })
})

describe('GestionCategorias — imagen de portada en una tarjeta existente', () => {
  function getCardDropzoneInput(container: HTMLElement) {
    return container.querySelectorAll('input[type="file"]')[0] as HTMLInputElement
  }

  test('subir una imagen a una categoría existente llama a la mutación y notifica', async () => {
    const uploadMutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: uploadMutateAsync, isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)

    const user = userEvent.setup()
    const { container } = render(<GestionCategorias />)

    const img = new File(['x'], 'nueva-portada.png', { type: 'image/png' })
    const input = getCardDropzoneInput(container)
    fireEvent.drop(input.closest('div')!, { dataTransfer: { files: [img] } })
    await user.click(screen.getByText('Guardar imagen'))

    expect(uploadMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ nombre: 'Protocolos', file: img }))
    expect(await screen.findByText('Imagen de "Protocolos" actualizada')).toBeInTheDocument()
  })

  test('si la subida de imagen falla, muestra el error inline en la tarjeta', async () => {
    const uploadMutateAsync = vi.fn().mockRejectedValue(new Error('fail'))
    vi.mocked(useUploadCategoriaThumbnail).mockReturnValue({ mutateAsync: uploadMutateAsync, isPending: false } as unknown as ReturnType<typeof useUploadCategoriaThumbnail>)

    const user = userEvent.setup()
    const { container } = render(<GestionCategorias />)

    const img = new File(['x'], 'nueva-portada.png', { type: 'image/png' })
    const input = getCardDropzoneInput(container)
    fireEvent.drop(input.closest('div')!, { dataTransfer: { files: [img] } })
    await user.click(screen.getByText('Guardar imagen'))

    expect(await screen.findByText('No se pudo subir la imagen. Intenta de nuevo.')).toBeInTheDocument()
  })
})

describe('GestionCategorias — a qué módulos pertenece', () => {
  test('al crear, exige seleccionar al menos un módulo', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)
    // Sin categorías existentes -- así los botones "Módulo X" del formulario
    // de creación no compiten con los de una tarjeta ya en pantalla.
    vi.mocked(useCategoriasList).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useCategoriasList>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.type(screen.getByLabelText(/Nombre/i), 'Sensores')
    // Los 3 módulos vienen preseleccionados por defecto -- se destildan los 3.
    await user.click(screen.getByRole('button', { name: 'Módulo Documentos (asignado)' }))
    await user.click(screen.getByRole('button', { name: 'Módulo Mapas (asignado)' }))
    await user.click(screen.getByRole('button', { name: 'Módulo Geovisores (asignado)' }))
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(await screen.findByText('Selecciona a qué módulo(s) pertenece')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('al crear, se puede restringir a un solo módulo', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({ nombre: 'Sensores' })
    vi.mocked(useCreateCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useCreateCategoria>)
    vi.mocked(useCategoriasList).mockReturnValue({ data: [], isLoading: false } as unknown as ReturnType<typeof useCategoriasList>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: /Nueva categoría/i }))
    await user.type(screen.getByLabelText(/Nombre/i), 'Sensores')
    await user.click(screen.getByRole('button', { name: 'Módulo Documentos (asignado)' }))
    await user.click(screen.getByRole('button', { name: 'Módulo Mapas (asignado)' }))
    await user.click(screen.getByRole('button', { name: /Crear categoría/i }))

    expect(mutateAsync).toHaveBeenCalledWith({ nombre: 'Sensores', modulos: ['geovisores'] })
  })

  test('en una tarjeta existente, clic en un módulo llama a la mutación con el nuevo conjunto', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateModulosCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateModulosCategoria>)
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [makeCategoria({ modulos: ['documentos'] })], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: 'Módulo Mapas' }))

    expect(mutateAsync).toHaveBeenCalledWith({ nombre: 'Protocolos', modulos: ['documentos', 'mapas'] })
  })

  test('en una tarjeta existente, no permite quitar el último módulo', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useUpdateModulosCategoria).mockReturnValue({ mutateAsync, isPending: false } as unknown as ReturnType<typeof useUpdateModulosCategoria>)
    vi.mocked(useCategoriasList).mockReturnValue({
      data: [makeCategoria({ modulos: ['documentos'] })], isLoading: false,
    } as unknown as ReturnType<typeof useCategoriasList>)

    const user = userEvent.setup()
    render(<GestionCategorias />)
    await user.click(screen.getByRole('button', { name: 'Módulo Documentos (asignado)' }))

    expect(await screen.findByText('Una categoría debe pertenecer al menos a un módulo')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })
})
