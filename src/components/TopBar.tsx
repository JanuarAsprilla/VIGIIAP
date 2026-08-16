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
  ChevronDown, X, HelpCircle, Command, Sun, Moon,
  type LucideIcon,
} from 'lucide-react'
import { useAuth }   from '@/contexts/AuthContext'
import { ROLES }     from '@/lib/constants/roles'
import { useTheme }  from '@/contexts/ThemeContext'
import { useSearch } from '@/contexts/SearchContext'
import { useUI }     from '@/contexts/UIContext'
import { useAdminNotificaciones } from '@/hooks/useNotificaciones'

import SoportePanel        from './topbar/SoportePanel'
import NotificacionesPanel from './topbar/NotificacionesPanel'
import AjustesPanel        from './topbar/AjustesPanel'
import ProfileDropdown     from './topbar/ProfileDropdown'
import AvatarBadge         from './ui/AvatarBadge'

// ── Constantes de configuración ──

const STORAGE_KEY  = 'vigiiap_notif_read'

const SEARCH_PLACEHOLDERS = {
  '/':            'Buscar módulos, documentos...',
  '/mapas':       'Buscar mapas, capas o territorios...',
  '/documentos':  'Buscar por nombre, tipo o fecha...',
  '/geovisor':    'Buscar coordenadas, lugar o capa...',
  '/herramientas':'Buscar herramienta o análisis...',
  '/solicitudes': 'Buscar trámites o expedientes...',
}

const PAGE_LABELS = {
  '/geovisor': 'Geovisor',
}

// ── Hook: estado de notificaciones leídas persistido en localStorage ──

