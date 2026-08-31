import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode, HTMLAttributes } from 'react'
import GestionMapas from '@/pages/admin/GestionMapas'
import type { MapaData } from '@/hooks/useMapas'

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

vi.mock('@tanstack/react-virtual', () => ({
  useWindowVirtualizer: ({ count }: { count: number }) => ({
    getTotalSize: () => count * 224,
    getVirtualItems: () => Array.from({ length: count }, (_, index) => ({ key: index, index, start: index * 224 })),
    measureElement: () => {},
    options: { scrollMargin: 0 },
  }),
}))

vi.mock('@/hooks/useMapas', () => ({
  useMapasList:        vi.fn(),
  useCreateMapa:       vi.fn(),
  useUpdateMapa:       vi.fn(),
  useToggleMapaActivo: vi.fn(),
  useDeleteMapa:       vi.fn(),
}))
import {
  useMapasList, useCreateMapa, useUpdateMapa, useToggleMapaActivo, useDeleteMapa,
} from '@/hooks/useMapas'

beforeEach(() => {
  vi.clearAllMocks()
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn(() => ({
      matches: false, media: '', onchange: null,
      addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: vi.fn(),
    })),
  })

  vi.mocked(useMapasList).mockReturnValue({
    data: { data: [], meta: { total: 0 } }, isLoading: false, isError: false,
  } as unknown as ReturnType<typeof useMapasList>)
  vi.mocked(useCreateMapa).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useCreateMapa>)
  vi.mocked(useUpdateMapa).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useUpdateMapa>)
  vi.mocked(useToggleMapaActivo).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useToggleMapaActivo>)
  vi.mocked(useDeleteMapa).mockReturnValue({
    mutateAsync: vi.fn(), isPending: false,
  } as unknown as ReturnType<typeof useDeleteMapa>)
})

async function openCreateModal() {
  const user = userEvent.setup()
  render(<GestionMapas />)
  await user.click(screen.getByRole('button', { name: /Ingresar nuevo mapa/i }))
  return user
}

function makeMapa(overrides: Partial<MapaData> = {}): MapaData {
  return {
    id: 'm1', slug: 'mapa-1', titulo: 'Zonificación Chocó', categoria: 'Zonificación', anio: 2025,
    descripcion: 'Mapa de zonificación ambiental', thumbnail_url: null, archivo_pdf_url: '/m1.pdf',
    archivo_img_url: null, geovisor_url: null, activo: true, visibilidad: 'publico', creado_en: '2025-01-01T00:00:00Z',
    title: 'Zonificación Chocó', category: 'Zonificación', categoryKey: 'zonificacion', excerpt: '', year: '2025',
    formats: ['PDF'], badge: 'PDF', badgeColor: 'primary', geovisorLink: '/geovisor', department: '',
    nombre: 'Zonificación Chocó', tematica: 'Zonificación', escala: '1:100.000', autor: 'IIAP',
    fecha: '01/01/2025', visible: true, formato: 'PDF', url: '', consultas: 0,
    ...overrides,
  }
}

describe('GestionMapas — validación del formulario', () => {
  test('nombre, temática y archivo son obligatorios para un mapa nuevo en formato PDF', async () => {
    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(await screen.findByText('El nombre del mapa es obligatorio')).toBeInTheDocument()
    expect(screen.getByText('Selecciona o escribe una temática')).toBeInTheDocument()
    expect(screen.getByText('Debes seleccionar el archivo del mapa para continuar')).toBeInTheDocument()
  })

  test('el formato Geovisor no exige archivo, pero sí la URL', async () => {
    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: 'Geovisor' }))
    await user.type(screen.getByLabelText(/Nombre del mapa/i), 'Mapa geovisor de prueba')
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(await screen.findByText('Debes ingresar la URL del Geovisor')).toBeInTheDocument()
    expect(screen.queryByText('Debes seleccionar el archivo del mapa para continuar')).not.toBeInTheDocument()
  })

  test('no llama a la mutación de creación mientras haya errores de validación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateMapa>)

    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(await screen.findByText('El nombre del mapa es obligatorio')).toBeInTheDocument()
    expect(mutateAsync).not.toHaveBeenCalled()
  })

  test('con nombre, temática y URL válidos, el envío llega a la mutación con un año dentro de rango', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateMapa>)

    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: 'Geovisor' }))
    await user.type(screen.getByLabelText(/Nombre del mapa/i), 'Mapa geovisor de prueba')
    await user.type(screen.getByPlaceholderText('Selecciona o crea una temática…'), 'Cartografía')
    await user.type(screen.getByLabelText(/URL del Geovisor/i), 'https://geovisor.iiap.org.co/mapa')
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(mutateAsync).toHaveBeenCalled()
  })

  test('con datos por lo demás válidos, un año fuera del rango 1900–2100 no debe bloquear el envío en silencio', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateMapa>)

    const user = await openCreateModal()
    await user.click(screen.getByRole('button', { name: 'Geovisor' }))
    await user.type(screen.getByLabelText(/Nombre del mapa/i), 'Mapa geovisor de prueba')
    await user.type(screen.getByPlaceholderText('Selecciona o crea una temática…'), 'Cartografía')
    await user.type(screen.getByLabelText(/URL del Geovisor/i), 'https://geovisor.iiap.org.co/mapa')
    await user.clear(screen.getByLabelText('Año'))
    await user.type(screen.getByLabelText('Año'), '1500')
    await user.click(screen.getByRole('button', { name: /Registrar mapa/i }))

    expect(mutateAsync).toHaveBeenCalled()
  })
})

