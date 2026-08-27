import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode, HTMLAttributes } from 'react'
import GestionDocumentos from '@/pages/admin/GestionDocumentos'
import type { DocumentoData } from '@/hooks/useDocumentos'

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: HTMLAttributes<HTMLDivElement>) => <div {...p}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/components/ui/Card3D', () => ({
  default: ({ children, className }: { children: ReactNode; className?: string }) =>
    <div className={className}>{children}</div>,
}))

vi.mock('@/hooks/useDocumentos', () => ({
  useDocumentosList:   vi.fn(),
  useCreateDocumento:  vi.fn(),
  useUpdateDocumento:  vi.fn(),
  useDeleteDocumento:  vi.fn(),
}))
import {
  useDocumentosList, useCreateDocumento, useUpdateDocumento, useDeleteDocumento,
} from '@/hooks/useDocumentos'

vi.mock('@/hooks/useCategorias', () => ({
  useCategoriasList: () => ({ data: [] }),
}))

function makeDoc(overrides: Partial<DocumentoData> = {}): DocumentoData {
  return {
    id: 'd1', slug: 'informe-1', titulo: 'Informe de Biodiversidad', tipo: 'Cartografía',
    anio: 2025, autores: 'IIAP', resumen: '', archivo_url: '/f1.pdf', visibilidad: 'publico',
    activo: true, creado_en: '2025-01-01T00:00:00Z', nombre: 'Informe de Biodiversidad',
    categoria: 'Cartografía', categoria_thumbnail_url: null, fecha: '01/01/2025', type: 'pdf',
    url: '/f1.pdf', tamano: '1.2 MB', descargas: 0,
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(useDocumentosList).mockReturnValue({
    data: { data: [], meta: { total: 0, pages: 1 } }, isLoading: false, isError: false, refetch: vi.fn(),
  } as unknown as ReturnType<typeof useDocumentosList>)
  vi.mocked(useCreateDocumento).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useCreateDocumento>)
  vi.mocked(useUpdateDocumento).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdateDocumento>)
  vi.mocked(useDeleteDocumento).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useDeleteDocumento>)
})

async function openCreateModal() {
  const user = userEvent.setup()
  render(<GestionDocumentos />)
  await user.click(screen.getAllByRole('button', { name: /Ingresar nuevo documento/i })[0])
  return user
}

function docsFixture() {
  return [
    makeDoc({ id: 'd1', nombre: 'Informe de Biodiversidad', categoria: 'Cartografía', type: 'pdf' }),
    makeDoc({ id: 'd2', nombre: 'Reporte Hídrico', categoria: 'Hidrología', type: 'xlsx', visibilidad: 'usuarios' }),
  ]
}

describe('GestionDocumentos — validación del formulario', () => {
  test('nombre, categoría y archivo son obligatorios al crear', async () => {
    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: /Registrar documento/i }))

    expect(await screen.findByText('El nombre del documento es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Selecciona o escribe una categoría')).toBeInTheDocument()
    expect(screen.getByText('Debes seleccionar el archivo del documento para continuar')).toBeInTheDocument()
  })

  test('no llama a la mutación de creación mientras haya errores de validación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateDocumento).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateDocumento>)

    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: /Registrar documento/i }))

    expect(await screen.findByText('El nombre del documento es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('un año de publicación fuera de rango no debe silenciar los demás errores de validación', async () => {
    const user = await openCreateModal()
    await user.clear(screen.getByLabelText(/Año de publicación/i))
    await user.type(screen.getByLabelText(/Año de publicación/i), '1500')
    await user.click(screen.getByRole('button', { name: /Registrar documento/i }))

    expect(await screen.findByText('El nombre del documento es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Selecciona o escribe una categoría')).toBeInTheDocument()
  })
})

describe('GestionDocumentos — guarda de doble envío', () => {
  test('deshabilita Cancelar y Registrar mientras la mutación está en curso', async () => {
    vi.mocked(useCreateDocumento).mockReturnValue({
      mutateAsync: vi.fn(), isPending: true,
    } as unknown as ReturnType<typeof useCreateDocumento>)

    await openCreateModal()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Registrando…/i })).toBeDisabled()
  })
})

function getFileInputHelper(container: HTMLElement) {
  return container.querySelector('input[type="file"]') as HTMLInputElement
}

