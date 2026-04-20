/**
 * TopBar — orquestador de la barra de navegación superior.
 *
 * Responsabilidad única: gestionar el estado de los paneles,
 * la búsqueda y coordinar los sub-componentes especializados.
 * Ninguna lógica de presentación vive aquí.
 */

import { useState, useRef, useEffect, useCallback } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Bell, Settings, Menu, LogIn,
  ChevronDown, X, HelpCircle, Command,
} from 'lucide-react'
import { useAuth }   from '@/contexts/AuthContext'
import { useSearch } from '@/contexts/SearchContext'
import { useUI }     from '@/contexts/UIContext'
import { useNoticiasList } from '@/hooks/useNoticias'
import { useAdminNotificaciones } from '@/hooks/useNotificaciones'

import SoportePanel        from './topbar/SoportePanel'
import NotificacionesPanel from './topbar/NotificacionesPanel'
import AjustesPanel        from './topbar/AjustesPanel'
import ProfileDropdown     from './topbar/ProfileDropdown'

// ── Constantes de configuración ──

const STORAGE_KEY  = 'vigiiap_notif_read'

const SEARCH_PLACEHOLDERS = {
  '/':            'Buscar módulos, noticias o documentos...',
  '/mapas':       'Buscar mapas, capas o territorios...',
  '/documentos':  'Buscar por nombre, tipo o fecha...',
  '/geovisor':    'Buscar coordenadas, lugar o capa...',
  '/herramientas':'Buscar herramienta o análisis...',
  '/solicitudes': 'Buscar trámites o expedientes...',
  '/noticias':    'Buscar noticias, eventos o autores...',
}

const PAGE_LABELS = {
  '/geovisor': 'Geovisor',
}

// ── Hook: estado de notificaciones leídas persistido en localStorage ──

function useReadNotifications() {
  const [readIds, setReadIds] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(readIds))
    } catch { /* localStorage no disponible — modo privado o sin permisos */ }
  }, [readIds])

  const markRead    = useCallback((id) => setReadIds((prev) => [...new Set([...prev, id])]), [])
  const markAllRead = useCallback((ids) => setReadIds((prev) => [...new Set([...prev, ...ids])]), [])

  return { readIds, markRead, markAllRead }
}

// ── Componente principal ──

