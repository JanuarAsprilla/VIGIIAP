import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '@/components/Sidebar'
import TopBar from '@/components/TopBar'
import FooterBar from '@/components/FooterBar'
import BottomTabs from '@/components/BottomTabs'
import { useUI } from '@/contexts/UIContext'

const DENSITY_PADDING = {
  compact: 'flex-1 p-2 lg:p-3 pb-20 lg:pb-3',
  normal:  'flex-1 p-4 lg:p-6 pb-20 lg:pb-6',
  comodo:  'flex-1 p-6 lg:p-10 pb-20 lg:pb-10',
}

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const { density } = useUI()

  // Geovisor uses special layout (no padding, no footer)
  const isGeovisor = location.pathname === '/geovisor'
  const mainClass = DENSITY_PADDING[density] || DENSITY_PADDING.normal

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main area — offset by sidebar on desktop */}
      <div className="lg:ml-[200px] min-h-screen flex flex-col">
        <TopBar onMenuToggle={() => setMobileMenuOpen(true)} />

        <main className={isGeovisor ? 'flex-1' : mainClass}>
          <Outlet />
        </main>

        {/* Footer — hidden on geovisor and mobile */}
        {!isGeovisor && (
          <div className="hidden lg:block">
            <FooterBar />
          </div>
        )}
      </div>

      {/* Bottom tabs — mobile only */}
      <BottomTabs />
    </div>
  )
}