import { NavLink } from 'react-router-dom'
import { Home, Map, FileText, Wrench, PenLine, Lock, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants/roles'

const TABS = [
  { icon: Home,     label: 'Inicio',       path: '/',             protected: false },
  { icon: Map,      label: 'Mapas',        path: '/mapas',        protected: true  },
  { icon: FileText, label: 'Documentos',   path: '/documentos',   protected: true  },
  { icon: Wrench,   label: 'Herramientas', path: '/herramientas', protected: true  },
  { icon: PenLine,  label: 'Solicitudes',  path: '/solicitudes',  protected: true  },
]

// Única navegación primaria en teléfono — antes coexistía con la hamburguesa
// del TopBar (mismos destinos, dos disparadores). "Más" reemplaza esa
// hamburguesa: abre el mismo drawer del Sidebar (Geovisor, Perfil, Ayuda,
// Panel Admin, etc. — todo lo que no cabe en 5 iconos), ahora como
// navegación secundaria/overflow, no como una segunda primaria compitiendo.
export default function BottomTabs({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  const { isAuthenticated, user } = useAuth()
  const isUnverified = user?.isVisitante || user?.role === ROLES.PUBLICO || user?.role === ROLES.VISITANTE
  const canAccess = isAuthenticated && !isUnverified

  return (
    <nav
      className="tabs-glass fixed bottom-0 inset-x-0 z-50 md:hidden"
      style={{
        background: 'var(--tabs-bg)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderTop: '1px solid var(--tabs-border)',
        boxShadow: 'inset 0 1px 0 var(--glass-specular)',
      }}
      aria-label="Navegación principal"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {TABS.map((tab) => {
          const locked = tab.protected && !canAccess

          if (locked) {
            return (
              <div
                key={tab.path}
                className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px] select-none relative"
                style={{ color: 'var(--tabs-locked-text)' }}
                aria-disabled="true"
                title={`${tab.label} — requiere cuenta institucional`}
              >
                <tab.icon className="w-5 h-5" aria-hidden="true" />
                <span className="text-[0.6rem] font-bold uppercase tracking-wider">
                  {tab.label}
                </span>
                <Lock className="absolute top-1 right-2 w-2.5 h-2.5 opacity-40" aria-hidden="true" />
              </div>
            )
          }

          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              end={tab.path === '/'}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px] no-underline transition-all duration-200 relative"
              style={({ isActive }) => isActive
                ? { background: 'var(--tabs-active-bg)', color: 'var(--tabs-active-text)' }
                : { color: 'var(--tabs-text)' }
              }
            >
              {({ isActive }) => (
                <>
                  {/* Pip indicator */}
                  {isActive && (
                    <span
                      className="absolute top-1 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full"
                      style={{ background: 'var(--tabs-active-text)', opacity: 0.7 }}
                    />
                  )}
                  <tab.icon
                    className="w-5 h-5 transition-transform duration-200"
                    style={isActive ? { transform: 'scale(1.15)' } : {}}
                    aria-hidden="true"
                  />
                  <span className="text-[0.6rem] font-bold uppercase tracking-wider">
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          )
        })}

        <button
          type="button"
          onClick={onMore}
          aria-label="Más opciones"
          aria-expanded={moreOpen}
          className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-xl min-w-[60px] transition-all duration-200"
          style={moreOpen
            ? { background: 'var(--tabs-active-bg)', color: 'var(--tabs-active-text)' }
            : { color: 'var(--tabs-text)' }
          }
        >
          <MoreHorizontal
            className="w-5 h-5 transition-transform duration-200"
            style={moreOpen ? { transform: 'scale(1.15)' } : {}}
            aria-hidden="true"
          />
          <span className="text-[0.6rem] font-bold uppercase tracking-wider">Más</span>
        </button>
      </div>
    </nav>
  )
}