describe('GestionDocumentos — dropzone de archivo', () => {
  test('un archivo válido se muestra listo para subir, con opción de quitarlo', async () => {
    const user = userEvent.setup()
    const { container } = render(<GestionDocumentos />)
    await user.click(screen.getAllByRole('button', { name: /Ingresar nuevo documento/i })[0])

    const file = new File(['contenido'], 'mapa.pdf', { type: 'application/pdf' })
    await user.upload(getFileInputHelper(container), file)

    expect(screen.getByText('mapa.pdf')).toBeInTheDocument()
  })

  test('un PDF que excede 20 MB muestra el error de límite', async () => {
    const user = userEvent.setup()
    const { container } = render(<GestionDocumentos />)
    await user.click(screen.getAllByRole('button', { name: /Ingresar nuevo documento/i })[0])

    const big = new File(['x'], 'grande.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 21 * 1024 * 1024 })
    await user.upload(getFileInputHelper(container), big)

    expect(screen.getByText('El archivo supera el límite permitido para PDF')).toBeInTheDocument()
    expect(screen.queryByText('grande.pdf')).not.toBeInTheDocument()
  })

  test('cambiar el tipo de archivo a Word actualiza el límite permitido', async () => {
    const user = userEvent.setup()
    const { container } = render(<GestionDocumentos />)
    await user.click(screen.getAllByRole('button', { name: /Ingresar nuevo documento/i })[0])
    await user.click(screen.getByRole('button', { name: 'Word' }))

    const big = new File(['x'], 'doc.docx', { type: 'application/msword' })
    Object.defineProperty(big, 'size', { value: 60 * 1024 * 1024 })
    await user.upload(getFileInputHelper(container), big)

    expect(screen.getByText('El archivo supera el límite permitido para Word')).toBeInTheDocument()
  })
})

describe('GestionDocumentos — categoría', () => {
  test('escribir una categoría nueva ofrece crearla al vuelo', async () => {
    const user = await openCreateModal()
    await user.type(screen.getByPlaceholderText('Selecciona o escribe una categoría nueva…'), 'Sensores Remotos')

    expect(screen.getByText(/Crear categoría:/)).toBeInTheDocument()
    await user.click(screen.getByText(/Crear categoría:/))
    expect(screen.getByText('Nueva categoría — se creará automáticamente al guardar')).toBeInTheDocument()
  })

  test('seleccionar una categoría existente de la lista la asigna', async () => {
    const user = await openCreateModal()
    await user.click(screen.getByPlaceholderText('Selecciona o escribe una categoría nueva…'))
    await user.click(screen.getByText('Cartografía'))

    expect(screen.getByPlaceholderText('Selecciona o escribe una categoría nueva…')).toHaveValue('Cartografía')
  })
})

describe('GestionDocumentos — visibilidad', () => {
  test('seleccionar un nivel de acceso distinto actualiza el formulario', async () => {
    const user = await openCreateModal()
    await user.click(screen.getByText('Usuarios registrados'))
    // No debería lanzar y el botón debe quedar marcado como seleccionado
    expect(screen.getByText('Usuarios registrados').closest('button')).toHaveClass('text-gold-400')
  })
})

describe('GestionDocumentos — creación con datos válidos', () => {
  test('arma el FormData con nombre, categoría, visibilidad y archivo', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateDocumento).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateDocumento>)

    const user = userEvent.setup()
    const { container } = render(<GestionDocumentos />)
    await user.click(screen.getAllByRole('button', { name: /Ingresar nuevo documento/i })[0])

    const file = new File(['contenido'], 'mapa.pdf', { type: 'application/pdf' })
    await user.upload(getFileInputHelper(container), file)
    await user.type(screen.getByLabelText(/Nombre del documento/i), 'Mapa de cobertura 2025')
    await user.click(screen.getByPlaceholderText('Selecciona o escribe una categoría nueva…'))
    await user.click(screen.getByText('Cartografía'))
    await user.click(screen.getByRole('button', { name: /^Registrar documento$/i }))

    expect(mutateAsync).toHaveBeenCalledTimes(1)
    const call = mutateAsync.mock.calls[0][0] as { formData: FormData }
    expect(call.formData.get('titulo')).toBe('Mapa de cobertura 2025')
    expect(call.formData.get('tipo')).toBe('Cartografía')
    expect(call.formData.get('visibilidad')).toBe('publico')
    expect(call.formData.get('archivo')).toBeInstanceOf(File)
    expect(await screen.findByText('Documento "Mapa de cobertura 2025" registrado correctamente')).toBeInTheDocument()
  })

  test('si el servidor rechaza la creación, muestra el mensaje de error sin cerrar el modal', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('Espacio de almacenamiento agotado'))
    vi.mocked(useCreateDocumento).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateDocumento>)

    const user = userEvent.setup()
    const { container } = render(<GestionDocumentos />)
    await user.click(screen.getAllByRole('button', { name: /Ingresar nuevo documento/i })[0])
    const file = new File(['contenido'], 'mapa.pdf', { type: 'application/pdf' })
    await user.upload(getFileInputHelper(container), file)
    await user.type(screen.getByLabelText(/Nombre del documento/i), 'Mapa X')
    await user.click(screen.getByPlaceholderText('Selecciona o escribe una categoría nueva…'))
    await user.click(screen.getByText('Cartografía'))
    await user.click(screen.getByRole('button', { name: /^Registrar documento$/i }))

    expect(await screen.findByText('Espacio de almacenamiento agotado')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre del documento/i)).toBeInTheDocument()
  })
})

