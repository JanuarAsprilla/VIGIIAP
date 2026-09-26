import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import ConversorCoordenadas from '@/components/herramientas/ConversorCoordenadas'
import { wgs84ToMagna, wgs84ToUtm18N } from '@/lib/proyeccionMagna'

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

beforeEach(() => { vi.clearAllMocks() })

async function convertirLote(texto: string) {
  const user = userEvent.setup()
  render(<ConversorCoordenadas />)
  const area = screen.getByLabelText(/Coordenadas a convertir/i)
  await user.clear(area)
  await user.type(area, texto, { skipClick: false })
  await user.click(screen.getByRole('button', { name: /Convertir/i }))
  return user
}

describe('ConversorCoordenadas — por defecto: WGS84 decimal → MAGNA Oeste', () => {
  test('convierte varias líneas a la vez', async () => {
    const esperado1 = wgs84ToMagna(4.8213, -76.7324)
    const esperado2 = wgs84ToMagna(5.6947, -76.6614)
    await convertirLote('4.8213, -76.7324{enter}5.6947, -76.6614')

    expect(await screen.findByText('2 resultados')).toBeInTheDocument()
    expect(screen.getByText(`${esperado1.x.toLocaleString('es-CO', { maximumFractionDigits: 6 })}, ${esperado1.y.toLocaleString('es-CO', { maximumFractionDigits: 6 })}`)).toBeInTheDocument()
    expect(screen.getByText(`${esperado2.x.toLocaleString('es-CO', { maximumFractionDigits: 6 })}, ${esperado2.y.toLocaleString('es-CO', { maximumFractionDigits: 6 })}`)).toBeInTheDocument()
  })

  test('acepta coordenadas separadas por tabulador (pegado desde Excel)', async () => {
    const user = userEvent.setup()
    render(<ConversorCoordenadas />)
    const area = screen.getByLabelText(/Coordenadas a convertir/i)
    await user.clear(area)
    await user.click(area)
    await user.paste('4.8213\t-76.7324')
    await user.click(screen.getByRole('button', { name: /Convertir/i }))

    expect(await screen.findByText('1 resultado')).toBeInTheDocument()
  })

  test('una coordenada fuera de Colombia se convierte igual, sin marcarse como error', async () => {
    // Petición explícita: el conversor no debe juzgar si la coordenada "tiene
    // sentido" geográficamente -- solo convertir lo que se le da.
    const esperado = wgs84ToMagna(40.6892, -74.0445) // Nueva York
    await convertirLote('40.6892, -74.0445')

    expect(await screen.findByText('1 resultado')).toBeInTheDocument()
    expect(screen.queryByText(/fuera del territorio/i)).not.toBeInTheDocument()
    expect(screen.getByText(`${esperado.x.toLocaleString('es-CO', { maximumFractionDigits: 6 })}, ${esperado.y.toLocaleString('es-CO', { maximumFractionDigits: 6 })}`)).toBeInTheDocument()
  })

  test('una fila con texto no numérico se marca como error', async () => {
    await convertirLote('abc, -76.7324')
    expect(await screen.findByText(/Valores no numéricos/)).toBeInTheDocument()
  })

  test('una fila con solo un valor se marca como error de formato', async () => {
    await convertirLote('4.8213')
    expect(await screen.findByText(/Se esperaban 2 valores/)).toBeInTheDocument()
  })

  test('ignora líneas en blanco', async () => {
    await convertirLote('4.8213, -76.7324{enter}{enter}5.6947, -76.6614')
    expect(await screen.findByText('2 resultados')).toBeInTheDocument()
  })
})

describe('ConversorCoordenadas — selector de formato', () => {
  test('el botón de intercambiar invierte origen y destino', async () => {
    const user = userEvent.setup()
    render(<ConversorCoordenadas />)

    await user.click(screen.getByRole('button', { name: /Intercambiar origen y destino/i }))

    const area = screen.getByLabelText(/Coordenadas a convertir/i)
    await user.clear(area)
    await user.type(area, '1042482, 1120943') // X, Y ahora es el origen
    await user.click(screen.getByRole('button', { name: /Convertir/i }))

    expect(await screen.findByText('1 resultado')).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: 'X, Y' })).toBeInTheDocument()
  })

  test('convierte a otra zona MAGNA (Bogotá) cuando se elige como destino', async () => {
    const user = userEvent.setup()
    render(<ConversorCoordenadas />)

    await user.selectOptions(screen.getByLabelText('A'), 'magna:bogota')
    const area = screen.getByLabelText(/Coordenadas a convertir/i)
    await user.clear(area)
    await user.type(area, '4.8213, -76.7324')
    await user.click(screen.getByRole('button', { name: /Convertir/i }))

    expect(await screen.findByText(/Magna Bogotá/)).toBeInTheDocument()
  })

  test('convierte a UTM Zona 18N cuando se elige como destino', async () => {
    const user = userEvent.setup()
    render(<ConversorCoordenadas />)
    await user.selectOptions(screen.getByLabelText('A'), 'utm18n')

    const esperado = wgs84ToUtm18N(4.8213, -76.7324)
    const area = screen.getByLabelText(/Coordenadas a convertir/i)
    await user.clear(area)
    await user.type(area, '4.8213, -76.7324')
    await user.click(screen.getByRole('button', { name: /Convertir/i }))

    expect(await screen.findByText(`${esperado.x.toLocaleString('es-CO', { maximumFractionDigits: 6 })}, ${esperado.y.toLocaleString('es-CO', { maximumFractionDigits: 6 })}`)).toBeInTheDocument()
  })

  test('acepta y produce formato DMS', async () => {
    const user = userEvent.setup()
    render(<ConversorCoordenadas />)
    await user.selectOptions(screen.getByLabelText('Convertir de'), 'dms')
    await user.selectOptions(screen.getByLabelText('A'), 'decimal')

    const area = screen.getByLabelText(/Coordenadas a convertir/i)
    await user.clear(area)
    await user.type(area, '4°29\'16.70"N, 76°43\'56.64"W')
    await user.click(screen.getByRole('button', { name: /Convertir/i }))

    expect(await screen.findByText('1 resultado')).toBeInTheDocument()
    expect(screen.getByText('4,487972, -76,7324')).toBeInTheDocument()
  })

  test('un texto DMS irreconocible se marca como error, no como NaN silencioso', async () => {
    const user = userEvent.setup()
    render(<ConversorCoordenadas />)
    await user.selectOptions(screen.getByLabelText('Convertir de'), 'dms')

    const area = screen.getByLabelText(/Coordenadas a convertir/i)
    await user.clear(area)
    await user.type(area, 'no es DMS, tampoco esto')
    await user.click(screen.getByRole('button', { name: /Convertir/i }))

    expect(await screen.findByText(/No se pudo interpretar como DMS/i)).toBeInTheDocument()
  })
})

describe('ConversorCoordenadas — exportar resultados', () => {
  test('copiar resultados muestra confirmación', async () => {
    // Mismo criterio que Errores.test.tsx: el shim de portapapeles de
    // user-event puede tomar precedencia sobre este mock en jsdom, así que
    // se valida el comportamiento observable, no la llamada interna.
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
      configurable: true,
    })

    const user = userEvent.setup()
    await convertirLote('4.8213, -76.7324')
    await user.click(screen.getByRole('button', { name: /^Copiar$/i }))

    expect(await screen.findByText('✓ Copiado')).toBeInTheDocument()
  })
})
