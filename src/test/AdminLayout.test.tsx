import { describe, test, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createElement, type ReactNode } from 'react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import AdminLayout from '@/layouts/AdminLayout'

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

vi.mock('@/components/AdminSidebar', () => ({
  default: ({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) => (
    <div>
      <span>AdminSidebar: {mobileOpen ? 'abierto' : 'cerrado'}</span>
      <button onClick={onClose}>Cerrar sidebar</button>
    </div>
  ),
}))
vi.mock('@/components/TopBar', () => ({
  default: ({ onMenuToggle }: { onMenuToggle: () => void }) => (
    <button onClick={onMenuToggle}>Abrir menú móvil</button>
  ),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

function renderAdminLayout() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<div>Contenido del panel</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('AdminLayout — orquestación del panel admin', () => {
  test('renderiza la barra superior, el sidebar y el contenido de la ruta anidada', () => {
    renderAdminLayout()
    expect(screen.getByText('AdminSidebar: cerrado')).toBeInTheDocument()
    expect(screen.getByText('Contenido del panel')).toBeInTheDocument()
    expect(screen.getByText('Panel de Administración — VIGIA-IIAP')).toBeInTheDocument()
  })

  test('abrir el menú móvil desde TopBar refleja el estado en AdminSidebar', async () => {
    const user = userEvent.setup()
    renderAdminLayout()
    await user.click(screen.getByText('Abrir menú móvil'))
    expect(screen.getByText('AdminSidebar: abierto')).toBeInTheDocument()
  })

  test('cerrar el sidebar vuelve a colapsarlo', async () => {
    const user = userEvent.setup()
    renderAdminLayout()
    await user.click(screen.getByText('Abrir menú móvil'))
    await user.click(screen.getByText('Cerrar sidebar'))
    expect(screen.getByText('AdminSidebar: cerrado')).toBeInTheDocument()
  })

  test('REGRESIÓN: el contenedor del contenido no atrapa los niveles de apilamiento, para que los modales queden sobre la barra lateral', () => {
    // La barra lateral es `fixed z-40`. Si el contenedor del contenido crea su propio contexto (z-index, transform,
    // filter...), el `fixed z-50` de cualquier modal del panel queda confinado dentro de él y la barra lo tapa: el modal
    // «Nuevo geovisor» salía con los primeros píxeles de su borde izquierdo bajo la barra.
    const { container } = renderAdminLayout()
    const contenido = screen.getByText('Contenido del panel').closest('main')!.parentElement!
    expect(contenido.className).toContain('md:ml-[220px]')
    expect(contenido.className).not.toMatch(/(^|\s)(-?z-|isolate|transform|filter|backdrop|will-change)/)
    expect(contenido.getAttribute('style') ?? '').not.toMatch(/z-index|transform|filter|will-change/)
    expect(container).toBeTruthy()
  })
})
