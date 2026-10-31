import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createElement, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import EmbudosConversion from '@/components/admin/actividad/EmbudosConversion'
import FlujoNavegacion from '@/components/admin/actividad/FlujoNavegacion'

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

vi.mock('@/lib/api', () => ({ default: { get: vi.fn() } }))
import api from '@/lib/api'

const RANGO = { desde: '2026-01-01', hasta: '2026-01-15' }

function conCliente(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}

beforeEach(() => vi.clearAllMocks())

const EMBUDOS = [
  {
    id: 'mapas', titulo: 'De la portada a descargar un mapa',
    pasos: [
      { etiqueta: 'Visita la portada', sesiones: 200, pctDelAnterior: 100, pctDelInicio: 100 },
      { etiqueta: 'Entra a Mapas', sesiones: 100, pctDelAnterior: 50, pctDelInicio: 50 },
      { etiqueta: 'Descarga un mapa', sesiones: 25, pctDelAnterior: 25, pctDelInicio: 13 },
    ],
  },
  {
    id: 'documentos', titulo: 'De la portada a descargar un documento',
    pasos: [
      { etiqueta: 'Visita la portada', sesiones: 0, pctDelAnterior: 0, pctDelInicio: 0 },
      { etiqueta: 'Entra a Documentos', sesiones: 0, pctDelAnterior: 0, pctDelInicio: 0 },
    ],
  },
]

describe('EmbudosConversion', () => {
  test('muestra cada embudo con sus pasos, sesiones y el porcentaje que continúa', async () => {
    vi.mocked(api.get).mockResolvedValue(EMBUDOS)

    conCliente(<EmbudosConversion rango={RANGO} />)

    expect(await screen.findByText('De la portada a descargar un mapa')).toBeInTheDocument()
    expect(screen.getByText('Descarga un mapa')).toBeInTheDocument()
    expect(screen.getByText('200')).toBeInTheDocument()
    expect(screen.getByText('50 % continúa')).toBeInTheDocument()
    expect(screen.getByText('13 % del inicio')).toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls[0][0]).toBe('/analitica/embudos')
  })

  test('un embudo sin sesiones lo dice en vez de mostrar barras vacías', async () => {
    vi.mocked(api.get).mockResolvedValue(EMBUDOS)

    conCliente(<EmbudosConversion rango={RANGO} />)

    expect(await screen.findByText(/Sin sesiones en este recorrido/i)).toBeInTheDocument()
  })

  test('si la API falla muestra el aviso de error', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('500'))

    conCliente(<EmbudosConversion rango={RANGO} />)

    expect(await screen.findByText(/No se pudo cargar/i)).toBeInTheDocument()
  })
})

describe('FlujoNavegacion', () => {
  test('lista de qué página a cuál pasan los visitantes y cuántas veces', async () => {
    vi.mocked(api.get).mockResolvedValue([
      { desde: '/', hacia: '/mapas', veces: 40 },
      { desde: '/mapas', hacia: '/documentos', veces: 12 },
    ])

    conCliente(<FlujoNavegacion rango={RANGO} />)

    expect(await screen.findAllByText('/mapas')).toHaveLength(2)
    expect(screen.getByText('40')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(vi.mocked(api.get).mock.calls[0][0]).toBe('/analitica/flujo-navegacion')
  })

  test('sin transiciones muestra el estado vacío', async () => {
    vi.mocked(api.get).mockResolvedValue([])

    conCliente(<FlujoNavegacion rango={RANGO} />)

    expect(await screen.findByText(/Sin datos/i)).toBeInTheDocument()
  })
})
