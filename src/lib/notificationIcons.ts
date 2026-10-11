// Registro estático ícono/color para tipos de notificación -- el catálogo
// (tipos_notificacion en BD) guarda nombres simbólicos ('User', 'magenta'),
// no clases de Tailwind ni imports dinámicos. Tailwind solo incluye en el
// build las clases que aparecen como texto literal en el código fuente, así
// que interpolar `text-${color}` en runtime no funcionaría -- este mapa es
// la única fuente de clases reales, y el valor guardado en BD es solo la key.
import { User, ClipboardList, FileText, Bell, Megaphone, type LucideIcon } from 'lucide-react'

export const NOTIFICATION_ICONS: Record<string, LucideIcon> = {
  User, ClipboardList, FileText, Bell, Megaphone,
}

export const DEFAULT_NOTIFICATION_ICON = Bell

interface ColorClasses { text: string; bg: string }

const COLOR_CLASSES: Record<string, ColorClasses> = {
  magenta: { text: 'text-magenta',    bg: 'bg-magenta/10' },
  gold:    { text: 'text-gold-500',   bg: 'bg-gold-500/10' },
  primary: { text: 'text-primary-800', bg: 'bg-primary-800/10' },
  muted:   { text: 'text-text-muted', bg: 'bg-bg-alt' },
}

export function getNotificationColorClasses(color: string | undefined): ColorClasses {
  return (color && COLOR_CLASSES[color]) || COLOR_CLASSES.muted
}
