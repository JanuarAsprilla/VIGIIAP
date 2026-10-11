import { useEffect, useRef, useState, type ReactNode } from 'react'
import { X, Copy, Check } from 'lucide-react'
import type { AuditLogData } from '@/hooks/useAuditLog'
import { DISPOSITIVO_LABEL, SEVERIDAD_META, resumenOrigen } from '@/lib/constants/auditoria'

function Dato({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] gap-3 py-2.5 border-b border-border/60 last:border-b-0">
      <dt className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted pt-0.5">{etiqueta}</dt>
      <dd className="text-sm text-text min-w-0 break-words">{children}</dd>
    </div>
  )
}

/** Panel lateral con todo lo que se sabe de un evento de auditoría. */
export default function DetalleEventoDrawer({ evento, onCerrar }: {
  evento: AuditLogData | null
  onCerrar: () => void
}) {
  const cerrarRef = useRef<HTMLButtonElement>(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    if (!evento) return
    cerrarRef.current?.focus()
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', alTeclear)
    return () => document.removeEventListener('keydown', alTeclear)
  }, [evento, onCerrar])

  if (!evento) return null

  const gravedad = SEVERIDAD_META[evento.severidad]
  const origen = resumenOrigen(evento.navegador, evento.sistema)
  const fechaExacta = new Date(evento.creado_en).toLocaleString('es-CO', { dateStyle: 'full', timeStyle: 'medium' })

  const copiarIp = async () => {
    try {
      await navigator.clipboard.writeText(evento.ip)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 1500)
    } catch {
      setCopiado(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-[2px]"
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar() }}>
      <aside role="dialog" aria-modal="true" aria-labelledby="evento-titulo"
        className="w-full max-w-md bg-[var(--card-bg)] shadow-2xl flex flex-col h-full">
        <header className="flex items-start justify-between gap-3 px-6 py-5 border-b border-border">
          <div className="min-w-0">
            <span className={`inline-flex items-center gap-1.5 text-[0.65rem] font-bold px-2 py-0.5 rounded-full ${gravedad.chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${gravedad.dot}`} aria-hidden="true" />
              {gravedad.label}
            </span>
            <h2 id="evento-titulo" className="text-lg font-bold text-text mt-2 break-words">{evento.accionLabel}</h2>
            <p className="text-xs text-text-muted font-mono mt-0.5">{evento.accion}</p>
          </div>
          <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar detalle"
            className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </header>

        <dl className="flex-1 overflow-y-auto px-6 py-2">
          <Dato etiqueta="Qué pasó">{evento.descripcion || '—'}</Dato>
          <Dato etiqueta="Módulo">{evento.modulo}</Dato>
          <Dato etiqueta="Usuario">{evento.email}</Dato>
          <Dato etiqueta="IP">
            <span className="inline-flex items-center gap-2">
              <span className="font-mono text-xs">{evento.ip}</span>
              {evento.ip !== '—' && (
                <button type="button" onClick={copiarIp}
                  className="inline-flex items-center gap-1 text-[0.65rem] font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                  {copiado ? <Check className="w-3 h-3" aria-hidden="true" /> : <Copy className="w-3 h-3" aria-hidden="true" />}
                  {copiado ? 'Copiada' : 'Copiar IP'}
                </button>
              )}
            </span>
          </Dato>
          <Dato etiqueta="Dispositivo">
            {origen || evento.dispositivo
              ? [origen, evento.dispositivo ? DISPOSITIVO_LABEL[evento.dispositivo] ?? evento.dispositivo : null].filter(Boolean).join(' · ')
              : 'Sin datos del navegador'}
          </Dato>
          <Dato etiqueta="Fecha">{fechaExacta}</Dato>
          {evento.entidadId && <Dato etiqueta="Recurso"><span className="font-mono text-xs">{evento.entidadId}</span></Dato>}
          <Dato etiqueta="ID del evento"><span className="font-mono text-xs">{evento.id}</span></Dato>
          {evento.userAgent && (
            <Dato etiqueta="User-Agent"><span className="font-mono text-[0.65rem] text-text-muted break-all">{evento.userAgent}</span></Dato>
          )}
        </dl>
      </aside>
    </div>
  )
}