describe('GestionDocumentos — tabla y filtros', () => {
  test('muestra los documentos con su categoría, visibilidad, tipo y autor', () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: docsFixture(), meta: { total: 2, pages: 1 } }, isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDocumentosList>)

    render(<GestionDocumentos />)
    expect(screen.getByText('Informe de Biodiversidad')).toBeInTheDocument()
    expect(screen.getByText('Reporte Hídrico')).toBeInTheDocument()
    expect(screen.getByText('Usuarios registrados')).toBeInTheDocument()
  })

  test('el filtro de tipo aplica solo del lado cliente sobre los documentos cargados', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: docsFixture(), meta: { total: 2, pages: 1 } }, isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<GestionDocumentos />)
    await user.selectOptions(screen.getByDisplayValue('Todos los tipos'), 'Excel')

    expect(screen.getByText('Reporte Hídrico')).toBeInTheDocument()
    expect(screen.queryByText('Informe de Biodiversidad')).not.toBeInTheDocument()
  })

  test('las pills de categoría filtran y se pueden desactivar de nuevo', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: docsFixture(), meta: { total: 2, pages: 1 } }, isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<GestionDocumentos />)
    const pill = screen.getByRole('button', { name: /^Cartografía 1$/i })
    await user.click(pill)
    expect(pill).toHaveClass('bg-primary-800')

    await user.click(pill)
    expect(pill).not.toHaveClass('bg-primary-800')
  })

  test('estado de error muestra el mensaje y Reintentar llama a refetch', async () => {
    const refetch = vi.fn()
    vi.mocked(useDocumentosList).mockReturnValue({
      data: undefined, isLoading: false, isError: true, refetch,
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<GestionDocumentos />)
    await user.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(refetch).toHaveBeenCalled()
  })

  test('estado vacío ofrece ingresar el primer documento', () => {
    render(<GestionDocumentos />)
    expect(screen.getByText('Aún no hay documentos registrados')).toBeInTheDocument()
  })
})

describe('GestionDocumentos — edición', () => {
  test('editar precarga el formulario con los datos del documento', async () => {
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [docsFixture()[0]], meta: { total: 1, pages: 1 } }, isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<GestionDocumentos />)
    await user.click(screen.getByTitle('Editar documento'))

    expect(screen.getByText('Editar documento')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre del documento/i)).toHaveValue('Informe de Biodiversidad')
    expect(screen.getByRole('button', { name: /^Guardar cambios$/i })).toBeInTheDocument()
  })

  test('guardar cambios llama a la mutación de actualización con el id del documento', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateDocumento).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdateDocumento>)
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [docsFixture()[0]], meta: { total: 1, pages: 1 } }, isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<GestionDocumentos />)
    await user.click(screen.getByTitle('Editar documento'))
    await user.click(screen.getByRole('button', { name: /^Guardar cambios$/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: 'd1' }))
  })
})

describe('GestionDocumentos — eliminación', () => {
  test('cancelar la eliminación no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useDeleteDocumento).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useDeleteDocumento>)
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [docsFixture()[0]], meta: { total: 1, pages: 1 } }, isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<GestionDocumentos />)
    await user.click(screen.getByTitle('Eliminar documento'))
    expect(screen.getByText('Eliminar documento')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByText(/Seguro que deseas eliminar/)).not.toBeInTheDocument()
  })

  test('confirmar la eliminación llama a la mutación con el id y muestra el toast', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteDocumento).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useDeleteDocumento>)
    vi.mocked(useDocumentosList).mockReturnValue({
      data: { data: [docsFixture()[0]], meta: { total: 1, pages: 1 } }, isLoading: false, isError: false, refetch: vi.fn(),
    } as unknown as ReturnType<typeof useDocumentosList>)

    const user = userEvent.setup()
    render(<GestionDocumentos />)
    await user.click(screen.getByTitle('Eliminar documento'))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    expect(mutateAsync).toHaveBeenCalledWith('d1')
    expect(await screen.findByText('Documento "Informe de Biodiversidad" eliminado')).toBeInTheDocument()
  })
})
