import { NavLink } from 'react-router-dom'
import { Home, Map, FileText, Wrench, PenLine, MoreHorizontal } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants/roles'

// Mapas, Documentos y Herramientas son públicos — cualquiera navega ahí sin
// sesión; el contenido de cada mapa/documento ya trae su propia visibilidad,
// filtrada por el backend. Solicitudes sigue exclusiva de cuenta verificada,
// y a diferencia de las demás ni siquiera se muestra en la barra para quien
// no tiene cuenta — no se lista como tab bloqueado, se oculta directamente.
const TABS = [
  { icon: Home,     label: 'Inicio',       path: '/',             hiddenForUnverified: false },
  { icon: Map,      label: 'Mapas',        path: '/mapas',        hiddenForUnverified: false },
  { icon: FileText, label: 'Documentos',   path: '/documentos',   hiddenForUnverified: false },
  { icon: Wrench,   label: 'Herramientas', path: '/herramientas', hiddenForUnverified: false },
  { icon: PenLine,  label: 'Solicitudes',  path: '/solicitudes',  hiddenForUnverified: true  },
]

// Única navegación primaria en teléfono — antes coexistía con la hamburguesa
// del TopBar (mismos destinos, dos disparadores). "Más" reemplaza esa
// hamburguesa: abre el mismo drawer del Sidebar (Geovisores, Perfil, Ayuda,
// Panel Admin, etc. — todo lo que no cabe en 5 iconos), ahora como
// navegación secundaria/overflow, no como una segunda primaria compitiendo.
export default function BottomTabs({ onMore, moreOpen }: { onMore: () => void; moreOpen: boolean }) {
  const { isAuthenticated, user } = useAuth()
  const isUnverified = user?.isVisitante || user?.role === ROLES.PUBLICO || user?.role === ROLES.VISITANTE
  const isVerified = isAuthenticated && !isUnverified
  const visibleTabs = TABS.filter((tab) => !tab.hiddenForUnverified || isVerified)

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
        {visibleTabs.map((tab) => (
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
        ))}

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
