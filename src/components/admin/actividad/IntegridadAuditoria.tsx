import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { formatDate } from '@/lib/dateUtils'
import { useVerificarIntegridad, type ProblemaIntegridad } from '@/hooks/useIntegridadAuditoria'

const PROBLEMA_LABEL: Record<ProblemaIntegridad, string> = {
  contenido_alterado: 'Contenido alterado',
  evento_faltante: 'Evento faltante antes de este',
  cadena_rota: 'Cadena rota',
}

/** Comprueba que nadie haya editado ni quitado eventos del registro de auditoría. */
export default function IntegridadAuditoria() {
  const verificar = useVerificarIntegridad()
  const resultado = verificar.data

  return (
    <section aria-labelledby="integridad-titulo"
      className="flex flex-col gap-3 bg-[var(--card-bg)] border border-border/70 rounded-xl px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 id="integridad-titulo" className="text-sm font-bold text-text">Integridad del registro</h2>
          <p className="text-xs text-text-muted mt-0.5">
            Cada evento queda encadenado al anterior: si alguien edita o borra uno, la comprobación lo detecta.
          </p>
        </div>
        <button type="button" onClick={() => verificar.mutate()} disabled={verificar.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl text-sm font-semibold text-text hover:bg-bg-alt disabled:opacity-60 transition-colors shrink-0">
          {verificar.isPending
            ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            : <ShieldCheck className="w-4 h-4" aria-hidden="true" />}
          {verificar.isPending ? 'Verificando…' : 'Verificar integridad'}
        </button>
      </div>

      <div role="status" aria-live="polite">
        {verificar.isError && (
          <p className="text-xs text-red-500">No se pudo verificar la integridad. Intenta de nuevo.</p>
        )}
        {resultado?.integra && (
          <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700">
            <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            Íntegro: {resultado.verificados} eventos verificados sin alteraciones.
          </p>
        )}
        {resultado && !resultado.integra && (
          <div>
            <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-red-dark">
              <ShieldAlert className="w-4 h-4" aria-hidden="true" />
              Se encontraron {resultado.problemas.length} evento(s) con problemas.
            </p>
            <ul className="mt-2 space-y-1">
              {resultado.problemas.map((p) => (
                <li key={p.id} className="text-xs text-text-muted">
                  <span className="font-mono text-text">#{p.secuencia}</span> · {PROBLEMA_LABEL[p.problema]} · {formatDate(p.creado_en)}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  )
}
