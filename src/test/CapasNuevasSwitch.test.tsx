import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import CapasNuevasSwitch from '@/components/admin/CapasNuevasSwitch'

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
  return { motion }
})

vi.mock('@/hooks/useConexionesGeoserver', () => ({ useSetCapasNuevasConexionGeoserver: vi.fn() }))
import { useSetCapasNuevasConexionGeoserver } from '@/hooks/useConexionesGeoserver'

const mockHook = (mutateAsync: ReturnType<typeof vi.fn>, isPending = false) =>
  vi.mocked(useSetCapasNuevasConexionGeoserver).mockReturnValue({ mutateAsync, isPending } as unknown as ReturnType<typeof useSetCapasNuevasConexionGeoserver>)

const NOMBRE = /capas nuevas automáticas de la conexión GeoServer IIAP/i
const renderSwitch = (value: boolean) =>
  render(<CapasNuevasSwitch conexionId="c1" conexionNombre="GeoServer IIAP" value={value} />)

beforeEach(() => { vi.clearAllMocks() })

describe('CapasNuevasSwitch', () => {
  test('refleja el valor recibido', () => {
    mockHook(vi.fn())
    renderSwitch(true)
    expect(screen.getByRole('switch', { name: NOMBRE })).toBeChecked()
  })

  test('encender llama al endpoint con true y sin confirmación', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    mockHook(mutateAsync)
    const user = userEvent.setup()
    renderSwitch(false)
    await user.click(screen.getByRole('switch', { name: NOMBRE }))

    expect(mutateAsync).toHaveBeenCalledWith({ id: 'c1', capasNuevasAuto: true })
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  test('apagar pide confirmación y solo llama al confirmar', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({})
    mockHook(mutateAsync)
    const user = userEvent.setup()
    renderSwitch(true)
    await user.click(screen.getByRole('switch', { name: NOMBRE }))

    expect(screen.getByRole('alertdialog')).toHaveTextContent('Las capas nuevas dejarán de aparecer solas en los geovisores de esta conexión')
    expect(mutateAsync).not.toHaveBeenCalled()
    await user.click(screen.getByRole('button', { name: /Sí, apagar/i }))
    expect(mutateAsync).toHaveBeenCalledWith({ id: 'c1', capasNuevasAuto: false })
  })

  test('cancelar la confirmación no llama al endpoint', async () => {
    const mutateAsync = vi.fn()
    mockHook(mutateAsync)
    const user = userEvent.setup()
    renderSwitch(true)
    await user.click(screen.getByRole('switch', { name: NOMBRE }))
    await user.click(screen.getByRole('button', { name: /Cancelar/i }))

    expect(mutateAsync).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  test('Escape cierra la confirmación', async () => {
    mockHook(vi.fn())
    const user = userEvent.setup()
    renderSwitch(true)
    await user.click(screen.getByRole('switch', { name: NOMBRE }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  test('se opera con teclado: Enter sobre el interruptor abre la confirmación', async () => {
    mockHook(vi.fn())
    const user = userEvent.setup()
    renderSwitch(true)
    await user.tab()
    expect(screen.getByRole('switch', { name: NOMBRE })).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('alertdialog')).toBeInTheDocument()
  })

  test('mientras guarda queda deshabilitado y muestra el estado', () => {
    mockHook(vi.fn(), true)
    renderSwitch(true)
    expect(screen.getByRole('switch', { name: NOMBRE })).toBeDisabled()
    expect(screen.getByRole('status', { name: 'Guardando' })).toBeInTheDocument()
  })

  test('si el servidor rechaza, muestra el error', async () => {
    const mutateAsync = vi.fn().mockRejectedValue(new Error('No tienes permiso para esta acción'))
    mockHook(mutateAsync)
    const user = userEvent.setup()
    renderSwitch(false)
    await user.click(screen.getByRole('switch', { name: NOMBRE }))

    expect(await screen.findByRole('alert')).toHaveTextContent('No tienes permiso para esta acción')
  })
})
