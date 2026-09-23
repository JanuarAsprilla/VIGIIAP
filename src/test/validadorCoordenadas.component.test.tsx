/**
 * Test de integración del orquestador ValidadorCoordenadas -- el mapa
 * (react-leaflet + leaflet.markercluster) se mockea como un stub, mismo
 * patrón que GeovisorViewer.test.tsx para componentes de mapa. La lectura
 * de Excel se mockea en el límite del módulo (mismo patrón que
 * panelChoco.hooks.test.tsx / useCargaExcel), la lógica de validación real
 * (lib/validacion.ts) corre sin mocks.
 */
import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ValidadorCoordenadas from '@/components/herramientas/validador-coordenadas/ValidadorCoordenadas'

vi.mock('@/components/herramientas/validador-coordenadas/components/MapaValidador', () => ({
  default: () => <div data-testid="mapa-stub" />,
}))

vi.mock('@/components/herramientas/validador-coordenadas/lib/excelIO', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/herramientas/validador-coordenadas/lib/excelIO')>()),
  leerExcelMejorHoja: vi.fn(),
  exportarResultados: vi.fn().mockResolvedValue(undefined),
}))

import { leerExcelMejorHoja, exportarResultados } from '@/components/herramientas/validador-coordenadas/lib/excelIO'

// Quibdó real (verificado contra los datos embebidos, no un supuesto).
const FILA_VALIDA = { lat: 5.6947, lon: -76.6611 }
const FILA_FUERA = { lat: 4.71, lon: -74.07 } // Bogotá -- fuera de los 93 municipios

function fakeFile() {
  return new File(['contenido'], 'coordenadas.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
}

beforeEach(() => vi.clearAllMocks())

describe('ValidadorCoordenadas — carga y selección de columnas', () => {
  test('cargar un Excel con columnas ambiguas abre el modal de selección con la sugerencia correcta', async () => {
    vi.mocked(leerExcelMejorHoja).mockResolvedValue({ nombreHoja: 'Hoja1', filas: [FILA_VALIDA, FILA_FUERA] })
    const user = userEvent.setup()
    render(<ValidadorCoordenadas />)

    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await user.upload(input, fakeFile())

    expect(await screen.findByText('Selecciona las columnas de coordenadas')).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: /Columna de latitud/i })).toHaveValue('lat')
    expect(screen.getByRole('combobox', { name: /Columna de longitud/i })).toHaveValue('lon')
  })

  test('menos de 2 columnas numéricas muestra un error sin abrir el modal', async () => {
    vi.mocked(leerExcelMejorHoja).mockResolvedValue({ nombreHoja: 'Hoja1', filas: [{ lat: 5.69, sitio: 'A' }] })
    const user = userEvent.setup()
    render(<ValidadorCoordenadas />)

    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, fakeFile())

    expect(await screen.findByText(/No se encontraron al menos 2 columnas numéricas/)).toBeInTheDocument()
    expect(screen.queryByText('Selecciona las columnas de coordenadas')).not.toBeInTheDocument()
  })

  test('confirmar columnas valida los datos y muestra los KPIs correctos', async () => {
    vi.mocked(leerExcelMejorHoja).mockResolvedValue({ nombreHoja: 'Hoja1', filas: [FILA_VALIDA, FILA_FUERA] })
    const user = userEvent.setup()
    render(<ValidadorCoordenadas />)

    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, fakeFile())
    await screen.findByText('Selecciona las columnas de coordenadas')
    await user.click(screen.getByRole('button', { name: 'Confirmar y validar' }))

    await waitFor(() => expect(screen.queryByText('Selecciona las columnas de coordenadas')).not.toBeInTheDocument())
    expect(screen.getByText('Registros (2)')).toBeInTheDocument()
    // FILA_VALIDA -> Quibdó, FILA_FUERA -> fuera de los 93 municipios. "Quibdó"
    // aparece varias veces (opción de filtro, tabla, resumen) -- basta con que
    // aparezca al menos una vez tras la validación.
    await waitFor(() => expect(screen.getAllByText('Quibdó').length).toBeGreaterThan(0))
  })

  test('cancelar el modal no carga datos', async () => {
    vi.mocked(leerExcelMejorHoja).mockResolvedValue({ nombreHoja: 'Hoja1', filas: [FILA_VALIDA, FILA_FUERA] })
    const user = userEvent.setup()
    render(<ValidadorCoordenadas />)

    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, fakeFile())
    await screen.findByText('Selecciona las columnas de coordenadas')
    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByText('Selecciona las columnas de coordenadas')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Descargar Excel de resultados/i })).toBeDisabled()
  })
})

describe('ValidadorCoordenadas — filtros y exportación', () => {
  async function cargarDatos() {
    vi.mocked(leerExcelMejorHoja).mockResolvedValue({ nombreHoja: 'Hoja1', filas: [FILA_VALIDA, FILA_FUERA] })
    const user = userEvent.setup()
    render(<ValidadorCoordenadas />)
    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, fakeFile())
    await screen.findByText('Selecciona las columnas de coordenadas')
    await user.click(screen.getByRole('button', { name: 'Confirmar y validar' }))
    await waitFor(() => expect(screen.queryByText('Selecciona las columnas de coordenadas')).not.toBeInTheDocument())
    return user
  }

  test('filtrar por estado VÁLIDA reduce el conteo de registros a 1', async () => {
    const user = await cargarDatos()
    expect(screen.getByText('Registros (2)')).toBeInTheDocument()

    const selects = screen.getAllByRole('combobox')
    const estadoSelect = selects.find((s) => within(s).queryByText('Estado: todos'))!
    await user.selectOptions(estadoSelect, 'VÁLIDA')

    await waitFor(() => expect(screen.getByText('Registros (1)')).toBeInTheDocument())
  })

  test('exportar llama a exportarResultados con las filas y resultados actuales', async () => {
    const user = await cargarDatos()
    await user.click(screen.getByRole('button', { name: /Descargar Excel de resultados/i }))

    await waitFor(() => expect(exportarResultados).toHaveBeenCalledTimes(1))
    const [rows, results, colLat, colLon] = vi.mocked(exportarResultados).mock.calls[0]
    expect(rows).toHaveLength(2)
    expect(results).toHaveLength(2)
    expect(colLat).toBe('lat')
    expect(colLon).toBe('lon')
  })
})

describe('ValidadorCoordenadas — errores de lectura', () => {
  test('un Excel que falla al leerse muestra el mensaje de error', async () => {
    vi.mocked(leerExcelMejorHoja).mockRejectedValue(new Error('archivo corrupto'))
    const user = userEvent.setup()
    render(<ValidadorCoordenadas />)

    await user.upload(document.querySelector('input[type="file"]') as HTMLInputElement, fakeFile())

    expect(await screen.findByText(/No se pudo procesar el Excel: archivo corrupto/)).toBeInTheDocument()
  })
})