describe('GestionMapas — guarda de doble envío', () => {
  test('deshabilita Cancelar y Registrar mientras la mutación está en curso', async () => {
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync: vi.fn(), isPending: true,
    } as unknown as ReturnType<typeof useCreateMapa>)

    await openCreateModal()

    expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled()
    expect(screen.getByRole('button', { name: /Registrando…/i })).toBeDisabled()
  })
})

describe('GestionMapas — tarjetas y filtros', () => {
  test('muestra el mapa con temática, formato, autor y fecha', () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMapa()], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    render(<GestionMapas />)
    // El nombre aparece dos veces: en el título siempre-visible de la tarjeta
    // y dentro del panel de detalle (oculto por opacidad, no desmontado).
    expect(screen.getAllByText('Zonificación Chocó').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Zonificación').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/IIAP · 01\/01\/2025/).length).toBeGreaterThan(0)
  })

  test('un mapa oculto muestra la etiqueta "Oculto"', () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMapa({ visible: false })], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    render(<GestionMapas />)
    expect(screen.getByText('Oculto')).toBeInTheDocument()
  })

  test('alternar visibilidad llama a toggleActivo con el estado invertido', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useToggleMapaActivo).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useToggleMapaActivo>)
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMapa({ visible: true })], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByTitle('Visible — clic para ocultar'))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'm1', activo: false })
  })

  test('el buscador filtra por nombre y por autor', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: {
        data: [
          makeMapa({ id: 'm1', nombre: 'Zonificación Chocó', autor: 'IIAP' }),
          makeMapa({ id: 'm2', nombre: 'Cobertura Nariño', tematica: 'Cartografía Base', autor: 'CVC' }),
        ],
        meta: { total: 2 },
      }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.type(screen.getByLabelText('Buscar mapas por nombre o autor'), 'cvc')

    expect(screen.getAllByText('Cobertura Nariño').length).toBeGreaterThan(0)
    expect(screen.queryByText('Zonificación Chocó')).not.toBeInTheDocument()
  })

  test('las pills temáticas filtran los mapas mostrados', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: {
        data: [
          makeMapa({ id: 'm1', nombre: 'Zonificación Chocó', tematica: 'Zonificación' }),
          makeMapa({ id: 'm2', nombre: 'Cobertura Nariño', tematica: 'Cartografía Base' }),
        ],
        meta: { total: 2 },
      }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: 'Zonificación' }))

    expect(screen.getAllByText('Zonificación Chocó').length).toBeGreaterThan(0)
    expect(screen.queryByText('Cobertura Nariño')).not.toBeInTheDocument()
  })

  test('ver archivo abre el enlace en una pestaña nueva', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMapa({ archivo_pdf_url: '/m1.pdf' })], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Zonificación Chocó, Zonificación\. Clic para ver detalles/ }))
    await user.click(screen.getByText('Ver archivo'))

    expect(openSpy).toHaveBeenCalledWith('/m1.pdf', '_blank', 'noopener,noreferrer')
    openSpy.mockRestore()
  })

  test('estado de error ofrece reintentar', async () => {
    const refetch = vi.fn()
    vi.mocked(useMapasList).mockReturnValue({
      data: undefined, isLoading: false, isError: true, refetch,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Reintentar/i }))
    expect(refetch).toHaveBeenCalled()
  })

  test('estado vacío ofrece ingresar el primer mapa', () => {
    render(<GestionMapas />)
    expect(screen.getByText('Aún no hay mapas registrados')).toBeInTheDocument()
  })
})

