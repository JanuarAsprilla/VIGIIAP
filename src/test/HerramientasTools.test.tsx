import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import CalculadoraAreas from '@/components/herramientas/CalculadoraAreas'
import GeneradorBuffers from '@/components/herramientas/GeneradorBuffers'
import AnalizadorSuperposicion from '@/components/herramientas/AnalizadorSuperposicion'
import Geoformularios from '@/components/herramientas/Geoformularios'
import AplicacionesMoviles from '@/components/herramientas/AplicacionesMoviles'
import ResumenActividad from '@/components/herramientas/ResumenActividad'

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

const { authMock } = vi.hoisted(() => ({ authMock: { user: null as { rol: string } | null } }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => authMock }))
vi.mock('@/hooks/useStats', () => ({ useAdminStats: vi.fn() }))
import { useAdminStats } from '@/hooks/useStats'

describe('CalculadoraAreas', () => {
  test('el botón calcular está deshabilitado sin una capa seleccionada', () => {
    render(<CalculadoraAreas />)
    expect(screen.getByRole('button', { name: /Calcular Geometría/i })).toBeDisabled()
  })

  test('calcular una capa muestra el área y perímetro convertidos en hectáreas', async () => {
    const user = userEvent.setup()
    render(<CalculadoraAreas />)
    await user.selectOptions(screen.getByLabelText('Capa de Entrada'), 'reserva')
    await user.click(screen.getByRole('button', { name: /Calcular Geometría/i }))

    expect(screen.getByText('Calculando...')).toBeInTheDocument()
    expect(await screen.findByText('48.320,7 ha', undefined, { timeout: 2000 })).toBeInTheDocument()
    expect(screen.getByText('892.4 km')).toBeInTheDocument()
  })

  test('cambiar la unidad a km² convierte el área usando el factor correcto', async () => {
    const user = userEvent.setup()
    render(<CalculadoraAreas />)
    await user.selectOptions(screen.getByLabelText('Capa de Entrada'), 'lote')
    await user.selectOptions(screen.getByLabelText('Sistema de Unidades'), 'km2')
    await user.click(screen.getByRole('button', { name: /Calcular Geometría/i }))

    expect(await screen.findByText('32,72 km²', undefined, { timeout: 2000 })).toBeInTheDocument()
  })

  test('cambiar de capa tras un resultado lo limpia', async () => {
    const user = userEvent.setup()
    render(<CalculadoraAreas />)
    await user.selectOptions(screen.getByLabelText('Capa de Entrada'), 'lote')
    await user.click(screen.getByRole('button', { name: /Calcular Geometría/i }))
    expect(await screen.findByText(/km$/, undefined, { timeout: 2000 })).toBeInTheDocument()

    await user.selectOptions(screen.getByLabelText('Capa de Entrada'), 'amort')
    expect(screen.queryByText('Resultado del Cálculo')).not.toBeInTheDocument()
  })
})

describe('GeneradorBuffers y AnalizadorSuperposicion — placeholders "en desarrollo"', () => {
  test('GeneradorBuffers anuncia que está en desarrollo', () => {
    render(<GeneradorBuffers />)
    expect(screen.getByText('Generador de Buffers')).toBeInTheDocument()
    expect(screen.getByText('En desarrollo')).toBeInTheDocument()
  })

  test('AnalizadorSuperposicion anuncia que está en desarrollo', () => {
    render(<AnalizadorSuperposicion />)
    expect(screen.getByText('Analizador de Superposición')).toBeInTheDocument()
    expect(screen.getByText('En desarrollo')).toBeInTheDocument()
  })
})

describe('Geoformularios', () => {
  test('el selector de tipo de observación es controlado', async () => {
    const user = userEvent.setup()
    render(<Geoformularios />)
    const select = screen.getByLabelText('Tipo de observación')
    await user.selectOptions(select, 'fauna')
    expect(select).toHaveValue('fauna')
  })
})

describe('AplicacionesMoviles', () => {
  test('distingue apps "En desarrollo" de "Planificado"', () => {
    render(<AplicacionesMoviles />)
    expect(screen.getAllByText('En desarrollo')).toHaveLength(2)
    expect(screen.getByText('Planificado')).toBeInTheDocument()
  })

  test('lista las plataformas de cada app', () => {
    render(<AplicacionesMoviles />)
    expect(screen.getByText('VIGIA-IIAP Offline')).toBeInTheDocument()
    expect(screen.getAllByText('iOS').length).toBeGreaterThan(0)
  })
})

describe('ResumenActividad', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    authMock.user = null
    vi.mocked(useAdminStats).mockReturnValue({
      data: { documentos: 42, solicitudesPendientes: 5 },
      isLoading: false,
    } as unknown as ReturnType<typeof useAdminStats>)
  })

  test('mientras carga, muestra el spinner', () => {
    vi.mocked(useAdminStats).mockReturnValue({ data: undefined, isLoading: true } as unknown as ReturnType<typeof useAdminStats>)
    authMock.user = { rol: 'admin_sig' }

    const { container } = render(<ResumenActividad />)
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  test('un usuario no-admin ve el mensaje de estadísticas restringidas, no las cifras', () => {
    authMock.user = { rol: 'investigador' }
    render(<ResumenActividad />)
    expect(screen.getByText('Estadísticas disponibles para administradores.')).toBeInTheDocument()
    expect(screen.queryByText('42')).not.toBeInTheDocument()
  })

  test('un admin_sig ve las cifras reales de documentos y solicitudes', () => {
    authMock.user = { rol: 'admin_sig' }
    render(<ResumenActividad />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  test('un super_admin también ve las cifras reales, igual que admin_sig', () => {
    authMock.user = { rol: 'super_admin' }
    render(<ResumenActividad />)
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
