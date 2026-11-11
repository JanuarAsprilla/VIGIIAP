import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

/** Tarjeta de sección del panel de administración: icono, título, ayuda opcional y contenido. */
export default function TarjetaAdmin({ titulo, icono: Icono, aviso, children }: {
  titulo: string
  icono: LucideIcon
  aviso?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 space-y-4">
      <header className="flex items-start gap-3">
        <span className="grid place-items-center w-9 h-9 rounded-xl bg-primary-600/10 text-primary-700 dark:text-primary-300 shrink-0">
          <Icono className="w-5 h-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="section-title">{titulo}</h2>
          {aviso && <p className="text-xs text-text-muted mt-0.5">{aviso}</p>}
        </div>
      </header>
      {children}
    </section>
  )
}
