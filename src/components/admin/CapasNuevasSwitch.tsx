import { useId, useState } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import Switch from '@/components/ui/Switch'
import { useSetCapasNuevasConexionGeoserver } from '@/hooks/useConexionesGeoserver'
import { getApiErrorMessage } from '@/lib/apiError'

interface Props {
  conexionId: string
  conexionNombre: string
  value: boolean
  /** Texto visible junto al interruptor. */
  texto?: string
}

export default function CapasNuevasSwitch({ conexionId, conexionNombre, value, texto }: Props) {
  const { mutateAsync, isPending } = useSetCapasNuevasConexionGeoserver()
  const [confirmando, setConfirmando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const id = useId()

  const aplicar = async (capasNuevasAuto: boolean) => {
    setError(null)
    try {
      await mutateAsync({ id: conexionId, capasNuevasAuto })
    } catch (err) {
      setError(getApiErrorMessage(err, 'No se pudo cambiar la opción'))
    }
  }

  // Apagar pide confirmación porque oculta lo que se suba después; encender no.
  const onChange = (siguiente: boolean) => {
    if (siguiente) void aplicar(true)
    else setConfirmando(true)
  }

  const confirmarApagado = () => {
    setConfirmando(false)
    void aplicar(false)
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2.5">
        <Switch checked={value} disabled={isPending} onChange={onChange}
          label={`Capas nuevas automáticas de la conexión ${conexionNombre}`} />
        <span className="text-xs font-semibold text-text">
          {texto ?? 'Mostrar automáticamente las capas nuevas de esta conexión'}
        </span>
        {isPending && <Loader2 role="status" aria-label="Guardando" className="w-3.5 h-3.5 animate-spin text-text-muted" />}
      </div>
      {error && (
        <p role="alert" className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />{error}
        </p>
      )}
      {confirmando && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onKeyDown={(e) => { if (e.key === 'Escape') setConfirmando(false) }}>
          <div role="alertdialog" aria-modal="true" aria-labelledby={`${id}-t`} aria-describedby={`${id}-d`}
            className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <h3 id={`${id}-t`} className="text-base font-bold text-text mb-2">Apagar capas nuevas automáticas</h3>
            <p id={`${id}-d`} className="text-sm text-text-muted mb-6">
              Las capas nuevas dejarán de aparecer solas en los geovisores de esta conexión.
            </p>
            <div className="flex gap-3">
              <button type="button" autoFocus onClick={() => setConfirmando(false)}
                className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors">
                Cancelar
              </button>
              <button type="button" onClick={confirmarApagado}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
                Sí, apagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
