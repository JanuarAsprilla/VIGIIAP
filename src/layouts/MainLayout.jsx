import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import FooterBar from '@/components/FooterBar'
import BottomTabs from '@/components/BottomTabs'
import CommandPalette from '@/components/CommandPalette'
import { useUI } from '@/contexts/UIContext'
import { useLenis } from '@/hooks/useLenis'

const DENSITY_PADDING = {
  compact: 'p-2 lg:p-3 pb-20 lg:pb-3',
  normal:  'p-4 lg:p-6 pb-20 lg:pb-6',
  comodo:  'p-6 lg:p-10 pb-20 lg:pb-10',
}

// ── Ambient background orbs (fixed, behind everything) ──
function AmbientBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="orb-1 absolute -top-48 -left-32 w-[500px] h-[500px] rounded-full bg-primary-500/[0.055] blur-[80px]" />
      <div className="orb-2 absolute top-[40%] -right-48 w-[420px] h-[420px] rounded-full bg-primary-400/[0.04] blur-[80px]" />
      <div className="orb-3 absolute -bottom-32 left-[35%] w-[360px] h-[360px] rounded-full bg-gold-400/[0.035] blur-[70px]" />
    </div>
  )
}

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { density, openPalette } = useUI()
  useLenis() // smooth scroll global

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openPalette()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openPalette])

  const isGeovisor = location.pathname === '/geovisor'
  const mainPad = DENSITY_PADDING[density] || DENSITY_PADDING.normal

  return (
    <div className="relative min-h-screen" style={{ background: 'var(--shell-bg)' }}>
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:bg-primary-800 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:shadow-lg"
    >
      Saltar al contenido principal
    </a>
          <AmbientBackground />

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main area — offset by sidebar on desktop */}
      <div className="relative z-10 lg:ml-[210px] min-h-screen flex flex-col">
        <TopBar onMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Page transition wrapper — 3D perspective flip */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 22, rotateX: 3, scale: 0.992 }}
            animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1     }}
            exit={{    opacity: 0, y: -10, rotateX: -1.5, scale: 0.994 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            id="main-content"
            style={{ transformPerspective: 1400, transformOrigin: 'top center' }}
            className={isGeovisor ? 'flex-1' : `flex-1 ${mainPad}`}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        {!isGeovisor && (
          <div className="hidden lg:block relative z-10">
            <FooterBar />
          </div>
        )}
      </div>

      <BottomTabs />
      <CommandPalette />
    </div>
  )
}