export default function TopBar({ onMenuToggle }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { isAuthenticated, user, logout } = useAuth()
  const { openPalette, notifications }     = useUI()
  const { query, setQuery }               = useSearch()

  const placeholder = SEARCH_PLACEHOLDERS[location.pathname] ?? SEARCH_PLACEHOLDERS['/']
  const activeLabel = PAGE_LABELS[location.pathname]

  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [activePanel, setActivePanel]           = useState(null)

  const panelRef    = useRef(null)
  const dropdownRef = useRef(null)

  const { readIds, markRead, markAllRead } = useReadNotifications()

  const isAdmin = user?.rol === 'admin_sig'

  // Admins: notificaciones enriquecidas (usuarios + solicitudes + noticias)
  // Resto: solo últimas noticias
  const { data: adminNotifs } = useAdminNotificaciones(isAdmin && isAuthenticated)
  const { data: noticiaData } = useNoticiasList({ limit: 3, enabled: !isAdmin })

  const notifItems  = isAdmin ? (adminNotifs ?? []) : (noticiaData?.data ?? [])
  const unreadCount = notifItems.filter((n) => !readIds.includes(n.id)).length
  const hasUnread   = notifications && unreadCount > 0

  // Limpiar búsqueda y cerrar mobile search al navegar
  useEffect(() => {
    setQuery('')
    setShowMobileSearch(false)
    setActivePanel(null)
  }, [location.pathname, setQuery])

  // Cerrar paneles al hacer clic fuera o presionar Escape
  useEffect(() => {
    function onMouseDown(e) {
      const outside =
        !panelRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      if (outside) setActivePanel(null)
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') {
        setActivePanel(null)
        setShowMobileSearch(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown',   onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown',   onKeyDown)
    }
  }, [])

  const togglePanel = useCallback(
    (panel) => setActivePanel((prev) => (prev === panel ? null : panel)),
    [],
  )

  const closePanel = useCallback(() => setActivePanel(null), [])

  const handleLogout = useCallback(() => {
    logout()
    setActivePanel(null)
    navigate('/')
  }, [logout, navigate])

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-border">

      {/* ── Fila principal ── */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">

        {/* Izquierda: branding + búsqueda desktop */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuToggle}
            aria-label="Abrir menú de navegación"
            className="lg:hidden p-2 -ml-2 text-text hover:bg-bg-alt rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <span className="lg:hidden text-sm font-bold text-text tracking-wide">VIGIIAP</span>

          <div className="hidden lg:flex items-center gap-3 flex-1">
            <span className="text-sm font-bold text-text tracking-wide shrink-0">VIGIIAP</span>

            {/* Búsqueda contextual por página */}
            <div className="flex items-center gap-2 bg-bg-alt rounded-lg px-3 py-2 flex-1 max-w-sm">
              <Search className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
              <input
                type="text"
                placeholder={placeholder}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label={placeholder}
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

            {/* Acceso rápido al Command Palette */}
            <button
              onClick={openPalette}
              aria-label="Abrir búsqueda global (Cmd+K)"
              title="Búsqueda global"
              className="flex items-center gap-1.5 px-2.5 py-2 bg-bg-alt border border-border rounded-lg text-text-muted hover:text-primary-800 hover:border-primary-300 transition-colors shrink-0"
            >
              <Command className="w-3.5 h-3.5" aria-hidden="true" />
              <kbd className="text-[0.6rem] font-mono font-bold">K</kbd>
            </button>
          </div>
        </div>

        {/* Derecha: acciones y perfil */}
        <div className="flex items-center gap-1 lg:gap-2 ml-4" ref={panelRef}>

          {activeLabel && (
            <span className="hidden md:inline text-sm font-bold text-text border-b-2 border-primary-800 pb-0.5 mr-2">
              {activeLabel}
            </span>
          )}

          {/* Botón de búsqueda móvil */}
          <button
            onClick={() => setShowMobileSearch((v) => !v)}
            aria-label="Buscar"
            aria-expanded={showMobileSearch}
            className={`lg:hidden p-2 rounded-lg transition-colors ${
              showMobileSearch
                ? 'bg-primary-50 text-primary-800'
                : 'text-text-muted hover:text-text hover:bg-bg-alt'
            }`}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>

          {isAuthenticated && (
            <>
              {/* Soporte + Ayuda — solo desktop */}
              <div className="hidden md:flex items-center gap-1">
                <div className="relative">
                  <button
                    onClick={() => togglePanel('soporte')}
                    aria-expanded={activePanel === 'soporte'}
                    aria-haspopup="true"
                    className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      activePanel === 'soporte'
                        ? 'bg-primary-50 text-primary-800 font-semibold'
                        : 'text-text-light hover:text-primary-800 hover:bg-bg-alt font-medium'
                    }`}
                  >
                    Soporte
                  </button>
                  <AnimatePresence>
                    {activePanel === 'soporte' && (
                      <SoportePanel onClose={closePanel} />
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

              {/* Notificaciones */}
              <div className="relative">
                <button
                  onClick={() => togglePanel('notificaciones')}
                  aria-label={`Notificaciones${hasUnread ? `, ${unreadCount} sin leer` : ''}`}
                  aria-expanded={activePanel === 'notificaciones'}
                  aria-haspopup="true"
                  className={`relative p-2 rounded-lg transition-colors ${
                    activePanel === 'notificaciones'
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-text-muted hover:text-text hover:bg-bg-alt'
                  }`}
                >
                  <Bell className="w-5 h-5" aria-hidden="true" />
                  {hasUnread && (
                    <span
                      aria-hidden="true"
                      className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-0.5 bg-orange-500 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center leading-none"
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                <AnimatePresence>
                  {activePanel === 'notificaciones' && (
                    <NotificacionesPanel
                      onClose={closePanel}
                      items={notifItems}
                      readIds={readIds}
                      onMarkRead={markRead}
                      onMarkAllRead={() => markAllRead(notifItems.map((n) => n.id))}
                    />
                  )}
                </AnimatePresence>
              </div>

              {/* Ajustes — solo desktop */}
              <div className="hidden lg:block relative">
                <button
                  onClick={() => togglePanel('ajustes')}
                  aria-label="Ajustes rápidos"
                  aria-expanded={activePanel === 'ajustes'}
                  aria-haspopup="true"
                  className={`p-2 rounded-lg transition-colors ${
                    activePanel === 'ajustes'
                      ? 'bg-primary-50 text-primary-800'
                      : 'text-text-muted hover:text-text hover:bg-bg-alt'
                  }`}
                >
                  <Settings className="w-5 h-5" aria-hidden="true" />
                </button>
                <AnimatePresence>
                  {activePanel === 'ajustes' && (
                    <AjustesPanel onClose={closePanel} />
                  )}
                </AnimatePresence>
              </div>
            </>
          )}

          {/* Avatar / Ingresar */}
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => togglePanel('dropdown')}
                aria-label="Menú de perfil"
                aria-expanded={activePanel === 'dropdown'}
                aria-haspopup="true"
                className="flex items-center gap-2 pl-3 lg:pl-4 border-l border-border"
              >
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-medium text-text leading-tight">{user.name}</span>
                  <span className="block text-[0.7rem] text-text-muted uppercase tracking-wider">{user.role}</span>
                </div>
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{user.initials}</span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted hidden sm:block transition-transform ${activePanel === 'dropdown' ? 'rotate-180' : ''}`}
                  aria-hidden="true"
                />
              </button>
              <AnimatePresence>
                {activePanel === 'dropdown' && (
                  <ProfileDropdown
                    user={user}
                    onClose={closePanel}
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

      {/* ── Fila de búsqueda móvil ── */}
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
                  aria-label={placeholder}
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
