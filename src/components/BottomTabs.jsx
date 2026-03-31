import { NavLink } from 'react-router-dom'
import { Home, Map, FileText, Wrench, PenLine } from 'lucide-react'

const tabs = [
  { icon: Home, label: 'Inicio', path: '/' },
  { icon: Map, label: 'Mapas', path: '/mapas' },
  { icon: FileText, label: 'Documentos', path: '/documentos' },
  { icon: Wrench, label: 'Herramientas', path: '/herramientas' },
  { icon: PenLine, label: 'Solicitudes', path: '/solicitudes' },
]

export default function BottomTabs() {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.path === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px] no-underline transition-colors ${
                isActive
                  ? 'bg-primary-800 text-white'
                  : 'text-text-muted hover:text-primary-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className="w-5 h-5" />
                <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${
                  isActive ? 'text-white' : ''
                }`}>
                  {tab.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}