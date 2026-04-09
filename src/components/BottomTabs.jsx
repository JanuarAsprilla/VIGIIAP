import { NavLink } from 'react-router-dom'
import { Home, Map, FileText, Wrench, PenLine, Lock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/contexts/AuthContext'

const TABS = [
  { icon: Home,     label: 'Inicio',       path: '/',             protected: false },
  { icon: Map,      label: 'Mapas',        path: '/mapas',        protected: true  },
  { icon: FileText, label: 'Documentos',   path: '/documentos',   protected: true  },
  { icon: Wrench,   label: 'Herramientas', path: '/herramientas', protected: true  },
  { icon: PenLine,  label: 'Solicitudes',  path: '/solicitudes',  protected: true  },
]

export default function BottomTabs() {
  const { isAuthenticated, user } = useAuth()
  const canAccess = isAuthenticated && user?.role !== ROLES.PUBLICO

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-border lg:hidden"
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const locked = tab.protected && !canAccess

          if (locked) {
            return (
              <div
                key={tab.path}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px] text-text-muted/40 select-none relative"
                aria-disabled="true"
                title={`${tab.label} — requiere cuenta institucional`}
              >
                <tab.icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[0.6rem] font-bold uppercase tracking-wider">
                  {tab.label}
                </span>
                <Lock className="absolute top-1 right-2 w-2.5 h-2.5 opacity-50" aria-hidden="true" />
              </div>
            )
          }

          return (
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
                  <tab.icon className="w-5 h-5" aria-hidden="true" />
                  <span className={`text-[0.6rem] font-bold uppercase tracking-wider ${isActive ? 'text-white' : ''}`}>
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}
