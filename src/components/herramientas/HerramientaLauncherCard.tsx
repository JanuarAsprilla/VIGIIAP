import { ArrowUpRight, type LucideIcon } from 'lucide-react'

const accentStyles = {
  primary: 'border-t-primary-800',
  orange:  'border-t-gold-400',
  gold:    'border-t-gold-500',
  green:   'border-t-primary-500',
}

interface HerramientaLauncherCardProps {
  tag: string
  title: string
  description: string
  icon: LucideIcon
  color?: keyof typeof accentStyles
  onAbrir: () => void
}

/** Tarjeta pequeña de entrada a una herramienta. Toda la tarjeta es el botón: al hacer
 * clic, la herramienta ocupa la página completa (ver Herramientas.tsx), no se abre
 * dentro de la grilla. Sin tilt ni glow: las herramientas tienen su propia navegación
 * interna y el movimiento 3D estorbaría la interacción. */
export default function HerramientaLauncherCard({ tag, title, description, icon: Icon, color = 'primary', onAbrir }: HerramientaLauncherCardProps) {
  return (
    <button
      type="button"
      onClick={onAbrir}
      aria-label={`Abrir ${title}`}
      className={`group h-full w-full text-left flex flex-col gap-3 p-4 bg-[var(--card-bg)] border border-border/70 border-t-2 ${accentStyles[color]} rounded-xl
        transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:shadow-card hover:border-primary-800/40
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 motion-reduce:transition-none motion-reduce:hover:translate-y-0`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-bg-alt rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-primary-800" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-0.5">{tag}</span>
          <h3 className="text-sm font-bold text-text leading-snug">{title}</h3>
        </div>
        <ArrowUpRight
          className="w-4 h-4 text-text-muted shrink-0 transition-transform duration-200 group-hover:text-primary-800 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-reduce:transition-none"
          aria-hidden="true"
        />
      </div>
      {description && <p className="text-xs text-text-muted leading-relaxed line-clamp-3">{description}</p>}
    </button>
  )
}
