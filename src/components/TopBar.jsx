import { Link, useLocation } from 'react-router-dom'
import { Search, Bell, Settings, Menu, LogIn } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const SEARCH_PLACEHOLDERS = {
  '/': 'Buscar mapas, veredas o documentos...',
  '/mapas': 'Buscar mapas, capas o territorios...',
  '/documentos': 'Buscar por nombre, tipo o fecha...',
  '/geovisor': 'Buscar coordenadas, lugar o capa...',
  '/herramientas': 'Buscar herramienta o capa...',
  '/solicitudes': 'Buscar trámites o expedientes...',
}

const PAGE_LABELS = {
  '/geovisor': 'Geovisor',
}

export default function TopBar({ onMenuToggle }) {
  const location = useLocation()
  const { isAuthenticated, user } = useAuth()
  const placeholder = SEARCH_PLACEHOLDERS[location.pathname] || SEARCH_PLACEHOLDERS['/']
  const activeLabel = PAGE_LABELS[location.pathname]

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-text hover:bg-bg-alt rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <span className="lg:hidden text-sm font-bold text-text tracking-wide">VIGIIAP</span>

          <div className="hidden lg:flex items-center gap-4 flex-1">
            <span className="text-sm font-bold text-text tracking-wide shrink-0">VIGIIAP</span>
            <div className="flex items-center gap-2 bg-bg-alt rounded-lg px-3 py-2 w-full max-w-md">
              <Search className="w-4 h-4 text-text-muted shrink-0" />
              <input
                type="text"
                placeholder={placeholder}
                className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-text-muted"
              />
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 lg:gap-4 ml-4">
          {activeLabel && (
            <span className="hidden md:inline text-sm font-bold text-text border-b-2 border-primary-800 pb-0.5">
              {activeLabel}
            </span>
          )}

          <div className="hidden md:flex items-center gap-4 text-sm">
            <a href="#" className="text-text-light hover:text-primary-800 no-underline transition-colors">Soporte</a>
            <a href="#" className="text-text-light hover:text-primary-800 no-underline transition-colors">Ayuda</a>
          </div>

          <button className="relative p-2 text-text-muted hover:text-text hover:bg-bg-alt rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>

          <button className="hidden lg:flex p-2 text-text-muted hover:text-text hover:bg-bg-alt rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* User profile or login button */}
          {isAuthenticated ? (
            <button className="flex items-center gap-2.5 pl-3 lg:pl-4 border-l border-border">
              <div className="text-right hidden sm:block">
                <span className="block text-sm font-medium text-text leading-tight">
                  {user.name}
                </span>
                <span className="block text-[0.7rem] text-text-muted uppercase tracking-wider">
                  {user.role}
                </span>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white text-sm font-bold">{user.initials}</span>
              </div>
            </button>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 pl-3 lg:pl-4 border-l border-border no-underline text-primary-800 hover:text-primary-600 transition-colors"
            >
              <span className="hidden sm:block text-sm font-semibold">Ingresar</span>
              <div className="w-9 h-9 bg-bg-alt rounded-full flex items-center justify-center">
                <LogIn className="w-4.5 h-4.5" />
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}