/**
 * Badge de estado para avatares/íconos — dos variantes:
 * - "dot": punto de color sólido (p. ej. sesión activa)
 * - "count": círculo oscuro con número en blanco (p. ej. notificaciones sin leer)
 *
 * El anillo del badge usa el fondo real de su contenedor (--card-bg por
 * defecto, o el que se pase) para que el badge se vea "recortado" sobre el
 * elemento que decora, en vez de flotar con un borde plano — el mismo
 * truco de contraste que usan los indicadores de presencia de apps nativas.
 */
interface AvatarBadgeProps {
  variant: 'dot' | 'count'
  count?: number
  color?: string
  ringColor?: string
  label: string
  className?: string
}

export default function AvatarBadge({
  variant,
  count,
  color = '#4ade80',
  ringColor = 'var(--card-bg)',
  label,
  className = '',
}: AvatarBadgeProps) {
  if (variant === 'dot') {
    return (
      <span
        role="status"
        aria-label={label}
        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 ${className}`}
        style={{ background: color, borderColor: ringColor }}
      />
    )
  }

  if (!count || count <= 0) return null

  return (
    <span
      role="status"
      aria-label={label}
      className={`absolute -top-1 -right-1 min-w-[1.15rem] h-[1.15rem] px-1 rounded-full text-[0.6rem] font-bold text-white flex items-center justify-center leading-none border-2 ${className}`}
      style={{ background: '#111827', borderColor: ringColor }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}
