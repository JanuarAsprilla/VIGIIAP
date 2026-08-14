/* Claves de estado sobre paleta oficial IIAP — sin azules/teales genéricos */
const styles: Record<string, string> = {
  green:  'bg-primary-700/10 text-primary-700',   // Aprobado
  yellow: 'bg-gold-400/12 text-gold-400',
  orange: 'bg-gold-500/12 text-gold-500',          // Pendiente
  blue:   'bg-primary-500/12 text-primary-500',    // En Revisión
  red:    'bg-red/8 text-red-dark',                // Rechazado
  teal:   'bg-accent/18 text-primary-800',          // Resuelta
}
const dotStyles: Record<string, string> = {
  green:  'bg-primary-700',
  yellow: 'bg-gold-400',
  orange: 'bg-gold-500',
  blue:   'bg-primary-500',
  red:    'bg-red',
  teal:   'bg-accent',
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
