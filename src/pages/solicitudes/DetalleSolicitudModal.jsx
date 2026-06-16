import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Check, CheckCircle, AlertCircle, Clock, PlusCircle } from 'lucide-react'
import { StatusBadge } from './StatusBadge'

export function DetalleSolicitudModal({ sol, onClose, onNueva }) {
  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const isRechazado = sol.estado === 'Rechazado'
  const isAprobado  = sol.estado === 'Aprobado'
  const isResuelta  = sol.estado === 'Resuelta'
  const isPendiente = sol.estado === 'Pendiente' || sol.estado === 'En Revisión'

  const steps    = sol.timeline ?? ['Recibida', 'Pendiente', sol.estado]
  const activeIdx = steps.indexOf(sol.estado)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="detalle-modal-title"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col"
      >
        <div className="flex items-start justify-between px-6 py-5 border-b border-border shrink-0">
          <div>
            <span className="text-[0.65rem] font-bold uppercase tracking-wider text-primary-700">
              {sol.id} · {sol.fecha}
            </span>
            <h3 id="detalle-modal-title" className="text-base font-bold text-text mt-0.5 leading-tight">
              {sol.tipo}
            </h3>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            <StatusBadge estado={sol.estado} color={sol.estadoColor} />
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="p-1.5 text-text-muted hover:text-text rounded-lg hover:bg-bg-alt transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isResuelta && (
            <div className="flex items-start gap-3 p-4 bg-teal-50 border border-teal-200 rounded-xl">
              <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <p className="text-sm font-bold text-teal-800">Solicitud tramitada</p>
                <p className="text-xs text-teal-700 mt-0.5 leading-relaxed">
                  Tu solicitud fue procesada. Revisa tu correo electrónico para obtener
                  la respuesta, archivos o documentos adjuntos del IIAP.
                </p>
              </div>
            </div>
          )}

          <div>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted block mb-2">
              Descripción de la solicitud
            </span>
            <div className="bg-bg-alt rounded-lg p-3">
              <p className="text-sm text-text leading-relaxed">
                {sol.descripcion || sol.subtipo || 'Sin descripción'}
              </p>
            </div>
          </div>

          <div>
            <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted block mb-3">
              Seguimiento del trámite
            </span>
            <div className="flex items-center">
              {steps.map((step, i) => {
                const done = i <= activeIdx
                const isLast = i === steps.length - 1
                const isReject = step === 'Rechazado'
                const isTeal = step === 'Resuelta'
                return (
                  <div key={step} className="flex items-center flex-1 min-w-0">
                    <div className="flex flex-col items-center flex-1 min-w-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                        done
                          ? isReject ? 'bg-red-500 border-red-500'
                            : isTeal ? 'bg-teal-500 border-teal-500'
                            : isLast && isAprobado ? 'bg-green-500 border-green-500'
                            : 'bg-primary-800 border-primary-800'
                          : 'bg-white border-border'
                      }`}>
                        {done
                          ? isReject
                            ? <X className="w-3.5 h-3.5 text-white" />
                            : <Check className="w-3.5 h-3.5 text-white" />
                          : <span className="w-2 h-2 rounded-full bg-border" />
                        }
                      </div>
                      <span className={`text-[0.6rem] font-semibold mt-1.5 text-center leading-tight ${
                        done
                          ? isReject ? 'text-red-600' : isTeal ? 'text-teal-700' : 'text-primary-800'
                          : 'text-text-muted'
                      }`}>
                        {step}
                      </span>
                    </div>
                    {!isLast && (
                      <div className={`h-0.5 flex-1 mx-1 rounded-full transition-colors ${
                        i < activeIdx ? 'bg-primary-800' : 'bg-border'
                      }`} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {(sol.notas || isResuelta || !isPendiente) && (
            <div className={`p-4 rounded-xl border ${
              isRechazado  ? 'bg-red-50 border-red-200'
              : isResuelta ? 'bg-teal-50 border-teal-200'
              : isAprobado ? 'bg-green-50 border-green-200'
              : 'bg-primary-50 border-primary-200'
            }`}>
              <div className="flex items-start gap-2.5">
                {isRechazado
                  ? <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" aria-hidden="true" />
                  : isResuelta
                    ? <CheckCircle className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" aria-hidden="true" />
                    : isAprobado
                      ? <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" aria-hidden="true" />
                      : <Clock className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" aria-hidden="true" />
                }
                <div>
                  <p className={`text-[0.6rem] font-bold uppercase tracking-wider mb-1 ${
                    isRechazado ? 'text-red-700' : isResuelta ? 'text-teal-700' : isAprobado ? 'text-green-700' : 'text-primary-700'
                  }`}>
                    {isResuelta ? 'Respuesta del IIAP' : 'Nota del administrador'}
                  </p>
                  <p className={`text-xs leading-relaxed ${
                    isRechazado ? 'text-red-800' : isResuelta ? 'text-teal-800' : isAprobado ? 'text-green-800' : 'text-primary-800'
                  }`}>
                    {sol.notas || 'Sin observaciones adicionales.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isPendiente && !sol.notas && (
            <div className="flex items-start gap-2.5 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
              <Clock className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-yellow-800 leading-relaxed">
                Tu solicitud está siendo revisada por el equipo del IIAP.
                Recibirás una notificación por correo cuando haya una respuesta.
              </p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-border bg-bg-alt/30 shrink-0">
          <div className="flex gap-3">
            {isRechazado && (
              <button
                onClick={() => { onClose(); onNueva() }}
                className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" aria-hidden="true" />
                Nueva Solicitud
              </button>
            )}
            <button
              onClick={onClose}
              className={`${isRechazado ? 'flex-1' : 'w-full'} py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 hover:text-primary-800 transition-colors`}
            >
              Cerrar
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
