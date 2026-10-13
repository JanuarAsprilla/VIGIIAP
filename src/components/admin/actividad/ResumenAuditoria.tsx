import type { AuditResumen } from '@/hooks/useAuditLog'

type Tono = 'normal' | 'alerta' | 'critico'

const TONO_NUMERO: Record<Tono, string> = {
  normal: 'text-text', alerta: 'text-gold-500', critico: 'text-red-dark',
}

function Celda({ etiqueta, valor, detalle, tono = 'normal', onClick }: {
  etiqueta: string
  valor: number
  detalle?: string
  tono?: Tono
  onClick?: () => void
}) {
  const contenido = (
    <>
      <span className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted">{etiqueta}</span>
      <span className={`block text-2xl font-bold leading-tight mt-1 tabular-nums ${valor > 0 ? TONO_NUMERO[tono] : 'text-text'}`}>{valor}</span>
      {detalle && <span className="block text-xs text-text-muted mt-0.5">{detalle}</span>}
    </>
  )
  const base = 'px-5 py-4 text-left'
  return onClick ? (
    <button type="button" onClick={onClick} disabled={valor === 0}
      className={`${base} hover:bg-bg-alt/60 disabled:hover:bg-transparent disabled:cursor-default transition-colors`}>
      {contenido}
    </button>
  ) : (
    <div className={base}>{contenido}</div>
  )
}

/** Franja con lo más importante de las últimas 24 horas. Los contadores con eventos filtran la tabla. */
export default function ResumenAuditoria({ resumen, onFiltrar }: {
  resumen?: Partial<AuditResumen>
  onFiltrar: (filtro: { accion?: string; severidad?: string; resultado?: string }) => void
}) {
  const r = resumen ?? {}
  return (
    <section aria-label="Resumen de las últimas 24 horas"
      className="grid grid-cols-2 lg:grid-cols-5 divide-x divide-y lg:divide-y-0 divide-border/70 bg-[var(--card-bg)] border border-border/70 rounded-xl overflow-hidden">
      <Celda etiqueta="Eventos hoy" valor={r.eventosHoy ?? 0} detalle={`${r.eventos24h ?? 0} en 24 h`} />
      <Celda etiqueta="Intentos fallidos" valor={r.loginsFallidos24h ?? 0} tono="alerta"
        detalle={r.bloqueos24h ? `${r.bloqueos24h} cuenta${r.bloqueos24h === 1 ? '' : 's'} bloqueada${r.bloqueos24h === 1 ? '' : 's'}` : 'últimas 24 h'}
        onClick={() => onFiltrar({ accion: 'login_failed' })} />
      <Celda etiqueta="Eventos críticos" valor={r.criticos24h ?? 0} tono="critico" detalle="últimas 24 h"
        onClick={() => onFiltrar({ severidad: 'critica' })} />
      <Celda etiqueta="Accesos denegados" valor={r.accesosDenegados24h ?? 0} tono="alerta" detalle="últimas 24 h"
        onClick={() => onFiltrar({ resultado: 'denegado' })} />
      <Celda etiqueta="Orígenes distintos" valor={r.ipsDistintas24h ?? 0}
        detalle={`${r.usuariosActivos24h ?? 0} usuario${r.usuariosActivos24h === 1 ? '' : 's'} activo${r.usuariosActivos24h === 1 ? '' : 's'}`} />
    </section>
  )
}
