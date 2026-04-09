import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { BellOff, ExternalLink } from 'lucide-react'
import { panelAnim } from './panelAnim'

function NotificationItem({ item, isRead, onSelect }) {
  return (
    <Link
      to={`/noticias/${item.slug}`}
      onClick={onSelect}
      className="flex items-start gap-3 px-4 py-3 hover:bg-bg-alt transition-colors no-underline group"
    >
      <span
        aria-hidden="true"
        className={`w-2 h-2 rounded-full mt-2 shrink-0 transition-colors ${
          isRead ? 'bg-transparent border border-border' : 'bg-orange-500'
        }`}
      />
      <div className="flex-1 min-w-0">
        <p className={`text-[0.65rem] font-bold uppercase tracking-wider mb-0.5 ${
          isRead ? 'text-text-muted' : 'text-primary-700'
        }`}>
          {item.tag}
        </p>
        <p className={`text-sm leading-snug line-clamp-2 group-hover:text-primary-800 transition-colors ${
          isRead ? 'text-text-muted' : 'text-text font-medium'
        }`}>
          {item.title}
        </p>
        <p className="text-xs text-text-muted mt-1">{item.time}</p>
      </div>
    </Link>
  )
}

export default function NotificacionesPanel({ onClose, items, readIds, onMarkAllRead, onMarkRead }) {
  const unreadCount = items.filter((n) => !readIds.includes(n.id)).length
  const allRead     = unreadCount === 0

  return (
    <motion.div
      {...panelAnim}
      className="absolute top-full right-0 mt-2 w-80 bg-white border border-border rounded-xl shadow-float overflow-hidden z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-text">Notificaciones</p>
          {!allRead && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-orange-500 text-white text-[0.6rem] font-bold rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        {!allRead && (
          <button
            onClick={onMarkAllRead}
            className="text-xs text-primary-800 hover:text-primary-600 font-semibold transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {allRead ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
          <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center mb-3">
            <BellOff className="w-5 h-5 text-primary-800" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-text mb-1">Todo al día</p>
          <p className="text-xs text-text-muted">No tienes notificaciones pendientes.</p>
        </div>
      ) : (
        <ul className="divide-y divide-border max-h-72 overflow-y-auto" role="list">
          {items.map((item) => (
            <li key={item.id} role="listitem">
              <NotificationItem
                item={item}
                isRead={readIds.includes(item.id)}
                onSelect={() => { onMarkRead(item.id); onClose() }}
              />
            </li>
          ))}
        </ul>
      )}

      <div className="px-4 py-3 border-t border-border">
        <Link
          to="/noticias"
          onClick={onClose}
          className="w-full flex items-center justify-center gap-2 text-sm font-semibold text-primary-800 hover:text-primary-600 transition-colors no-underline"
        >
          Ver todas las noticias
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>
    </motion.div>
  )
}