describe('GestionMapas — edición y eliminación', () => {
  test('editar precarga el formulario con los datos del mapa', async () => {
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMapa()], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Zonificación Chocó, Zonificación\. Clic para ver detalles/ }))
    await user.click(screen.getByText('Editar'))

    expect(screen.getByText('Editar mapa')).toBeInTheDocument()
    expect(screen.getByLabelText(/Nombre del mapa/i)).toHaveValue('Zonificación Chocó')
  })

  test('guardar cambios llama a la mutación de actualización con el id del mapa', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useUpdateMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useUpdateMapa>)
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMapa()], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Zonificación Chocó, Zonificación\. Clic para ver detalles/ }))
    await user.click(screen.getByText('Editar'))
    await user.click(screen.getByRole('button', { name: /^Guardar cambios$/i }))

    expect(mutateAsync).toHaveBeenCalledWith(expect.objectContaining({ id: 'm1' }))
  })

  test('confirmar eliminación llama a la mutación con el id y muestra el toast', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useDeleteMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useDeleteMapa>)
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMapa()], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Zonificación Chocó, Zonificación\. Clic para ver detalles/ }))
    await user.click(screen.getByText('Eliminar'))
    await user.click(screen.getByRole('button', { name: 'Sí, eliminar' }))

    expect(mutateAsync).toHaveBeenCalledWith('m1')
    expect(await screen.findByText('Mapa "Zonificación Chocó" eliminado')).toBeInTheDocument()
  })

  test('cancelar la eliminación no llama a la mutación', async () => {
    const mutateAsync = vi.fn()
    vi.mocked(useDeleteMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useDeleteMapa>)
    vi.mocked(useMapasList).mockReturnValue({
      data: { data: [makeMapa()], meta: { total: 1 } }, isLoading: false, isError: false,
    } as unknown as ReturnType<typeof useMapasList>)

    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Zonificación Chocó, Zonificación\. Clic para ver detalles/ }))
    await user.click(screen.getByText('Eliminar'))
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(mutateAsync).not.toHaveBeenCalled()
  })
})

describe('GestionMapas — dropzone y detección de formato', () => {
  function getFileInput(container: HTMLElement) {
    return container.querySelector('input[type="file"]:not([accept="image/*"])') as HTMLInputElement
  }

  function getDropzone(container: HTMLElement) {
    return getFileInput(container).closest('div[class*="border-dashed"]') as HTMLElement
  }

  function dropFile(el: HTMLElement, file: File) {
    fireEvent.drop(el, { dataTransfer: { files: [file] } })
  }

  test('soltar una imagen mientras el formato es PDF corrige el formato automáticamente', async () => {
    const user = userEvent.setup()
    const { container } = render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Ingresar nuevo mapa/i }))

    const img = new File(['x'], 'foto.png', { type: 'image/png' })
    dropFile(getDropzone(container), img)

    expect(await screen.findByRole('button', { name: 'IMG' })).toHaveClass('bg-primary-800')
  })

  test('un PDF que excede 20 MB muestra el error de límite', async () => {
    const user = userEvent.setup()
    const { container } = render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Ingresar nuevo mapa/i }))

    const big = new File(['x'], 'grande.pdf', { type: 'application/pdf' })
    Object.defineProperty(big, 'size', { value: 21 * 1024 * 1024 })
    dropFile(getDropzone(container), big)

    expect(await screen.findByText('El archivo supera el límite de 20 MB')).toBeInTheDocument()
  })

  test('el checkbox "Publicar en el portal público" refleja el estado del formulario', async () => {
    const user = userEvent.setup()
    render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Ingresar nuevo mapa/i }))

    const checkbox = screen.getByRole('checkbox', { name: /Publicar en el portal público/i })
    expect(checkbox).toBeChecked()
    await user.click(checkbox)
    expect(checkbox).not.toBeChecked()
  })
})

describe('GestionMapas — creación con datos válidos', () => {
  function getFileInput(container: HTMLElement) {
    return container.querySelector('input[type="file"]:not([accept="image/*"])') as HTMLInputElement
  }

  test('arma el FormData con el archivo, nombre y temática', async () => {
    const mutateAsync = vi.fn().mockResolvedValue(undefined)
    vi.mocked(useCreateMapa).mockReturnValue({
      mutateAsync, isPending: false,
    } as unknown as ReturnType<typeof useCreateMapa>)

    const user = userEvent.setup()
    const { container } = render(<GestionMapas />)
    await user.click(screen.getByRole('button', { name: /Ingresar nuevo mapa/i }))

    const file = new File(['contenido'], 'mapa.pdf', { type: 'application/pdf' })
    await user.upload(getFileInput(container), file)
    await user.type(screen.getByLabelText(/Nombre del mapa/i), 'Mapa de riesgo')
    await user.type(screen.getByPlaceholderText('Selecciona o crea una temática…'), 'Riesgo')
    await user.click(screen.getByRole('button', { name: /^Registrar mapa$/i }))

    expect(mutateAsync).toHaveBeenCalledTimes(1)
    const call = mutateAsync.mock.calls[0][0] as { formData: FormData }
    expect(call.formData.get('titulo')).toBe('Mapa de riesgo')
    expect(call.formData.get('categoria')).toBe('Riesgo')
    expect(call.formData.get('archivo_pdf')).toBeInstanceOf(File)
    expect(await screen.findByText('Mapa "Mapa de riesgo" registrado correctamente')).toBeInTheDocument()
  })
})
