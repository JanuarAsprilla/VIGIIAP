import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const datos = vi.hoisted(() => ({ usuario: null as unknown }))
vi.mock('@/contexts/AuthContext', () => ({ useAuth: () => ({ user: datos.usuario, isAuthenticated: true, initializing: false }) }))

import { RequireModulo } from '@/components/RequireAuth'

function montar() {
  render(
    <MemoryRouter initialEntries={['/admin/biodiversidad-datos']}>
      <Routes>
        <Route path="/admin" element={<p>panel</p>} />
        <Route element={<RequireModulo modulo="biodiversidad_datos" />}>
          <Route path="/admin/biodiversidad-datos" element={<p>página del módulo</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireModulo', () => {
  test('un admin_sig sin el módulo vuelve al panel', () => {
    datos.usuario = { rol: 'admin_sig', modulos: [{ modulo: 'usuarios', puede_ver: true, puede_editar: true }] }
    montar()
    expect(screen.getByText('panel')).toBeInTheDocument()
    expect(screen.queryByText('página del módulo')).not.toBeInTheDocument()
  })
  test('un admin_sig con el módulo en «ver» entra', () => {
    datos.usuario = { rol: 'admin_sig', modulos: [{ modulo: 'biodiversidad_datos', puede_ver: true, puede_editar: false }] }
    montar()
    expect(screen.getByText('página del módulo')).toBeInTheDocument()
  })
  test('el super administrador entra siempre', () => {
    datos.usuario = { rol: 'super_admin' }
    montar()
    expect(screen.getByText('página del módulo')).toBeInTheDocument()
  })
})
