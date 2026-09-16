import { useState, useEffect } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import FooterBar from '@/components/FooterBar'
import BottomTabs from '@/components/BottomTabs'
import CommandPalette from '@/components/CommandPalette'
import RecuperarPasswordPanel from '@/components/auth/RecuperarPasswordPanel'
import SolicitarAccesoPanel from '@/components/auth/SolicitarAccesoPanel'
import { useUI, type Density } from '@/contexts/UIContext'
import { useLenis } from '@/hooks/useLenis'

type AuthModal = 'recuperar' | 'solicitar' | null

// pb-20 compensa la altura del BottomTabs fijo — solo hace falta por debajo
// de md, que es donde BottomTabs sigue visible (ver breakpoint compartido
// con Sidebar/TopBar: tablet en adelante usa el sidebar persistente, no la
// barra inferior).
const DENSITY_PADDING: Record<Density, string> = {
  compact:     'p-2 md:p-3 pb-20 md:pb-3',
  normal:      'p-4 md:p-6 pb-20 md:pb-6',
  comfortable: 'p-6 md:p-10 pb-20 md:pb-10',
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
  const [authModal, setAuthModal] = useState<AuthModal>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { density, openPalette } = useUI()
  useLenis() // smooth scroll global

  // Global keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        openPalette()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [openPalette])

  const isGeovisores = location.pathname === '/geovisores'

  // /recuperar-password y /solicitar-acceso (ver src/pages/auth/) ya no son
  // páginas propias — reenvían aquí con state.openAuthModal para abrir el
  // panel centrado correspondiente en vez de mostrar una pantalla aparte.
  useEffect(() => {
    const state = location.state as { openAuthModal?: 'recuperar' | 'solicitar' } | null
    if (!state?.openAuthModal) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- solo corre cuando llega el redirect, no en cada render
    setAuthModal(state.openAuthModal)
    navigate(location.pathname + location.search, { replace: true, state: {} })
  }, [location.state, location.pathname, location.search, navigate])

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

      {/* Main area — offset by sidebar desde tablet (md) en adelante */}
      <div className="relative z-10 md:ml-[210px] min-h-screen flex flex-col">
        <TopBar />

        {/* Page transition wrapper — 3D perspective flip */}
        <AnimatePresence mode="sync" initial={false}>
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 22, rotateX: 3, scale: 0.992 }}
            animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1     }}
            exit={{    opacity: 0, y: -10, rotateX: -1.5, scale: 0.994 }}
            transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
            id="main-content"
            style={{ transformPerspective: 1400, transformOrigin: 'top center' }}
            className={isGeovisores ? 'flex-1' : `flex-1 ${mainPad}`}
          >
            <Outlet />
          </motion.main>
        </AnimatePresence>

        {!isGeovisores && (
          <div className="hidden md:block relative z-10">
            <FooterBar />
          </div>
        )}
      </div>

      <BottomTabs onMore={() => setMobileMenuOpen(true)} moreOpen={mobileMenuOpen} />
      <CommandPalette />

      <AnimatePresence>
        {authModal === 'recuperar' && <RecuperarPasswordPanel key="recuperar" onClose={() => setAuthModal(null)} />}
        {authModal === 'solicitar' && <SolicitarAccesoPanel key="solicitar" onClose={() => setAuthModal(null)} />}
      </AnimatePresence>
    </div>
  )
}
