import { Outlet } from 'react-router-dom'

export default function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar irá aquí en la Tarea 4 */}
      <header className="fixed top-0 inset-x-0 z-50 bg-primary-800 text-white py-4 px-6">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <span className="font-display text-xl font-bold tracking-wide">VIGIIAP</span>
          <nav className="hidden md:flex gap-6 text-sm">
            <a href="/" className="text-white/80 hover:text-white no-underline">Inicio</a>
            <a href="/mapas" className="text-white/80 hover:text-white no-underline">Mapas</a>
            <a href="/documentos" className="text-white/80 hover:text-white no-underline">Documentos</a>
            <a href="/geovisor" className="text-white/80 hover:text-white no-underline">Geovisor</a>
            <a href="/herramientas" className="text-white/80 hover:text-white no-underline">Herramientas</a>
            <a href="/solicitudes" className="text-white/80 hover:text-white no-underline">Solicitudes</a>
          </nav>
        </div>
      </header>

      {/* Page content — each module renders here */}
      <main className="flex-1 pt-16">
        <Outlet />
      </main>

      {/* Footer placeholder — se reemplazará en Tarea 5 */}
      <footer className="bg-primary-900 text-white/60 text-center py-8 text-sm">
        © 2026 IIAP — Instituto de Investigaciones Ambientales del Pacífico
      </footer>
    </div>
  )
}