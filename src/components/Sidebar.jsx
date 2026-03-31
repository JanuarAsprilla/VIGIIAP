import { NavLink, Link } from 'react-router-dom'
import { PlusCircle, Settings, LogOut, X } from 'lucide-react'
import { NAV_LINKS } from '@/lib/constants'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar({ mobileOpen, onClose }) {
  const sidebarContent = (
    <>
      {/* ── Logo ── */}
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 no-underline" onClick={onClose}>
          <div className="w-9 h-9 bg-primary-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <div className="leading-tight">
            <span className="block text-sm font-bold text-text tracking-wide">
              VIGIIAP
            </span>
            <span className="block text-[0.65rem] text-text-muted uppercase tracking-wider">
              Chocó Biogeográfico
            </span>
          </div>
        </Link>

        {/* Close button — only mobile */}
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            end={link.path === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-colors ${
                isActive
                  ? 'bg-primary-50 text-primary-800 border border-primary-200'
                  : 'text-text-light hover:bg-bg-alt hover:text-text border border-transparent'
              }`
            }
          >
            <link.icon className="w-[18px] h-[18px] shrink-0" />
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* ── Bottom actions ── */}
      <div className="p-3 border-t border-border space-y-1">
        <button className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
          <PlusCircle className="w-4 h-4" />
          <span>Nuevo Análisis</span>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-text-light hover:bg-bg-alt transition-colors">
          <Settings className="w-[18px] h-[18px]" />
          <span>Configuración</span>
        </button>

        <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-orange-500 hover:bg-orange-500/5 transition-colors">
          <LogOut className="w-[18px] h-[18px]" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* ── Desktop Sidebar (always visible >= 1024px) ── */}
      <aside className="hidden lg:flex fixed top-0 left-0 bottom-0 w-[200px] bg-white border-r border-border flex-col z-40">
        {sidebarContent}
      </aside>

      {/* ── Mobile Drawer (< 1024px) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/40 lg:hidden"
              onClick={onClose}
            />

            {/* Drawer */}
            <motion.aside
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-[240px] bg-white z-50 flex flex-col shadow-float lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}