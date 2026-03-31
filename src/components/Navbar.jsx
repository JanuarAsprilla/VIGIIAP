import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { Search, Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { NAV_LINKS } from '@/lib/constants'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const isHome = location.pathname === '/'

  // Detectar scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Cerrar menú móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // Estilos dinámicos según scroll y página actual
  const navBg = scrolled || !isHome
    ? 'bg-white/95 backdrop-blur-lg shadow-card'
    : 'bg-transparent'

  const textColor = scrolled || !isHome
    ? 'text-primary-800'
    : 'text-white'

  const linkColor = scrolled || !isHome
    ? 'text-text-light hover:text-primary-800'
    : 'text-white/85 hover:text-white'

  const activeLinkColor = scrolled || !isHome
    ? 'text-primary-800 font-semibold'
    : 'text-white font-semibold'

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${navBg} ${
        scrolled ? 'py-2' : 'py-4'
      }`}
    >
      <div className="max-w-350 mx-auto px-6 flex items-center justify-between">
        {/* ── Logo ── */}
        <Link
          to="/"
          className={`flex items-center gap-2 no-underline transition-colors ${textColor}`}
        >
          <div className="w-11 h-11">
            <svg viewBox="0 0 50 50" fill="none" className="w-full h-full">
              <rect
                x="5" y="5" width="40" height="40" rx="5"
                stroke="currentColor" strokeWidth="2"
              />
              <text
                x="50%" y="55%"
                dominantBaseline="middle" textAnchor="middle"
                fill="currentColor" fontSize="16" fontWeight="bold"
              >
                IIAP
              </text>
            </svg>
          </div>
          <span className="font-display text-2xl font-bold tracking-wide">
            VIGIIAP
          </span>
        </Link>

        {/* ── Desktop Navigation ── */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `relative px-4 py-2 rounded-lg text-[0.95rem] font-medium transition-colors duration-200 no-underline ${
                  isActive ? activeLinkColor : linkColor
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {link.label}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-0.5 bg-primary-300 rounded-full"
                      transition={{
                        type: 'spring',
                        stiffness: 380,
                        damping: 30,
                      }}
                    />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>

        {/* ── Right actions ── */}
        <div className="flex items-center gap-3">
          {/* Search box (desktop) */}
          <div
            className={`hidden md:flex items-center rounded-full px-3 py-2 transition-colors ${
              scrolled || !isHome ? 'bg-bg-alt' : 'bg-white/10'
            }`}
          >
            <Search
              className={`w-4 h-4 ${
                scrolled || !isHome ? 'text-text-muted' : 'text-white/70'
              }`}
            />
            <input
              type="text"
              placeholder="Buscar..."
              className={`bg-transparent border-none outline-none px-2 w-36 text-sm font-body ${
                scrolled || !isHome
                  ? 'text-text placeholder:text-text-muted'
                  : 'text-white placeholder:text-white/50'
              }`}
            />
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className={`lg:hidden p-2 rounded-lg transition-colors ${textColor}`}
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden absolute top-full inset-x-0 bg-primary-900 border-t border-white/10"
          >
            <div className="px-6 py-4 flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  className={({ isActive }) =>
                    `px-4 py-3 rounded-lg text-sm font-medium no-underline transition-colors ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}