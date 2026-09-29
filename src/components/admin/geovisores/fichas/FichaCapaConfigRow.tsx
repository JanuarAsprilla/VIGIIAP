import { useState } from 'react'
import { Loader2, Check, AlertCircle, ListChecks } from 'lucide-react'
import { asApiError, getApiErrorMessage } from '@/lib/apiError'
import {
  useAtributosCapa, useConfigFichasCapa, useUpsertConfigFichasCapa, useFeaturesFichas,
} from '@/hooks/useFichasPunto'
import FichasCapaModal from './FichasCapaModal'

const inputCls = 'w-full px-2.5 py-1.5 bg-[var(--card-bg)] border border-border rounded-md text-xs focus:outline-none focus:border-primary-800 transition'

/**
 * Fila de configuración de "fichas por punto" para UNA capa (dentro de la
 * sección 5 del formulario). El identificador elegido acá vive a nivel de
 * capa (conexión + capaId), no del geovisor -- si otro geovisor ya muestra
 * esta misma capa, comparte la misma config y las mismas fichas en vez de
 * duplicar la carga de trabajo (ver plan: fichas-punto-en-geovisores).
 */
export default function FichaCapaConfigRow({ conexionId, capaId, capaNombre }: {
  conexionId: string
  capaId: string
  capaNombre: string
}) {
  const { data: atributos = [], isLoading: cargandoAtributos } = useAtributosCapa(conexionId, capaId)
  const { data: config, isLoading: cargandoConfig } = useConfigFichasCapa(conexionId, capaId)
  const { data: featuresResp } = useFeaturesFichas(config?.id)
  const upsertConfig = useUpsertConfigFichasCapa()

  const [campoIdentificador, setCampoIdentificador] = useState(() => config?.campoIdentificador ?? '')
  const [campoEtiqueta, setCampoEtiqueta] = useState(() => config?.campoEtiqueta ?? '')
  const [error, setError] = useState('')
  const [configAnterior, setConfigAnterior] = useState(config)
  const [modalAbierto, setModalAbierto] = useState(false)

  // Precarga desde la config ya guardada -- si otro geovisor ya la configuró,
  // esta fila hereda el mismo identificador en vez de partir vacía. Ajustado
  // durante el render, no en un efecto, para evitar el re-render extra que
  // produciría un useEffect solo para sincronizar este estado derivado.
  if (config !== configAnterior) {
    setConfigAnterior(config)
    if (config) {
      setCampoIdentificador(config.campoIdentificador)
      setCampoEtiqueta(config.campoEtiqueta ?? '')
    }
  }

  const hayCambios = !config || campoIdentificador !== config.campoIdentificador || campoEtiqueta !== (config.campoEtiqueta ?? '')

  const guardar = async () => {
    if (!campoIdentificador) return
    setError('')
    try {
      await upsertConfig.mutateAsync({
        conexionId, capaId, campoIdentificador,
        campoEtiqueta: campoEtiqueta.trim() || undefined,
      })
    } catch (err) {
      setError(
        asApiError(err)?.code === 'IDENTIFICADOR_BLOQUEADO'
          ? 'Ya hay fichas cargadas con el identificador actual — elimínalas antes de cambiarlo.'
          : getApiErrorMessage(err, 'No se pudo guardar la configuración'),
      )
    }
  }

  if (cargandoAtributos || cargandoConfig) {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 text-xs text-text-muted">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cargando "{capaNombre}"…
      </div>
    )
  }

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-bold text-text truncate">{capaNombre}</p>
        {config && (
          <span className="text-[0.6rem] text-text-muted shrink-0">Compartida entre geovisores</span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor={`fp-id-${capaId}`} className="block text-[0.6rem] font-semibold text-text-muted mb-1">
            Atributo identificador <span className="text-orange-500" aria-hidden="true">*</span>
          </label>
          <select id={`fp-id-${capaId}`} value={campoIdentificador}
            onChange={(e) => setCampoIdentificador(e.target.value)} className={inputCls}>
            <option value="">Elegir atributo…</option>
            {atributos.map((a) => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`fp-et-${capaId}`} className="block text-[0.6rem] font-semibold text-text-muted mb-1">
            Atributo de etiqueta <span className="font-normal text-text-muted">(opcional)</span>
          </label>
          <select id={`fp-et-${capaId}`} value={campoEtiqueta}
            onChange={(e) => setCampoEtiqueta(e.target.value)} className={inputCls}>
            <option value="">Sin etiqueta</option>
            {atributos.map((a) => <option key={a.nombre} value={a.nombre}>{a.nombre}</option>)}
          </select>
        </div>
      </div>

      <p className="text-[0.6rem] text-text-muted leading-relaxed">
        Recomendado: un código propio del dato (ej. "codigo_estacion"), no el ID interno de GeoServer —
        ese cambia si la capa se vuelve a importar y desligaría las fichas ya cargadas.
      </p>

      {error && (
        <p className="flex items-center gap-1.5 text-[0.65rem] text-red-600">
          <AlertCircle className="w-3 h-3 shrink-0" /> {error}
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        {config && featuresResp ? (
          <span className="text-[0.65rem] font-semibold text-text shrink-0">
            {featuresResp.resumen.completas}/{featuresResp.resumen.totalFeatures} completas
          </span>
        ) : <span />}
        <div className="flex items-center gap-2">
          {config && (
            <button type="button" onClick={() => setModalAbierto(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-md text-[0.65rem] font-semibold text-text hover:border-primary-800 transition-colors">
              <ListChecks className="w-3 h-3" /> Gestionar fichas
            </button>
          )}
          <button type="button" onClick={guardar} disabled={!campoIdentificador || !hayCambios || upsertConfig.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-800 text-white rounded-md text-[0.65rem] font-semibold hover:bg-primary-700 disabled:opacity-40 transition-colors">
            {upsertConfig.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            {config ? 'Guardar cambios' : 'Habilitar'}
          </button>
        </div>
      </div>

      {modalAbierto && config && (
        <FichasCapaModal configId={config.id} capaNombre={capaNombre} onClose={() => setModalAbierto(false)} />
      )}
    </div>
  )
}
