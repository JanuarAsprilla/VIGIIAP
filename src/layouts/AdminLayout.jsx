import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import AdminSidebar from '@/components/AdminSidebar'
import TopBar from '@/components/TopBar'

export default function AdminLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  return (
    <div className="relative min-h-screen bg-bg">
      {/* Ambient admin orbs — tono más oscuro/rojo para distinguir */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-primary-900/[0.06] blur-[80px] orb-1" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-primary-800/[0.04] blur-[80px] orb-2" />
      </div>

      <AdminSidebar mobileOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />

      <div className="relative z-10 lg:ml-[220px] min-h-screen flex flex-col">
        <TopBar onMenuToggle={() => setMobileMenuOpen(true)} />

        {/* Admin indicator bar */}
        <div className="bg-primary-900 px-6 py-1.5 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[0.65rem] font-bold uppercase tracking-widest text-white/60">
            Panel de Administración — VIGIIAP
          </span>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 p-4 lg:p-6"
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  )
}
