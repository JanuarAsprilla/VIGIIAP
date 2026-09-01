import { Link } from 'react-router-dom'
import {
  UserCircle, ClipboardList, BookOpen, LogOut,
  ShieldCheck, Lock, LayoutDashboard, CheckCircle2,
  type LucideIcon,
} from 'lucide-react'
import { panelAnim } from './panelAnim'
import { ROLES } from '@/lib/constants/roles'
import type { AuthUser } from '@/contexts/AuthContext'
import GlassPanel from '@/components/ui/GlassPanel'
import AvatarBadge from '@/components/ui/AvatarBadge'
import Avatar from '@/components/ui/Avatar'

function RoleBadge({ user }: { user: AuthUser | null }) {
  const isUnverified = user?.isVisitante || user?.role === ROLES.PUBLICO || user?.role === ROLES.VISITANTE
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN
  const isAdmin      = user?.role === ROLES.ADMIN || isSuperAdmin

  if (isUnverified) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ background: 'rgba(245,158,11,0.1)', color: '#B45309', border: '1px solid rgba(245,158,11,0.2)' }}>
      <Lock className="w-2.5 h-2.5" />Sin verificar
    </span>
  )
  if (isSuperAdmin) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ background: 'rgba(124,58,237,0.1)', color: '#6D28D9', border: '1px solid rgba(124,58,237,0.2)' }}>
      <ShieldCheck className="w-2.5 h-2.5" />Super Admin
    </span>
  )
  if (isAdmin) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ background: 'rgba(0,152,70,0.1)', color: '#065F46', border: '1px solid rgba(0,152,70,0.2)' }}>
      <ShieldCheck className="w-2.5 h-2.5" />Admin SIG
    </span>
  )
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[0.6rem] font-bold uppercase tracking-wider"
      style={{ background: 'rgba(0,152,70,0.08)', color: '#047857', border: '1px solid rgba(0,152,70,0.15)' }}>
      <CheckCircle2 className="w-2.5 h-2.5" />{user?.role ?? 'Verificado'}
    </span>
  )
}

// Fila plana estándar del menú (Mi Perfil, Mis Solicitudes, Guía de Usuario).
function MenuItem({ to = '', icon: Icon, label, onClick = undefined }: {
  to?: string; icon: LucideIcon; label: string; onClick?: () => void
}) {
  const base = 'flex items-center gap-3 px-4 py-2.5 text-sm no-underline transition-colors w-full text-left text-text hover:bg-bg-alt'
  if (to) return (
    <li><Link to={to} onClick={onClick} className={base}>
      <Icon className="w-4 h-4 text-text-muted" aria-hidden="true" />{label}
    </Link></li>
  )
  return (
    <li><button onClick={onClick} className={base}>
      <Icon className="w-4 h-4 text-text-muted" aria-hidden="true" />{label}
    </button></li>
  )
}

// Fila con peso propio para acciones que deben destacar sobre el resto del
// menú (Panel Admin, Cerrar Sesión) — visibles en reposo, no solo al hover.
function EmphasisItem({ to = '', icon: Icon, label, onClick, tone }: {
  to?: string; icon: LucideIcon; label: string; onClick?: () => void
  tone: 'admin' | 'danger'
}) {
  const style = tone === 'admin'
    ? { background: 'linear-gradient(135deg, #B0CB1F, #8CA318)', color: '#10230f', boxShadow: '0 2px 10px rgba(176,203,31,0.28)' }
    : { background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.18)' }
  const className = 'flex items-center gap-3 px-4 py-2.5 text-sm font-bold no-underline transition-all w-full text-left rounded-xl mx-2 my-1 hover:opacity-90 active:scale-[0.98]'
  const content = <><Icon className="w-4 h-4 shrink-0" aria-hidden="true" />{label}</>
  if (to) return (
    <li><Link to={to} onClick={onClick} className={className} style={style}>{content}</Link></li>
  )
  return (
    <li><button onClick={onClick} className={className} style={style}>{content}</button></li>
  )
}

export default function ProfileDropdown({ user, onClose, onLogout }: { user: AuthUser | null; onClose: () => void; onLogout: () => void }) {
  const isUnverified = user?.isVisitante || user?.role === ROLES.PUBLICO || user?.role === ROLES.VISITANTE
  const isAdmin      = user?.role === ROLES.ADMIN || user?.role === ROLES.SUPER_ADMIN
  const isVerified   = !isUnverified

  return (
    <GlassPanel {...panelAnim} width="w-60">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="relative shrink-0">
            <Avatar avatarUrl={user?.avatarUrl} initials={user?.initials} size="w-9 h-9" textSize="text-xs" />
            <AvatarBadge variant="dot" ringColor="var(--glass-panel-bg)" label="Sesión activa" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-text truncate leading-tight">{user?.name}</p>
            {isVerified && user?.email && (
              <p className="text-[0.65rem] text-text-muted truncate">{user?.email}</p>
            )}
          </div>
        </div>
        <RoleBadge user={user} />
      </div>

      <nav aria-label="Menú de cuenta">
        {/* No verificado */}
        {isUnverified && (
          <ul className="py-1">
            <li>
              <Link to="/solicitar-acceso" onClick={onClose}
                className="flex items-center gap-3 px-4 py-3 text-sm font-semibold no-underline transition-all mx-2 my-1.5 rounded-xl"
                style={{ background: 'linear-gradient(135deg,#F7AC42,#E07030)', color: '#fff', boxShadow: '0 2px 10px rgba(247,172,66,0.30)' }}>
                <Lock className="w-4 h-4" />Solicitar acceso institucional
              </Link>
            </li>
            <MenuItem to="/guia-usuario" icon={BookOpen} label="Guía de Usuario" onClick={onClose} />
          </ul>
        )}

        {/* Verificado */}
        {isVerified && (
          <ul className="py-1">
            <MenuItem to="/perfil"       icon={UserCircle}      label="Mi Perfil"       onClick={onClose} />
            {isAdmin && <EmphasisItem to="/admin" icon={LayoutDashboard} label="Panel Admin" onClick={onClose} tone="admin" />}
            <MenuItem to="/solicitudes"  icon={ClipboardList}   label="Mis Solicitudes"  onClick={onClose} />
            <MenuItem to="/guia-usuario" icon={BookOpen}        label="Guía de Usuario"  onClick={onClose} />
          </ul>
        )}

        <div className="border-t border-border py-1">
          <EmphasisItem icon={LogOut} label="Cerrar Sesión" onClick={onLogout} tone="danger" />
        </div>
      </nav>
    </GlassPanel>
  )
}
