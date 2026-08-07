const styles: Record<string, string> = {
  green:  'bg-green-100 text-green-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  orange: 'bg-orange-100 text-orange-700',
  blue:   'bg-blue-100 text-blue-700',
  red:    'bg-red-100 text-red-700',
  teal:   'bg-teal-100 text-teal-700',
}
const dotStyles: Record<string, string> = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-500',
  orange: 'bg-orange-500',
  blue:   'bg-blue-500',
  red:    'bg-red-500',
  teal:   'bg-teal-500',
}

interface StatusBadgeProps {
  estado: string
  color: string
}

export function StatusBadge({ estado, color }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${styles[color]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[color]}`} />
      {estado}
    </span>
  )
}
