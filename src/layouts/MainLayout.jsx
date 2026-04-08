import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import FooterBar from '@/components/FooterBar'
import BottomTabs from '@/components/BottomTabs'
import { useUI } from '@/contexts/UIContext'

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
  const { density } = useUI()

  const isGeovisor = location.pathname === '/geovisor'
  const mainPad = DENSITY_PADDING[density] || DENSITY_PADDING.normal

  return (
    <div className="relative min-h-screen bg-bg">
      <AmbientBackground />

      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main area — offset by sidebar on desktop */}
      <div className="relative z-10 lg:ml-[210px] min-h-screen flex flex-col">
        <TopBar onMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Page transition wrapper */}
        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
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
    </div>
  )
}