function useReadNotifications() {
  const [readIds, setReadIds] = useState<string[]>(() => {
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

  const markRead    = useCallback((id: string) => setReadIds((prev) => [...new Set([...prev, id])]), [])
  const markAllRead = useCallback((ids: string[]) => setReadIds((prev) => [...new Set([...prev, ...ids])]), [])

  return { readIds, markRead, markAllRead }
}

// ── Botón de ícono — soporte/notificaciones/ajustes compartían el mismo
//    patrón de estado activo repetido 3 veces; centralizado aquí ──
function TopBarIconButton({ active, icon: Icon, label, badge, onClick, ariaLabel }: {
  active: boolean
  icon: LucideIcon
  label?: string
  badge?: number
  onClick: () => void
  ariaLabel: string
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      aria-expanded={active}
      aria-haspopup="true"
      className={`relative flex items-center gap-1.5 rounded-lg text-sm font-medium transition-all ${label ? 'px-3 py-1.5' : 'p-2'}`}
      style={{
        color: active ? 'var(--topbar-icon-on)' : 'var(--topbar-icon-off)',
        background: active ? (label ? 'var(--topbar-icon-on-bg2)' : 'var(--topbar-icon-on-bg)') : 'transparent',
      }}
    >
      <Icon className={label ? 'w-3.5 h-3.5' : 'w-[18px] h-[18px]'} aria-hidden="true" />
      {label}
      {!!badge && (
        <AvatarBadge
          variant="count"
          count={badge}
          ringColor="var(--color-bg)"
          label={`${badge} sin leer`}
        />
      )}
    </button>
  )
}

// ── Campo de búsqueda — compartido entre la fila desktop y la fila mobile,
//    antes duplicado casi al carácter ──
function TopBarSearchInput({ value, onChange, placeholder, autoFocus, onClear, showPaletteHint, onOpenPalette, className = '' }: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoFocus?: boolean
  onClear: () => void
  showPaletteHint?: boolean
  onOpenPalette?: () => void
  className?: string
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 ${className}`}
      style={{ background: 'var(--topbar-search-bg)', border: '1px solid var(--topbar-search-border)' }}
    >
      <Search className="w-[18px] h-[18px] shrink-0" style={{ color: 'var(--topbar-icon-off)' }} aria-hidden="true" />
      <input
        type="text"
        autoFocus={autoFocus}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        className="topbar-search bg-transparent border-none outline-none text-sm w-full"
        style={{ color: 'var(--topbar-text)' }}
      />
      {value ? (
        <button onClick={onClear} aria-label="Limpiar búsqueda" className="text-text-muted hover:text-text transition-colors shrink-0">
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      ) : showPaletteHint ? (
        <button
          onClick={onOpenPalette}
          aria-label="Abrir búsqueda global (Cmd+K)"
          title="Búsqueda global"
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-md transition-colors shrink-0"
          style={{ background: 'var(--topbar-search-border)', color: 'var(--topbar-icon-off)' }}
        >
          <Command className="w-3 h-3" aria-hidden="true" />
          <kbd className="text-[0.55rem] font-mono font-bold">K</kbd>
        </button>
      ) : null}
    </div>
  )
}

// ── Componente principal ──

export default function TopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const location  = useLocation()
  const navigate  = useNavigate()
  const { isAuthenticated, user, logout, isAdmin } = useAuth()
  const { openPalette, notifications }     = useUI()
  const { query, setQuery }               = useSearch()
  const { isDark, toggleTheme }           = useTheme()

  const placeholder = (SEARCH_PLACEHOLDERS as Record<string, string>)[location.pathname] ?? (SEARCH_PLACEHOLDERS as Record<string, string>)['/']
  const activeLabel = (PAGE_LABELS as Record<string, string>)[location.pathname]

  type PanelName = 'soporte' | 'notificaciones' | 'ajustes' | 'dropdown'

  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [activePanel, setActivePanel]           = useState<PanelName | null>(null)

  const panelRef    = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { readIds, markRead, markAllRead } = useReadNotifications()

  const isUnverified = user?.isVisitante || user?.role === ROLES.PUBLICO || user?.role === ROLES.VISITANTE

  const { data: adminNotifs } = useAdminNotificaciones(isAdmin && isAuthenticated)

  const notifItems = isAdmin ? (adminNotifs ?? []) : []
  const unreadCount = notifItems.filter((n) => !readIds.includes(n.id)).length
  const hasUnread   = notifications && unreadCount > 0

  // Limpiar búsqueda y cerrar mobile search al navegar — reset intencional al cambiar de ruta
  useEffect(() => {
    setQuery('')
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setShowMobileSearch(false)
    setActivePanel(null)
  }, [location.pathname, setQuery])

  // Cerrar paneles al hacer clic fuera o presionar Escape
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      const outside =
        !panelRef.current?.contains(e.target as Node) &&
        !dropdownRef.current?.contains(e.target as Node)
      if (outside) setActivePanel(null)
    }
    function onKeyDown(e: KeyboardEvent) {
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
    (panel: PanelName) => setActivePanel((prev) => (prev === panel ? null : panel)),
    [],
  )

  const closePanel = useCallback(() => setActivePanel(null), [])

  const handleLogout = useCallback(() => {
    logout()
    setActivePanel(null)
    navigate('/')
  }, [logout, navigate])

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'var(--topbar-bg)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid var(--topbar-border)',
        boxShadow: 'inset 0 1px 0 var(--glass-specular)',
      }}
    >

      {/* ── Fila principal ── */}
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">

        {/* Izquierda: branding + búsqueda desktop */}
        <div className="flex items-center gap-3 flex-1">
          <button
            onClick={onMenuToggle}
            aria-label="Abrir menú de navegación"
            className="lg:hidden p-2 -ml-2 rounded-lg transition-colors" style={{color:"var(--topbar-icon-off)"}}
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>

          <span className="lg:hidden text-sm font-bold tracking-wide" style={{color:"var(--topbar-text)"}}>VIGIA-IIAP</span>

          {/* Sin branding propio en desktop — el Sidebar ya lo muestra siempre visible; repetirlo aquí era redundante */}
          <div className="hidden lg:flex items-center gap-3 flex-1">
            {/* Búsqueda contextual por página */}
            <TopBarSearchInput
              className="flex-1 max-w-sm"
              value={query}
              onChange={setQuery}
              placeholder={placeholder}
              onClear={() => setQuery('')}
              showPaletteHint
              onOpenPalette={openPalette}
            />
          </div>
        </div>

        {/* Derecha: acciones y perfil */}
        <div className="flex items-center gap-1 lg:gap-2 ml-4" ref={panelRef}>

          {activeLabel && (
            <span className="hidden md:inline text-sm font-bold pb-0.5 mr-2" style={{color:"var(--topbar-text)",borderBottom:"2px solid var(--topbar-active-ul)"}}>
              {activeLabel}
            </span>
          )}

          {/* Botón de búsqueda móvil */}
          <button
            onClick={() => setShowMobileSearch((v) => !v)}
            aria-label="Buscar"
            aria-expanded={showMobileSearch}
            className="lg:hidden p-2 rounded-lg transition-colors" style={{color: showMobileSearch ? "var(--topbar-icon-on)" : "var(--topbar-icon-off)"}}
          >
            <Search className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* ── Theme toggle — visible para todos ── */}
          <motion.button
            onClick={toggleTheme}
            aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            whileTap={{ scale: 0.88 }}
            className="relative p-2 rounded-lg overflow-hidden transition-colors"
            style={{
              color: isDark ? 'var(--topbar-icon-on)' : 'var(--topbar-icon-off)',
              background: isDark ? 'var(--topbar-icon-on-bg)' : 'transparent',
              border: '1px solid',
              borderColor: isDark ? 'var(--topbar-search-border)' : 'transparent',
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              {isDark ? (
                <motion.span
                  key="sun"
                  initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="flex"
                >
                  <Sun className="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
                </motion.span>
              ) : (
                <motion.span
                  key="moon"
                  initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                  transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                  className="flex"
                >
                  <Moon className="w-[1.125rem] h-[1.125rem]" aria-hidden="true" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {isAuthenticated && !isUnverified && (
            <>
              {/* Soporte + Ayuda — solo desktop */}
              <div className="hidden md:flex items-center gap-1">
                <div className="relative">
                  <TopBarIconButton
                    active={activePanel === 'soporte'}
                    icon={HelpCircle}
                    label="Soporte"
                    ariaLabel="Soporte"
                    onClick={() => togglePanel('soporte')}
                  />
                  <AnimatePresence>
                    {activePanel === 'soporte' && (
                      <SoportePanel onClose={closePanel} />
                    )}
                  </AnimatePresence>
                </div>

                <Link
                  to="/guia-usuario"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium no-underline transition-colors" style={{color:"var(--topbar-icon-off)"}}
                >
                  <HelpCircle className="w-3.5 h-3.5" aria-hidden="true" />
                  Ayuda
                </Link>
              </div>

              {/* Notificaciones */}
              <div className="relative">
                <TopBarIconButton
                  active={activePanel === 'notificaciones'}
                  icon={Bell}
                  badge={hasUnread ? unreadCount : undefined}
                  ariaLabel={`Notificaciones${hasUnread ? `, ${unreadCount} sin leer` : ''}`}
                  onClick={() => togglePanel('notificaciones')}
                />
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
                <TopBarIconButton
                  active={activePanel === 'ajustes'}
                  icon={Settings}
                  ariaLabel="Ajustes rápidos"
                  onClick={() => togglePanel('ajustes')}
                />
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
                className="flex items-center gap-2 pl-3 lg:pl-4" style={{borderLeft:"1px solid var(--topbar-sep)"}}
              >
                <div className="text-right hidden sm:block">
                  <span className="block text-sm font-medium leading-tight" style={{color:"var(--topbar-text)"}}>{user?.name}</span>
                  <span className="block text-[0.7rem] uppercase tracking-wider" style={{color:"var(--topbar-icon-on)"}}>{user?.role}</span>
                </div>
                <div className="relative w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-white text-sm font-bold">{user?.initials}</span>
                  <AvatarBadge variant="dot" ringColor="var(--color-bg)" label="Sesión activa" />
                </div>
                <ChevronDown
                  className={`w-4 h-4 hidden sm:block transition-transform ${activePanel === 'dropdown' ? 'rotate-180' : ''}`} style={{color:"var(--topbar-icon-off)"}}
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
              className="flex items-center gap-2 pl-3 lg:pl-4 no-underline"
              style={{borderLeft:"1px solid var(--topbar-sep)"}}
            >
              <span
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90 active:scale-[0.97]"
                style={{ background: 'var(--brand-gradient)', color: '#fff', boxShadow: '0 2px 10px rgba(0,152,70,0.25)' }}
              >
                <LogIn className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Ingresar</span>
              </span>
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
            className="lg:hidden overflow-hidden" style={{borderTop:"1px solid var(--topbar-border)"}}
          >
            <div className="px-4 py-2.5">
              <TopBarSearchInput
                value={query}
                onChange={setQuery}
                placeholder={placeholder}
                autoFocus
                onClear={() => { setQuery(''); setShowMobileSearch(false) }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
