import { Search, Bell, Settings, Menu } from 'lucide-react'

export default function TopBar({ onMenuToggle }) {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* ── Left side ── */}
        <div className="flex items-center gap-3 flex-1">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-text hover:bg-bg-alt rounded-lg transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Mobile logo — shown instead of search on small screens */}
          <span className="lg:hidden text-sm font-bold text-text tracking-wide">
            VIGIIAP
          </span>

          {/* Search — desktop */}
          <div className="hidden lg:flex items-center gap-2 bg-bg-alt rounded-lg px-3 py-2 w-full max-w-md">
            <Search className="w-4 h-4 text-text-muted shrink-0" />
            <input
              type="text"
              placeholder="Buscar mapas, veredas o documentos..."
              className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-text-muted"
            />
          </div>
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-2 lg:gap-4 ml-4">
          {/* Support links — desktop only */}
          <div className="hidden md:flex items-center gap-4 text-sm">
            <a href="#" className="text-text-light hover:text-primary-800 no-underline transition-colors">
              Soporte
            </a>
            <a href="#" className="text-text-light hover:text-primary-800 no-underline transition-colors">
              Ayuda
            </a>
          </div>

          {/* Bell */}
          <button className="relative p-2 text-text-muted hover:text-text hover:bg-bg-alt rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>

          {/* Settings — desktop only */}
          <button className="hidden lg:flex p-2 text-text-muted hover:text-text hover:bg-bg-alt rounded-lg transition-colors">
            <Settings className="w-5 h-5" />
          </button>

          {/* User profile */}
          <button className="flex items-center gap-2.5 pl-3 lg:pl-4 border-l border-border">
            <div className="text-right hidden sm:block">
              <span className="block text-sm font-medium text-text leading-tight">
                Analista Territorial
              </span>
              <span className="block text-[0.7rem] text-text-muted uppercase tracking-wider">
                Región Pacífico
              </span>
            </div>
            <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shrink-0">
              <span className="text-white text-sm font-bold">AT</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  )
}