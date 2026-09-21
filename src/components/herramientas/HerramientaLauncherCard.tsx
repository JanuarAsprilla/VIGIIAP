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

/** Tarjeta de entrada para herramientas "focusable" — sin tilt ni glow: son
 * paneles con su propia navegación interna (pestañas, filtros, formularios),
 * y el tilt 3D de Card3D estorba la interacción en vez de ayudarla. Al hacer
 * clic, la herramienta se abre a pantalla completa (ver Herramientas.tsx),
 * no inline dentro de la grilla junto a las demás. */
export default function HerramientaLauncherCard({ tag, title, description, icon: Icon, color = 'primary', onAbrir }: HerramientaLauncherCardProps) {
  return (
    <div className={`bg-white border border-border/70 rounded-xl overflow-hidden border-t-2 ${accentStyles[color]}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <span className="inline-block text-[0.6rem] font-bold uppercase tracking-widest text-text-muted mb-1.5">
              {tag}
            </span>
            <h3 className="text-lg font-bold text-text leading-snug">{title}</h3>
          </div>
          <div className="w-10 h-10 bg-bg-alt rounded-lg flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-primary-800" aria-hidden="true" />
          </div>
        </div>
        <p className="text-sm text-text-muted leading-relaxed mb-5">{description}</p>
        <button
          onClick={onAbrir}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-bg-alt border border-border rounded-lg text-xs font-semibold text-text hover:border-primary-800 hover:text-primary-800 transition-colors"
        >
          Abrir panel completo
          <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
