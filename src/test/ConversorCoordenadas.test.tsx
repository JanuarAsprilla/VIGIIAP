import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import ConversorCoordenadas from '@/components/herramientas/ConversorCoordenadas'
import { wgs84ToMagna } from '@/lib/proyeccionMagna'

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

async function convertWgsToMagna(lat: string, lon: string) {
  const user = userEvent.setup()
  render(<ConversorCoordenadas />)
  const latInput = screen.getByLabelText(/Latitud/i)
  const lonInput = screen.getByLabelText(/Longitud/i)
  await user.clear(latInput)
  await user.type(latInput, lat)
  await user.clear(lonInput)
  await user.type(lonInput, lon)
  await user.click(screen.getByRole('button', { name: /Convertir/i }))
  return user
}

describe('ConversorCoordenadas — WGS84 a MAGNA', () => {
  test('convierte coordenadas válidas dentro del territorio colombiano', async () => {
    const expected = wgs84ToMagna(4.8213, -76.7324)
    await convertWgsToMagna('4.8213', '-76.7324')

    expect(await screen.findByText(`${expected.x.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m`)).toBeInTheDocument()
    expect(screen.getByText(`${expected.y.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m`)).toBeInTheDocument()
  })

  test('rechaza una latitud fuera del territorio colombiano', async () => {
    await convertWgsToMagna('50', '-76.7324')
    expect(await screen.findByText('Latitud fuera del territorio colombiano')).toBeInTheDocument()
  })

  test('rechaza una longitud fuera del territorio colombiano', async () => {
    await convertWgsToMagna('4.8213', '10')
    expect(await screen.findByText('Longitud fuera del territorio colombiano')).toBeInTheDocument()
  })

  test('rechaza texto no numérico en vez de calcular con NaN', async () => {
    await convertWgsToMagna('abc', '-76.7324')
    expect(await screen.findByText('Ingresa valores numéricos válidos')).toBeInTheDocument()
  })

  test('una latitud con coma decimal (formato es-CO) da el mismo resultado que con punto', async () => {
    // parseFloat('4,8213') trunca en la coma y devuelve 4 — un error de
    // precisión silencioso (4° en vez de 4.8213°), no un crash, así que hay
    // que comparar el valor numérico real, no solo que no truene.
    const expected = wgs84ToMagna(4.8213, -76.7324)
    await convertWgsToMagna('4,8213', '-76,7324')

    expect(await screen.findByText(`${expected.x.toLocaleString('es-CO', { maximumFractionDigits: 2 })} m`)).toBeInTheDocument()
  })
})

describe('ConversorCoordenadas — MAGNA a WGS84', () => {
  test('convierte X/Y con separador de miles y decimal en formato es-CO', async () => {
    const user = userEvent.setup()
    render(<ConversorCoordenadas />)
    await user.click(screen.getByRole('button', { name: /Magna → WGS84/i }))

    const xInput = screen.getByLabelText(/X — Este/i)
    const yInput = screen.getByLabelText(/Y — Norte/i)
    await user.clear(xInput)
    await user.type(xInput, '1.042.482,50')
    await user.clear(yInput)
    await user.type(yInput, '1.120.943,25')
    await user.click(screen.getByRole('button', { name: /Convertir/i }))

    expect(await screen.findByText('Latitud')).toBeInTheDocument()
  })

  test('rechaza texto no numérico en X', async () => {
    const user = userEvent.setup()
    render(<ConversorCoordenadas />)
    await user.click(screen.getByRole('button', { name: /Magna → WGS84/i }))
    const xInput = screen.getByLabelText(/X — Este/i)
    await user.clear(xInput)
    await user.type(xInput, 'abc')
    await user.click(screen.getByRole('button', { name: /Convertir/i }))

    expect(await screen.findByText('Ingresa valores numéricos válidos')).toBeInTheDocument()
  })
})
