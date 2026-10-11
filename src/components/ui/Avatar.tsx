/**
 * Avatar — foto de perfil del usuario, con respaldo de iniciales.
 * Centraliza el mismo patrón que antes estaba duplicado (y desincronizado)
 * en TopBar, ProfileDropdown y AdminSidebar: cada uno mostraba solo las
 * iniciales aunque el usuario ya tuviera una foto subida.
 */
const SHAPE_CLASSES = {
  circle:  'rounded-full',
  square:  'rounded-lg',
  squircle: 'rounded-2xl',
} as const

interface AvatarProps {
  avatarUrl?: string | null
  initials?: string
  size?: string
  shape?: keyof typeof SHAPE_CLASSES
  textSize?: string
  className?: string
}

export default function Avatar({
  avatarUrl, initials, size = 'w-9 h-9', shape = 'circle', textSize = 'text-sm', className = '',
}: AvatarProps) {
  const shapeClass = SHAPE_CLASSES[shape]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={`${size} ${shapeClass} object-cover shrink-0 shadow-sm ${className}`}
      />
    )
  }

  return (
    <div className={`${size} ${shapeClass} bg-gradient-to-br from-primary-600 to-primary-800 flex items-center justify-center shrink-0 ${className}`}>
      <span className={`text-white font-bold ${textSize}`}>{initials}</span>
    </div>
  )
}
