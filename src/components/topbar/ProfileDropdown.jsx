import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { UserCircle, ClipboardList, BookOpen, LogOut } from 'lucide-react'
import { panelAnim } from './panelAnim'

export default function ProfileDropdown({ user, onClose, onLogout }) {
  return (
    <motion.div
      {...panelAnim}
      className="absolute top-full right-0 mt-2 w-56 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50"
    >
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-800 rounded-full flex items-center justify-center shrink-0">
            <span className="text-white text-xs font-bold">{user.initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-text truncate">{user.name}</p>
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
        </div>
      </div>

      <nav aria-label="Menú de cuenta">
        <ul className="py-1">
          <li>
            <Link
              to="/perfil"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-alt transition-colors no-underline"
            >
              <UserCircle className="w-4 h-4 text-text-muted" aria-hidden="true" />
              Mi Perfil
            </Link>
          </li>
          <li>
            <Link
              to="/solicitudes"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-alt transition-colors no-underline"
            >
              <ClipboardList className="w-4 h-4 text-text-muted" aria-hidden="true" />
              Mis Solicitudes
            </Link>
          </li>
          <li>
            <Link
              to="/guia-usuario"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text hover:bg-bg-alt transition-colors no-underline"
            >
              <BookOpen className="w-4 h-4 text-text-muted" aria-hidden="true" />
              Guía de Usuario
            </Link>
          </li>
        </ul>

        <div className="border-t border-border py-1">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-orange-600 hover:bg-orange-50 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            Cerrar Sesión
          </button>
        </div>
      </nav>
    </motion.div>
  )
}
