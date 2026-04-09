import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, Settings, Menu, LogIn, LogOut,
  ChevronDown, X, Phone, Mail, Clock,
  HelpCircle, ExternalLink, CheckCircle,
  Sun, Monitor, Layers, ClipboardList, BookOpen,
  BellOff, UserCircle,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { useUI } from '@/contexts/UIContext'
import { ALL_NEWS } from '@/lib/constants'

const NOTIF_COUNT = 3
const STORAGE_KEY = 'vigiiap_notif_read'

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

// ── Panel animation preset ──
const panelAnim = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit:    { opacity: 0, y: -6, scale: 0.97 },
  transition: { duration: 0.15, ease: [0.22, 1, 0.36, 1] },
}

// ── Soporte Panel ──
function SoportePanel({ onClose }) {
  return (
    <motion.div
      {...panelAnim}
      className="absolute top-full right-0 mt-2 w-72 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50"
    >
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
    </motion.div>
  )
}

// ── Notificaciones Panel ──
function NotificacionesPanel({ onClose, notifItems, read, setRead }) {
  const unreadCount = notifItems.filter((n) => !read.includes(n.id)).length
  const allRead = unreadCount === 0

  const markAll = () =>
    setRead((prev) => [...new Set([...prev, ...notifItems.map((n) => n.id)])])

  return (
    <motion.div
      {...panelAnim}
      className="absolute top-full right-0 mt-2 w-80 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-text">Notificaciones</p>
          {!allRead && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-orange-500 text-white text-[0.6rem] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {!allRead && (
          <button
            onClick={markAll}
            className="text-xs text-primary-800 hover:text-primary-600 font-semibold transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {/* List or empty state */}
      {allRead ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
            <BellOff className="w-5 h-5 text-primary-800" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-text mb-1">Todo al día</p>
          <p className="text-xs text-text-muted">No tienes notificaciones pendientes.</p>
        </div>
      ) : (
        <div className="divide-y divide-border max-h-72 overflow-y-auto">
          {notifItems.map((n) => {
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
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 transition-colors ${isRead ? 'bg-transparent border border-border' : 'bg-orange-500'}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-[0.65rem] font-bold uppercase tracking-wider mb-0.5 ${isRead ? 'text-text-muted' : 'text-primary-700'}`}>
                    {n.tag}
                  </p>
                  <p className={`text-sm leading-snug line-clamp-2 group-hover:text-primary-800 transition-colors ${isRead ? 'text-text-muted' : 'text-text font-medium'}`}>
                    {n.title}
                  </p>
                  <p className="text-xs text-text-muted mt-1">{n.time}</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Footer */}
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
    </motion.div>
  )
}

// ── Ajustes Panel ──
function AjustesPanel({ onClose }) {
  const { density, setDensity } = useUI()
  const [notifications, setNotifications] = useState(true)

  return (
    <motion.div
      {...panelAnim}
      className="absolute top-full right-0 mt-2 w-64 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50"
    >
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
            aria-pressed={notifications}
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
    </motion.div>
  )
}

// ── Profile Dropdown ──
function ProfileDropdown({ user, onClose, onLogout }) {
  return (
    <motion.div
      {...panelAnim}
      className="absolute top-full right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50"
    >
      {/* User info */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{user.initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate">{user.name}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="py-1">
        <Link
          to="/perfil"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-alt transition-colors no-underline"
        >
          <UserCircle className="w-4 h-4 text-text-muted" aria-hidden="true" />
          Mi Perfil
        </Link>
        <Link
          to="/solicitudes"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-alt transition-colors no-underline"
        >
          <ClipboardList className="w-4 h-4 text-text-muted" aria-hidden="true" />
          Mis Solicitudes
        </Link>
        <Link
          to="/guia-usuario"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-alt transition-colors no-underline"
        >
          <BookOpen className="w-4 h-4 text-text-muted" aria-hidden="true" />
          Guía de Usuario
        </Link>
      </div>

      {/* Logout */}
      <div className="border-t border-border py-1">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors text-left"
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Cerrar Sesión
        </button>
      </div>
    </motion.div>
  )
}

// ── TopBar ──
export default function TopBar({ onMenuToggle }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { query, setQuery } = useSearch()
  const placeholder = SEARCH_PLACEHOLDERS[location.pathname] || SEARCH_PLACEHOLDERS['/']
  const activeLabel = PAGE_LABELS[location.pathname]

  // Mobile search
  const [showMobileSearch, setShowMobileSearch] = useState(false)

  // Notificaciones leídas — persisten en localStorage
  const [read, setRead] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(read))
    } catch { /* storage no disponible */ }
  }, [read])

  const notifItems = ALL_NEWS.slice(0, NOTIF_COUNT)
  const unreadCount = notifItems.filter((n) => !read.includes(n.id)).length
  const hasUnread = unreadCount > 0

  // Panel activo: null | 'dropdown' | 'soporte' | 'notificaciones' | 'ajustes'
  const [activePanel, setActivePanel] = useState(null)
  const panelRef = useRef(null)
  const dropdownRef = useRef(null)

  // Limpiar búsqueda al cambiar de ruta
  useEffect(() => {
    setQuery('')
    setShowMobileSearch(false)
  }, [location.pathname, setQuery])

  // Cerrar panels al clic fuera o Escape
  useEffect(() => {
    function handleClickOutside(e) {
      const insidePanel = panelRef.current?.contains(e.target)
      const insideDropdown = dropdownRef.current?.contains(e.target)
      if (!insidePanel && !insideDropdown) setActivePanel(null)
    }
    function handleKeyDown(e) {
      if (e.key === 'Escape') { setActivePanel(null); setShowMobileSearch(false) }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const togglePanel = (panel) => setActivePanel((prev) => (prev === panel ? null : panel))

  const handleLogout = () => {
    logout()
    setActivePanel(null)
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">
      {/* ── Main row ── */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuToggle}
            aria-label="Abrir menú de navegación"
            className="lg:hidden p-2 -ml-2 text-text hover:bg-bg-alt rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <span className="lg:hidden text-sm font-bold text-text tracking-wide">VIGIIAP</span>

          <div className="hidden lg:flex items-center gap-4 flex-1">
            <span className="text-sm font-bold text-text tracking-wide shrink-0">VIGIIAP</span>
            <div className="flex items-center gap-2 bg-bg-alt rounded-lg px-3 py-2 w-full max-w-md">
              <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
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
                  aria-label="Limpiar búsqueda"
                  className="text-text-muted hover:text-text transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 lg:gap-2 ml-4" ref={panelRef}>
          {activeLabel && (
            <span className="hidden md:inline text-sm font-bold text-text border-b-2 border-primary-800 pb-0.5 mr-2">
              {activeLabel}
            </span>
          )}

          {/* Mobile search button */}
          <button
            onClick={() => setShowMobileSearch((s) => !s)}
            aria-label="Buscar"
            aria-expanded={showMobileSearch}
            className={`lg:hidden p-2 rounded-lg transition-colors ${showMobileSearch ? 'bg-primary-50 text-primary-800' : 'text-text-muted hover:text-text hover:bg-bg-alt'}`}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>

          {isAuthenticated && (
            <>
              {/* Soporte + Ayuda — desktop */}
              <div className="hidden md:flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={() => togglePanel('soporte')}
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${activePanel === 'soporte' ? 'bg-primary-50 text-primary-800 font-semibold' : 'text-text-light hover:text-primary-800 hover:bg-bg-alt font-medium'}`}
                  >
                    Soporte
                  </button>
                  <AnimatePresence>
                    {activePanel === 'soporte' && (
                      <SoportePanel onClose={() => setActivePanel(null)} />
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/guia-usuario"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-text-light hover:text-primary-800 hover:bg-bg-alt transition-colors no-underline"
                >
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Ayuda
                </Link>
              </div>

              {/* Bell */}
              <div className="relative">
                <button
                  onClick={() => togglePanel('notificaciones')}
                  aria-label={`Notificaciones${hasUnread ? `, ${unreadCount} sin leer` : ''}`}
                  aria-expanded={activePanel === 'notificaciones'}
                  className={`relative p-2 rounded-lg transition-colors ${activePanel === 'notificaciones' ? 'bg-primary-50 text-primary-800' : 'text-text-muted hover:text-text hover:bg-bg-alt'}`}
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {hasUnread && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-0.5 bg-orange-500 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center leading-none">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {activePanel === 'notificaciones' && (
                    <NotificacionesPanel
                      onClose={() => setActivePanel(null)}
                      notifItems={notifItems}
                      read={read}
                      setRead={setRead}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Settings */}
              <div className="hidden lg:block relative">
                <button
                  onClick={() => togglePanel('ajustes')}
                  aria-label="Ajustes rápidos"
                  aria-expanded={activePanel === 'ajustes'}
                  className={`p-2 rounded-lg transition-colors ${activePanel === 'ajustes' ? 'bg-primary-50 text-primary-800' : 'text-text-muted hover:text-text hover:bg-bg-alt'}`}
                >
                  <Settings className="w-5 h-5" aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {activePanel === 'ajustes' && (
                    <AjustesPanel onClose={() => setActivePanel(null)} />
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Profile dropdown or Login */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => togglePanel('dropdown')}
                aria-label="Menú de perfil"
                aria-expanded={activePanel === 'dropdown'}
                className="flex items-center gap-2 pl-3 lg:pl-4 border-l border-border"
              >
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-medium text-text leading-tight">{user.name}</span>
                  <span className="block text-[0.7rem] text-text-muted uppercase tracking-wider">{user.role}</span>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{user.initials}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-text-muted hidden sm:block transition-transform ${activePanel === 'dropdown' ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>

              <AnimatePresence>
                {activePanel === 'dropdown' && (
                  <ProfileDropdown
                    user={user}
                    onClose={() => setActivePanel(null)}
                    onLogout={handleLogout}
                  />
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="flex items-center gap-2 pl-3 lg:pl-4 border-l border-border no-underline text-primary-800 hover:text-primary-600 transition-colors"
            >
              <span className="hidden sm:block text-sm font-semibold">Ingresar</span>
              <div className="w-9 h-9 bg-bg-alt rounded-full flex items-center justify-center">
                <LogIn className="w-4.5 h-4.5" aria-hidden="true" />
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* ── Mobile search row ── */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="lg:hidden overflow-hidden border-t border-border"
          >
            <div className="px-4 py-2.5">
              <div className="flex items-center gap-2 bg-bg-alt rounded-lg px-3 py-2">
                <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
                <input
                  type="text"
                  autoFocus
                  placeholder={placeholder}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="bg-transparent border-none outline-none text-sm text-text w-full placeholder:text-text-muted"
                />
                <button
                  onClick={() => { setQuery(''); setShowMobileSearch(false) }}
                  aria-label="Cerrar búsqueda"
                  className="text-text-muted hover:text-text transition-colors shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
