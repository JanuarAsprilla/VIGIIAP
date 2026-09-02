import { Fragment, useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useErrorLog } from '@/hooks/useErrorLog'

const fadeUp = fadeUpSm
const PAGE_SIZE = 10

export default function Errores() {
  const [page, setPage] = useState(1)
  const [expandido, setExpandido] = useState<number | null>(null)

  const { data, isLoading, isError, refetch } = useErrorLog({
    limit:  PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  })

  const errores    = data?.data ?? []
  const total      = data?.meta?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)}>
        <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
        <h1 className="font-display text-2xl font-bold text-text mt-0.5">Registro de Errores</h1>
        <p className="text-sm text-text-muted mt-1">
          {isLoading ? '...' : total === 0
            ? 'Sin errores registrados — todo en orden'
            : `${total} error${total === 1 ? '' : 'es'} distinto${total === 1 ? '' : 's'} registrado${total === 1 ? '' : 's'}, agrupados por tipo`}
        </p>
      </motion.div>

      {/* Table — sin tilt 3D: es una superficie de datos que se opera, no se admira */}
      <Card3D
        disabled
        initial={{ opacity: 0, y: 20, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.1, duration: 0.5, ease: EASE_OUT_EXPO }}
        style={{ transformPerspective: 900 }}
        glow="rgba(229,26,75,0.1)"
        intensity={3}
        className="bg-[var(--card-bg)] border border-border/70 rounded-xl overflow-hidden"
        whileHover={{ y: -2 }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-bg-alt/50">
                {['Mensaje', 'Endpoint', 'Ocurrencias', 'Primera vez', 'Última vez', ''].map((h) => (
                  <th key={h} className="text-left text-[0.65rem] font-bold uppercase tracking-wider text-text-muted px-5 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <Loader2 className="w-6 h-6 animate-spin text-primary-700 mx-auto" />
                  </td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center">
                    <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <p className="text-sm text-red-500 mb-3">No se pudo cargar el registro de errores.</p>
                    <button onClick={() => refetch()} className="text-xs font-semibold text-primary-700 hover:text-primary-900 transition-colors">
                      Reintentar
                    </button>
                  </td>
                </tr>
              )}
              {!isLoading && !isError && errores.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-sm text-text-muted">Sin errores registrados</td></tr>
              )}
              {errores.map((e) => (
                <Fragment key={e.id}>
                  <tr className="border-b border-border last:border-b-0 hover:bg-bg-alt/30 transition-colors">
                    <td className="px-5 py-3.5 max-w-sm">
                      <p className="text-sm text-text truncate">{e.mensaje}</p>
                    </td>
                    <td className="px-5 py-3.5 text-xs font-mono text-text-muted whitespace-nowrap">{e.metodo} {e.ruta}</td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red/10 text-red-dark">{e.ocurrencias}</span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-text-muted whitespace-nowrap">{e.primeraVez}</td>
                    <td className="px-5 py-3.5 text-sm text-text-muted whitespace-nowrap">{e.ultimaVez}</td>
                    <td className="px-5 py-3.5">
                      {e.stack && (
                        <button
                          onClick={() => setExpandido(expandido === e.id ? null : e.id)}
                          className="text-text-muted hover:text-primary-800 transition-colors"
                          aria-label={expandido === e.id ? 'Ocultar detalle' : 'Ver detalle'}
                        >
                          {expandido === e.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expandido === e.id && e.stack && (
                    <tr className="border-b border-border last:border-b-0 bg-bg-alt/20">
                      <td colSpan={6} className="px-5 py-3">
                        <pre className="text-xs font-mono text-text-muted whitespace-pre-wrap break-all max-h-64 overflow-y-auto">{e.stack}</pre>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="px-5 py-3 border-t border-border bg-bg-alt/30 flex items-center justify-between">
          <span className="text-xs text-text-muted">
            Página {page} de {totalPages} · {total} errores total
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1 rounded-lg text-text-muted hover:text-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-text px-2">{page}/{totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1 rounded-lg text-text-muted hover:text-primary-800 disabled:opacity-40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Card3D>
    </div>
  )
}
