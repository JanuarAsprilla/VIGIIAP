import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Search, Bell, Settings, Menu, LogIn, LogOut,
  ChevronDown, X, Phone, Mail, Clock,
  HelpCircle, ExternalLink, CheckCircle,
  Sun, Monitor, Layers,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { ALL_NEWS } from '@/lib/constants'

const SEARCH_PLACEHOLDERS = {
  '/': 'Buscar módulos, noticias o documentos...',
  '/mapas': 'Buscar mapas, capas o territorios...',
  '/documentos': 'Buscar por nombre, tipo o fecha...',
  '/geovisor': 'Buscar coordenadas, lugar o capa...',
  '/herramientas': 'Buscar herramienta o análisis...',
  '/solicitudes': 'Buscar trámites o expedientes...',
  '/noticias': 'Buscar noticias, eventos o autores...',
}

const PAGE_LABELS = {
  '/geovisor': 'Geovisor',
}

const NOTIF_COUNT = 3 // cuántas notificaciones mostramos

// ── Soporte Panel ──
function SoportePanel({ onClose }) {
  return (
    <div className="absolute top-full right-0 mt-2 w-72 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-border bg-primary-50">
        <p className="text-sm font-bold text-primary-900">Centro de Soporte IIAP</p>
        <p className="text-xs text-primary-800/70 mt-0.5">Lun–Vie · 8:00 AM – 5:00 PM</p>
      </div>
      <div className="p-4 space-y-3">
        <a
          href="mailto:soportegis@iiap.org.co"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-alt transition-colors no-underline group"
        >
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4 text-primary-800" />
          </div>
          <div>
            <span className="block text-sm font-semibold text-text group-hover:text-primary-800 transition-colors">
              soportegis@iiap.org.co
            </span>
            <span className="block text-xs text-text-muted">Correo electrónico</span>
          </div>
        </a>
        <a
          href="tel:+576042711600"
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-bg-alt transition-colors no-underline group"
        >
          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shrink-0">
            <Phone className="w-4 h-4 text-primary-800" />
          </div>
          <div>
            <span className="block text-sm font-semibold text-text group-hover:text-primary-800 transition-colors">
              (604) 271-1600
            </span>
            <span className="block text-xs text-text-muted">Línea directa IIAP</span>
          </div>
        </a>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-bg-alt">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shrink-0 border border-border">
            <Clock className="w-4 h-4 text-text-muted" />
          </div>
          <div>
            <span className="block text-sm font-semibold text-text">Tiempo de respuesta</span>
            <span className="block text-xs text-text-muted">Máximo 24 horas hábiles</span>
          </div>
        </div>
      </div>
      <div className="px-4 pb-4">
        <Link
          to="/solicitudes"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors no-underline"
        >
          Radicar Solicitud Técnica
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ── Notificaciones Panel ──
function NotificacionesPanel({ onClose, read, setRead }) {
  const markAll = () => setRead(ALL_NEWS.slice(0, NOTIF_COUNT).map((n) => n.id))

  return (
    <div className="absolute top-full right-0 mt-2 w-80 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <p className="text-sm font-bold text-text">Notificaciones</p>
        <button
          onClick={markAll}
          className="text-xs text-primary-800 hover:text-primary-600 font-medium transition-colors"
        >
          Marcar todas como leídas
        </button>
      </div>
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {ALL_NEWS.slice(0, NOTIF_COUNT).map((n) => {
          const isRead = read.includes(n.id)
          return (
            <Link
              key={n.id}
              to={`/noticias/${n.slug}`}
              onClick={() => {
                setRead((prev) => [...new Set([...prev, n.id])])
                onClose()
              }}
              className="flex items-start gap-3 px-4 py-3 hover:bg-bg-alt transition-colors no-underline group"
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 transition-colors ${isRead ? 'bg-border' : 'bg-primary-800'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${isRead ? 'text-text-muted' : 'text-primary-700'}`}>
                  {n.tag}
                </p>
                <p className="text-sm text-text leading-snug line-clamp-2 group-hover:text-primary-800 transition-colors">
                  {n.title}
                </p>
                <p className="text-xs text-text-muted mt-1">{n.time}</p>
              </div>
            </Link>
          )
        })}
      </div>
      <div className="px-4 py-3 border-t border-border">
        <Link
          to="/noticias"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary-800 hover:text-primary-600 transition-colors no-underline"
        >
          Ver todas las noticias
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}

// ── Ajustes Panel ──
function AjustesPanel({ onClose }) {
  const { density, setDensity } = useSearch()
  const [notifications, setNotifications] = useState(true)

  return (
    <div className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50">
      <div className="px-4 py-3 border-b border-border">
        <p className="text-sm font-bold text-text">Ajustes rápidos</p>
      </div>
      <div className="p-4 space-y-4">
        {/* Density */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">
            Densidad del contenido
          </p>
          <div className="flex gap-2">
            {[
              { value: 'compact', label: 'Compacto', Icon: Layers },
              { value: 'normal',  label: 'Normal',   Icon: Monitor },
              { value: 'comodo',  label: 'Cómodo',   Icon: Sun },
            ].map(({ value, label, Icon }) => (
              <button
                key={value}
                onClick={() => setDensity(value)}
                className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border text-[0.65rem] font-bold uppercase tracking-wider transition-colors ${
                  density === value
                    ? 'bg-primary-800 border-primary-800 text-white'
                    : 'border-border text-text-muted hover:border-primary-800 hover:text-primary-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
          <p className="text-[0.65rem] text-text-muted mt-1.5 text-center">
            Ajusta el espaciado del área de contenido
          </p>
        </div>

        {/* Notifications toggle */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Notificaciones</p>
            <p className="text-xs text-text-muted">Alertas de nuevos datos</p>
          </div>
          <button
            onClick={() => setNotifications(!notifications)}
            className={`relative w-10 h-6 rounded-full transition-colors ${notifications ? 'bg-primary-800' : 'bg-border'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${notifications ? 'left-5' : 'left-1'}`}
            />
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 pt-2 border-t border-border">
        <button
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-primary-800 hover:text-primary-600 transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          Listo
        </button>
      </div>
    </div>
  )
}

export default function TopBar({ onMenuToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { query, setQuery } = useSearch()
  const placeholder = SEARCH_PLACEHOLDERS[location.pathname] || SEARCH_PLACEHOLDERS['/']
  const activeLabel = PAGE_LABELS[location.pathname]

  // Notificaciones leídas — persisten mientras el TopBar esté montado
  const [read, setRead] = useState([])
  const hasUnread = read.length < NOTIF_COUNT

  // Panel activo: null | 'dropdown' | 'soporte' | 'notificaciones' | 'ajustes'
  const [activePanel, setActivePanel] = useState(null)
  const panelRef = useRef(null)
  const dropdownRef = useRef(null)

  // Limpiar búsqueda al cambiar de ruta
  useEffect(() => {
    setQuery('')
  }, [location.pathname, setQuery])

  // Cerrar panels al clic fuera
  useEffect(() => {
    function handleClickOutside(e) {
      const insidePanel = panelRef.current?.contains(e.target)
      const insideDropdown = dropdownRef.current?.contains(e.target)
      if (!insidePanel && !insideDropdown) setActivePanel(null)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const togglePanel = (panel) => setActivePanel((prev) => (prev === panel ? null : panel))

  const handleLogout = () => {
    logout()
    setActivePanel(null)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuToggle}
            className="lg:hidden p-2 -ml-2 text-text hover:bg-bg-alt rounded-lg transition-colors"
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
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-text-muted"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="text-text-muted hover:text-text transition-colors shrink-0"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 lg:gap-3 ml-4" ref={panelRef}>
          {activeLabel && (
            <span className="hidden md:inline text-sm font-bold text-text border-b-2 border-primary-800 pb-0.5 mr-1">
              {activeLabel}
            </span>
          )}

          {isAuthenticated && (
            <>
              <div className="hidden md:flex items-center gap-1">
                {/* Soporte */}
                <div className="relative">
                  <button
                    onClick={() => togglePanel('soporte')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${activePanel === 'soporte' ? 'bg-primary-50 text-primary-800 font-semibold' : 'text-text-light hover:text-primary-800 hover:bg-bg-alt font-medium'}`}
                  >
                    Soporte
                  </button>
                  {activePanel === 'soporte' && (
                    <SoportePanel onClose={() => setActivePanel(null)} />
                  )}
                </div>

                {/* Ayuda */}
                <Link
                  to="/guia-usuario"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-light hover:text-primary-800 hover:bg-bg-alt transition-colors no-underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Ayuda
                </Link>
              </div>

              {/* Bell */}
              <div className="relative">
                <button
                  onClick={() => togglePanel('notificaciones')}
                  className={`relative p-2 rounded-lg transition-colors ${activePanel === 'notificaciones' ? 'bg-primary-50 text-primary-800' : 'text-text-muted hover:text-text hover:bg-bg-alt'}`}
                >
                  <Bell className="w-5 h-5" />
                  {hasUnread && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </button>
                {activePanel === 'notificaciones' && (
                  <NotificacionesPanel
                    onClose={() => setActivePanel(null)}
                    read={read}
                    setRead={setRead}
                  />
                )}
              </div>

              {/* Settings */}
              <div className="hidden lg:block relative">
                <button
                  onClick={() => togglePanel('ajustes')}
                  className={`p-2 rounded-lg transition-colors ${activePanel === 'ajustes' ? 'bg-primary-50 text-primary-800' : 'text-text-muted hover:text-text hover:bg-bg-alt'}`}
                >
                  <Settings className="w-5 h-5" />
                </button>
                {activePanel === 'ajustes' && (
                  <AjustesPanel onClose={() => setActivePanel(null)} />
                )}
              </div>
            </>
          )}

          {/* Profile dropdown or Login */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => togglePanel('dropdown')}
                className="flex items-center gap-2 pl-3 lg:pl-4 border-l border-border"
              >
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-medium text-text leading-tight">{user.name}</span>
                  <span className="block text-[0.7rem] text-text-muted uppercase tracking-wider">{user.role}</span>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{user.initials}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-muted hidden sm:block transition-transform ${activePanel === 'dropdown' ? 'rotate-180' : ''}`} />
              </button>

              {activePanel === 'dropdown' && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50">
                  <div className="px-4 py-3 border-b border-border">
                    <p className="text-sm font-semibold text-text">{user.name}</p>
                    <p className="text-xs text-text-muted">{user.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
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
