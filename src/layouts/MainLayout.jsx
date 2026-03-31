import { Outlet } from 'react-router-dom'
import Navbar from '@/components/Navbar'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer placeholder — se reemplazará en Tarea 5 */}
      <footer className="bg-primary-900 text-white/60 text-center py-8 text-sm">
        © 2026 IIAP — Instituto de Investigaciones Ambientales del Pacífico
      </footer>
    </div>
  )
}