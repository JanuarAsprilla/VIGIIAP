import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { PlusCircle, LogOut, X, Sparkles } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import { useAuth } from '@/contexts/AuthContext'
import { motion, AnimatePresence } from 'framer-motion'
import NuevoAnalisisModal from '@/components/NuevoAnalisisModal'

// ── Stagger presets ──
const navContainer = {
  animate: { transition: { staggerChildren: 0.05, delayChildren: 0.08 } },
}
const navItemVariant = {
  initial: { opacity: 0, x: -14 },
  animate: { opacity: 1, x: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.4 } },
}

// ── Single nav link with animated pill + icon micro-anim ──
function SidebarLink({ link, onClose }) {
  return (
    <NavLink to={link.path} end={link.path === '/'} onClick={onClose} className="block no-underline">
      {({ isActive }) => (
        <motion.div variants={navItemVariant} className="relative">
          {/* Animated background pill — shared layoutId slides between items */}
          {isActive && (
            <motion.div
              layoutId="nav-pill"
              className="absolute inset-0 bg-primary-800 rounded-xl"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}

          <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
            isActive ? 'text-white' : 'text-text-light hover:text-text hover:bg-bg-alt'
          }`}>
            <motion.div
              whileHover={{ scale: 1.18, rotate: isActive ? 0 : -8 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            >
              <link.icon
                className={`w-[17px] h-[17px] shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-text-muted group-hover:text-primary-700'
                }`}
                aria-hidden="true"
              />
            </motion.div>
            <span className="truncate">{link.label}</span>

            {/* Active accent dot */}
            {isActive && (
              <motion.span
                className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-300 shrink-0"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.18, type: 'spring' }}
              />
            )}
          </div>
        </motion.div>
      )}
    </NavLink>
  )
}

// ── User mini card ──
function UserMiniCard({ user }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      className="mx-3 mt-2.5 mb-0.5"
    >
      <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100/50 border border-primary-200/70">
        <div className="flex items-center gap-2.5">
          <div className="relative shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-900 rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white text-xs font-bold">{user.initials}</span>
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white"
              aria-label="En línea"
            />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-primary-900 truncate leading-tight">{user.name}</p>
            <p className="text-[0.6rem] text-primary-700/70 uppercase tracking-wider truncate">{user.role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ── Sidebar inner content (stateless, receives all props) ──
function SidebarInner({ onClose, onOpenModal, onLogout, user, isAuthenticated }) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Logo area ── */}
      <div className="relative overflow-hidden px-4 pt-5 pb-4 border-b border-border/60">
        {/* Subtle topographic circles texture */}
        <svg
          className="absolute inset-0 w-full h-full opacity-[0.05]"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <defs>
            <pattern id="topo" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="14" fill="none" stroke="#1B4332" strokeWidth="1"/>
              <circle cx="20" cy="20" r="8"  fill="none" stroke="#1B4332" strokeWidth="0.8"/>
              <circle cx="20" cy="20" r="3"  fill="none" stroke="#1B4332" strokeWidth="0.6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo)"/>
        </svg>

        <div className="relative flex items-center justify-between">
          <Link to="/" onClick={onClose} className="flex items-center gap-2.5 no-underline group">
            {/* Gradient logo mark */}
            <motion.div
              whileHover={{ scale: 1.06, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-900 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            >
              <span className="text-white font-bold text-sm font-display">V</span>
            </motion.div>

            <div className="leading-tight">
              <span className="block text-sm font-bold text-text tracking-wide group-hover:text-primary-800 transition-colors">
                VIGIIAP
              </span>
              <span className="block text-[0.6rem] text-text-muted uppercase tracking-wider">
                Chocó Biogeográfico
              </span>
            </div>
          </Link>

          <button
            onClick={onClose}
            className="lg:hidden p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"
            aria-label="Cerrar menú"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-3 px-3 overflow-y-auto">
        <p className="px-3 pb-2 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-text-muted/60">
          Módulos
        </p>

        <motion.div
          variants={navContainer}
          initial="initial"
          animate="animate"
          className="space-y-0.5"
        >
          {NAV_LINKS.map((link) => (
            <SidebarLink key={link.path} link={link} onClose={onClose} />
          ))}
        </motion.div>
      </nav>

      {/* ── Bottom actions ── */}
      <AnimatePresence>
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="p-3 space-y-1 border-t border-border/60"
          >
            {/* Nuevo Análisis — shimmer gradient button */}
            <div className="relative overflow-hidden rounded-xl">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-700 to-primary-900" aria-hidden="true" />
              <motion.button
                onClick={onOpenModal}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                className="btn-shimmer relative w-full flex items-center gap-2 px-3 py-2.5 text-white text-sm font-semibold"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary-200 shrink-0" aria-hidden="true" />
                <span>Nuevo Análisis</span>
                <PlusCircle className="w-3.5 h-3.5 ml-auto text-primary-300 shrink-0" aria-hidden="true" />
              </motion.button>
            </div>

            {/* Cerrar sesión */}
            <motion.button
              onClick={onLogout}
              whileHover={{ x: 4 }}
              whileTap={{ x: 0 }}
              transition={{ type: 'spring', stiffness: 400 }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-orange-500 hover:bg-orange-500/5 transition-colors"
            >
              <LogOut className="w-[17px] h-[17px] shrink-0" aria-hidden="true" />
              <span>Cerrar Sesión</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main export ──
export default function Sidebar({ mobileOpen, onClose }) {
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

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[210px] bg-white border-r border-border flex-col z-40">
        <SidebarInner {...innerProps} />
      </aside>

      {/* Mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              key="drawer"
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed top-0 left-0 bottom-0 w-[240px] bg-white z-50 flex flex-col shadow-float lg:hidden"
            >
              <SidebarInner {...innerProps} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <NuevoAnalisisModal onClose={() => setShowModal(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
