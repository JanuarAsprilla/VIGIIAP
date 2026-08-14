/**
 * VIGIA-IIAP — Sidebar cinematic dual-theme
 * Light (default): editorial blanco con textura verde-sage
 * Dark: dark forest — mapa del Chocó como textura + orbe verde
 */
import { useState } from 'react'
import type { AuthUser } from '@/contexts/AuthContext'
import { NavLink, Link } from 'react-router-dom'
import { PlusCircle, LogOut, X, Sparkles, Lock, Shield, ChevronRight, type LucideIcon } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants/roles'
import { motion, AnimatePresence } from 'framer-motion'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'


const RESTRICTED_PATHS = ['/geovisor', '/herramientas', '/solicitudes']

// ── Animaciones ──────────────────────────────────────────────────────────────
const navContainer = {
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
}
const navItemVariant = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { ease: [0.22, 1, 0.36, 1] as const, duration: 0.38 } },
}

// ── Nav link ─────────────────────────────────────────────────────────────────
function SidebarLink({ link, onClose, userRole, isAuthenticated }: {
  link: { path: string; label: string; icon: LucideIcon }
  onClose: () => void
  userRole: string
  isAuthenticated: boolean
}) {
  const needsInstitutional = RESTRICTED_PATHS.includes(link.path)
  const isLocked = needsInstitutional && (
    !isAuthenticated ||
    userRole === ROLES.VISITANTE ||
    userRole === ROLES.PUBLICO
  )

  if (isLocked) {
    return (
      <motion.div variants={navItemVariant}>
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm select-none cursor-not-allowed"
          style={{ color: 'var(--nav-text-locked)', background: 'var(--nav-locked-bg, rgba(0,0,0,0.03))' }}>
          <link.icon className="w-[16px] h-[16px] shrink-0 opacity-35" aria-hidden="true" />
          <span className="truncate opacity-50">{link.label}</span>
          <span className="ml-auto flex items-center gap-1 shrink-0">
            <Lock className="w-2.5 h-2.5 opacity-35" aria-hidden="true" />
          </span>
        </div>
      </motion.div>
    )
  }

  return (
    <NavLink to={link.path} end={link.path === '/'} onClick={onClose} className="block no-underline">
      {({ isActive }) => (
        <motion.div variants={navItemVariant} className="relative">
          {/* Pill activa — glow verde */}
          {isActive && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 rounded-xl"
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              style={{
                background: 'linear-gradient(135deg, var(--nav-active-pill) 0%, var(--nav-active-pill) 100%)',
                backdropFilter: 'blur(8px) saturate(160%)',
                WebkitBackdropFilter: 'blur(8px) saturate(160%)',
                border: '1px solid var(--nav-active-border)',
                boxShadow: '0 0 20px rgba(0,152,70,0.10), inset 0 1px 0 var(--glass-specular)',
              }}
            />
          )}
          {/* Indicador lateral activo */}
          {isActive && (
            <motion.div
              layoutId="nav-indicator"
              className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-full"
              style={{ background: 'linear-gradient(180deg, #4ade80, #009846)' }}
              transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            />
          )}

          <div
            className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
              isActive ? '' : 'hover:bg-[var(--nav-hover-bg)]'
            }`}
            style={{ color: isActive ? 'var(--nav-active-text)' : 'var(--nav-text-muted)' }}
          >
            <motion.div
              whileHover={{ scale: 1.16, rotate: isActive ? 0 : -8 }}
              transition={{ type: 'spring', stiffness: 520, damping: 18 }}
            >
              <link.icon
                className="w-[16px] h-[16px] shrink-0 transition-colors"
                style={{ color: isActive ? 'var(--nav-indicator-from)' : undefined }}
                aria-hidden="true"
              />
            </motion.div>
            <span
              className="truncate transition-colors"
              style={{ color: isActive ? 'var(--nav-active-text)' : undefined }}
            >
              {link.label}
            </span>
            {isActive && (
              <motion.span
                className="ml-auto w-1.5 h-1.5 rounded-full shrink-0"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.16, type: 'spring' }}
                style={{ background: 'var(--nav-indicator-from)', boxShadow: '0 0 6px rgba(74,222,128,0.4)' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </NavLink>
  )
}

// ── User card ─────────────────────────────────────────────────────────────────
function UserMiniCard({ user }: { user: AuthUser }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
      className="mx-3 mt-2 mb-0.5"
    >
      <div
        className="flex items-center gap-2.5 p-2.5 rounded-xl"
        style={{
          background: 'var(--nav-user-card-bg)',
          backdropFilter: 'blur(10px) saturate(160%)',
          WebkitBackdropFilter: 'blur(10px) saturate(160%)',
          border: '1px solid var(--nav-user-card-border)',
          boxShadow: 'inset 0 1px 0 var(--glass-specular)',
        }}
      >
        <div className="relative shrink-0">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shadow-sm"
            style={{ background: 'var(--brand-gradient)' }}
          >
            <span className="text-white text-xs font-bold">{user.initials}</span>
          </div>
          <span
            className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
            style={{ background: '#4ade80', borderColor: 'var(--nav-online-ring)' }}
            aria-label="En línea"
          />
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-xs font-bold truncate leading-tight"
            style={{ color: 'var(--nav-user-name)' }}
          >
            {user.name}
          </p>
          <p
            className="text-[0.6rem] uppercase tracking-wider truncate"
            style={{ color: 'var(--nav-user-role)' }}
          >
            {user.role}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Contenido del sidebar ─────────────────────────────────────────────────────
function SidebarInner({ onClose, onOpenModal, onLogout, user, isAuthenticated }: {
  onClose: () => void
  onOpenModal: () => void
  onLogout: () => void
  user: AuthUser | null
  isAuthenticated: boolean
}) {
  return (
    <div className="flex flex-col h-full relative z-10">

      {/* ── Logo area ── */}
      <div
        className="relative px-4 pt-5 pb-4 overflow-hidden"
        style={{ borderBottom: '1px solid var(--nav-separator)' }}
      >
        {/* SVG topo pattern — algo más visible en dark */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 'var(--nav-topo-opacity)' }}
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="topo-nav" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="14" fill="none" stroke="var(--nav-topo-stroke)" strokeWidth="0.8" />
              <circle cx="20" cy="20" r="8"  fill="none" stroke="var(--nav-topo-stroke)" strokeWidth="0.6" />
              <circle cx="20" cy="20" r="3"  fill="none" stroke="var(--nav-topo-stroke)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo-nav)" />
        </svg>

        <div className="relative flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5 no-underline group">
            <motion.div
              whileHover={{ scale: 1.06, rotate: -3 }}
              transition={{ type: 'spring', stiffness: 420, damping: 18 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shrink-0"
              style={{
                background: 'var(--brand-gradient)',
                boxShadow: '0 0 16px var(--nav-logo-glow)',
              }}
            >
              <span className="text-white font-black text-sm font-display">V</span>
            </motion.div>

            <div className="leading-tight">
              <span
                className="block text-sm font-bold tracking-wide transition-colors"
                style={{ color: 'var(--nav-text)' }}
              >
                VIGIA-IIAP
              </span>
              <span
                className="block text-[0.58rem] uppercase tracking-wider"
                style={{ color: 'var(--nav-user-role)' }}
              >
                Chocó Biogeográfico
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--nav-close-text)' }}
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── User mini card — solo cuando hay sesión ── */}
      {isAuthenticated && user && <UserMiniCard user={user} />}

      {/* ── Navegación ── */}
      <nav aria-label="Navegación principal" className="flex-1 py-3 px-3 overflow-y-auto">
        <p
          className="px-3 pb-2 text-[0.6rem] font-bold uppercase tracking-[0.22em]"
          style={{ color: 'var(--nav-section-label)' }}
        >
          Módulos
        </p>

        <motion.div
          variants={navContainer}
          initial="initial"
          animate="animate"
          className="space-y-0.5"
        >
          {NAV_LINKS.map((link) => (
            <SidebarLink
              key={link.path}
              link={link}
              onClose={onClose}
              userRole={user?.role ?? ''}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </motion.div>
      </nav>

      {/* ── Acciones inferiores ── */}
      <div
        className="p-3 space-y-1.5"
        style={{ borderTop: '1px solid var(--nav-separator)' }}
      >
        {/* Sin sesión */}
        {!isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
          >
            <Link
              to="/login"
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: 'var(--brand-gradient)',
                color: '#ffffff',
                boxShadow: '0 4px 14px rgba(0,152,70,0.30)',
              }}
            >
              <Shield className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Iniciar sesión</span>
              <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" aria-hidden="true" />
            </Link>
          </motion.div>
        )}

        {/* Con sesión */}
        <AnimatePresence>
          {isAuthenticated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] as const }}
              className="space-y-1.5"
            >
              {/* Panel Admin */}
              {user?.role === ROLES.ADMIN && (
                <Link
                  to="/admin"
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold no-underline transition-all mb-1"
                  style={{
                    background: 'rgba(176,203,31,0.1)',
                    border: '1px solid rgba(176,203,31,0.25)',
                    color: '#d9f99d',
                  }}
                >
                  <Shield className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Panel Admin</span>
                  <span
                    className="ml-auto text-[0.52rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: 'rgba(176,203,31,0.2)', color: '#d9f99d' }}
                  >
                    SIG
                  </span>
                </Link>
              )}

              {/* Visitante */}
              {user?.isVisitante ? (
                <Link
                  to="/solicitar-acceso"
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold no-underline transition-all hover:opacity-90 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #F7AC42, #E07030)',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(247,172,66,0.30)',
                  }}
                >
                  <Lock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Solicitar acceso</span>
                  <ChevronRight className="w-3.5 h-3.5 ml-auto shrink-0" aria-hidden="true" />
                </Link>
              ) : (
                /* Nuevo Análisis */
                <motion.button
                  onClick={onOpenModal}
                  whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(0,152,70,0.4)' }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="btn-shimmer w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-white text-sm font-semibold"
                  style={{
                    background: 'var(--brand-gradient)',
                    boxShadow: '0 4px 18px rgba(0,152,70,0.28)',
                  }}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" style={{ color: '#bbf7d0' }} aria-hidden="true" />
                  <span>Nuevo Análisis</span>
                  <PlusCircle className="w-3.5 h-3.5 ml-auto shrink-0" style={{ color: '#86efac' }} aria-hidden="true" />
                </motion.button>
              )}

              {/* Cerrar sesión */}
              <motion.button
                onClick={onLogout}
                whileHover={{ x: 3 }}
                whileTap={{ x: 0 }}
                transition={{ type: 'spring', stiffness: 400 }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors"
                style={{ color: 'var(--nav-logout-text)' }}
                onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--nav-logout-text)'; e.currentTarget.style.background = 'transparent' }}
              >
                <LogOut className="w-[16px] h-[16px] shrink-0" aria-hidden="true" />
                <span>Cerrar Sesión</span>
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Fondo ambiental — compartido por desktop y mobile (antes duplicado) ──────
function SidebarAmbientBackground() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, var(--nav-dot-grid) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          opacity: 0.7,
        }}
      />
      <div
        className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, var(--nav-orb-color) 0%, transparent 70%)',
        }}
      />
    </>
  )
}

// ── Export principal ──────────────────────────────────────────────────────────
export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { isAuthenticated, user, logout } = useAuth()
  const [showModal, setShowModal] = useState(false)

  const handleLogout = () => {
    logout()
    onClose?.()
  }

  const innerProps = {
    onClose,
    onOpenModal: () => setShowModal(true),
    onLogout: handleLogout,
    user,
    isAuthenticated,
  }

  /* Superficie estructural: material pesado (Apple: darker/heavier materials
     separate structural regions). Sin backdrop-filter — no hay contenido detrás
     que difuminar (el layout usa ml-[210px], no stacking), pero el filo
     especular superior sí comunica "vidrio" en una superficie sólida. */
  const sidebarStyle = {
    background: 'var(--nav-bg)',
    borderRight: '1px solid var(--nav-border)',
    boxShadow: 'inset -1px 0 0 var(--glass-specular), inset 0 1px 0 var(--glass-specular)',
  }

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[210px] flex-col z-40 overflow-hidden"
        style={sidebarStyle}
      >
        <SidebarAmbientBackground />
        <SidebarInner {...innerProps} />
      </aside>

      {/* Mobile — flota sobre el contenido real con scrim: aquí el glass sí tiene algo detrás que difuminar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 backdrop-blur-md lg:hidden"
              style={{ background: 'var(--nav-overlay-bg)' }}
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed top-0 left-0 bottom-0 w-[240px] z-50 flex flex-col overflow-hidden lg:hidden"
              style={{ ...sidebarStyle, backdropFilter: 'blur(28px) saturate(180%)', WebkitBackdropFilter: 'blur(28px) saturate(180%)' }}
            >
              <SidebarAmbientBackground />
              <SidebarInner {...innerProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && <NuevoAnalisisModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  )
}
