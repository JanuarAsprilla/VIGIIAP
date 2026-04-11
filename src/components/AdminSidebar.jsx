import { NavLink, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, Users, ClipboardList, Newspaper,
  FileText, Map, Settings, Activity, X,
  LogOut, Globe, Shield,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

const NAV_SECTIONS = [
  {
    label: 'Panel',
    links: [
      { label: 'Dashboard',    path: '/admin',             icon: LayoutDashboard, end: true },
    ],
  },
  {
    label: 'Gestión',
    links: [
      { label: 'Usuarios',     path: '/admin/usuarios',    icon: Users },
      { label: 'Solicitudes',  path: '/admin/solicitudes', icon: ClipboardList },
      { label: 'Noticias',     path: '/admin/noticias',    icon: Newspaper },
      { label: 'Documentos',   path: '/admin/documentos',  icon: FileText },
      { label: 'Mapas',        path: '/admin/mapas',       icon: Map },
    ],
  },
  {
    label: 'Sistema',
    links: [
      { label: 'Configuración', path: '/admin/configuracion', icon: Settings },
      { label: 'Actividad',     path: '/admin/actividad',     icon: Activity },
    ],
  },
]

const navContainer = {
  animate: { transition: { staggerChildren: 0.045, delayChildren: 0.06 } },
}
const navItem = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0, transition: { ease: [0.22, 1, 0.36, 1], duration: 0.35 } },
}

function AdminNavLink({ link }) {
  return (
    <NavLink to={link.path} end={link.end} className="block no-underline">
      {({ isActive }) => (
        <motion.div variants={navItem} className="relative">
          {isActive && (
            <motion.div
              layoutId="admin-nav-pill"
              className="absolute inset-0 bg-primary-800 rounded-xl"
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            />
          )}
          <div className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${
            isActive ? 'text-white' : 'text-text-light hover:text-text hover:bg-bg-alt'
          }`}>
            <motion.div
              whileHover={{ scale: 1.15, rotate: isActive ? 0 : -6 }}
              transition={{ type: 'spring', stiffness: 500, damping: 18 }}
            >
              <link.icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-white' : 'text-text-muted group-hover:text-primary-700'
                }`}
                aria-hidden="true"
              />
            </motion.div>
            <span className="truncate">{link.label}</span>
            {isActive && (
              <motion.span
                className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-300 shrink-0"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.15 }}
              />
            )}
          </div>
        </motion.div>
      )}
    </NavLink>
  )
}

function SidebarContent({ onClose, onLogout, user }) {
  return (
    <div className="flex flex-col h-full">

      {/* ── Header ── */}
      <div className="relative overflow-hidden px-4 pt-5 pb-4 border-b border-border/60">
        {/* Topographic pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.05]" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <defs>
            <pattern id="topo-admin" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="14" fill="none" stroke="#1B4332" strokeWidth="1"/>
              <circle cx="20" cy="20" r="8"  fill="none" stroke="#1B4332" strokeWidth="0.8"/>
              <circle cx="20" cy="20" r="3"  fill="none" stroke="#1B4332" strokeWidth="0.6"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#topo-admin)"/>
        </svg>

        <div className="relative flex items-center justify-between">
          <Link to="/admin" onClick={onClose} className="flex items-center gap-2.5 no-underline group">
            <motion.div
              whileHover={{ scale: 1.06, rotate: -2 }}
              transition={{ type: 'spring', stiffness: 400, damping: 18 }}
              className="relative w-9 h-9 bg-gradient-to-br from-primary-700 to-primary-950 rounded-xl flex items-center justify-center shadow-sm shrink-0"
            >
              <Shield className="w-4 h-4 text-white" aria-hidden="true" />
            </motion.div>
            <div className="leading-tight">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-bold text-text tracking-wide group-hover:text-primary-800 transition-colors">
                  VIGIIAP
                </span>
                <span className="text-[0.55rem] font-bold uppercase tracking-wider bg-primary-800 text-white px-1.5 py-0.5 rounded-full">
                  Admin
                </span>
              </div>
              <span className="block text-[0.6rem] text-text-muted uppercase tracking-wider">
                Panel de Control
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
      <nav className="flex-1 py-3 px-3 overflow-y-auto space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            <p className="px-3 pb-1.5 text-[0.58rem] font-bold uppercase tracking-[0.14em] text-text-muted/60">
              {section.label}
            </p>
            <motion.div
              variants={navContainer}
              initial="initial"
              animate="animate"
              className="space-y-0.5"
            >
              {section.links.map((link) => (
                <AdminNavLink key={link.path} link={link} />
              ))}
            </motion.div>
          </div>
        ))}
      </nav>

      {/* ── Bottom ── */}
      <div className="p-3 space-y-1.5 border-t border-border/60">
        {/* Volver al sitio */}
        <Link
          to="/"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-text-light hover:text-primary-800 hover:bg-primary-50 transition-colors no-underline border border-border"
        >
          <Globe className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Volver al Sitio</span>
        </Link>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-2.5 px-3 py-2">
            <div className="w-7 h-7 bg-gradient-to-br from-primary-600 to-primary-900 rounded-lg flex items-center justify-center shrink-0">
              <span className="text-white text-[0.65rem] font-bold">{user.initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-text truncate">{user.name}</p>
              <p className="text-[0.6rem] text-text-muted truncate">{user.role}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <motion.button
          onClick={onLogout}
          whileHover={{ x: 3 }}
          transition={{ type: 'spring', stiffness: 400 }}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-text-muted hover:text-orange-500 hover:bg-orange-500/5 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Cerrar Sesión</span>
        </motion.button>
      </div>
    </div>
  )
}

export default function AdminSidebar({ mobileOpen, onClose }) {
  const { user, logout } = useAuth()

  const handleLogout = () => { logout(); onClose?.() }

  const props = { onClose, onLogout: handleLogout, user }

  return (
    <>
      {/* Desktop */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[220px] bg-white border-r border-border flex-col z-40">
        <SidebarContent {...props} />
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
              <SidebarContent {...props} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
