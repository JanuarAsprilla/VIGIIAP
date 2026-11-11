import { useState } from 'react'
import { Loader2, Wrench } from 'lucide-react'
import TarjetaAdmin from '@/components/admin/TarjetaAdmin'
import Switch from '@/components/ui/Switch'
import { getApiErrorMessage } from '@/lib/apiError'
import { FORMATOS_INFORME, HERRAMIENTAS_CON_INFORME, LIMITE_FILAS, NOMBRE_FORMATO, type FormatoInforme } from '@/lib/informes'
import { useActualizarHerramientaInforme, type InformeGeneral, type InformeHerramienta } from '@/hooks/useInformesAdmin'

const lista = (formatos: FormatoInforme[]) => formatos.map((f) => NOMBRE_FORMATO[f]).join(', ')

function FilaHerramienta({ h, general, puedeEditar, onAviso }: {
  h: InformeHerramienta
  general: InformeGeneral
  puedeEditar: boolean
  onAviso: (mensaje: string) => void
}) {
  const guardar = useActualizarHerramientaInforme()
  const soportada = HERRAMIENTAS_CON_INFORME.has(h.clave)
  const [propios, setPropios] = useState(h.formatos !== null)
  const [elegidos, setElegidos] = useState<FormatoInforme[]>(h.formatos ?? general.formatos)
  const [filas, setFilas] = useState(String(h.max_filas))
  const [error, setError] = useState<string | null>(null)
  const bloqueado = !puedeEditar || !soportada || guardar.isPending

  const enviar = (cambio: Parameters<typeof guardar.mutate>[0]['cambio'], exito: string) => guardar.mutate({ clave: h.clave, cambio }, {
    onSuccess: () => { setError(null); onAviso(exito) },
    onError: (err) => setError(getApiErrorMessage(err, 'No se pudo guardar')),
  })

  const guardarAjustes = () => {
    const n = Number(filas)
    if (!Number.isInteger(n) || n < LIMITE_FILAS.minimo || n > LIMITE_FILAS.maximo) {
      return setError(`El tope de filas debe estar entre ${LIMITE_FILAS.minimo} y ${LIMITE_FILAS.maximo.toLocaleString('es-CO')}.`)
    }
    if (propios && elegidos.length === 0) return setError('Elige al menos un formato.')
    enviar({ formatos: propios ? elegidos : null, max_filas: n }, `Informe de ${h.titulo} guardado.`)
  }

  const alternar = (formato: FormatoInforme, activo: boolean) =>
    setElegidos((actual) => FORMATOS_INFORME.map((f) => f.clave).filter((c) => (c === formato ? activo : actual.includes(c))))

  return (
    <li className="rounded-xl border border-border p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{h.titulo}</p>
          <p className="text-xs text-text-muted">
            {soportada ? (h.activo ? 'El botón «Descargar informe» está visible.' : 'El botón «Descargar informe» está oculto.') : 'Esta herramienta todavía no genera informes.'}
          </p>
        </div>
        <Switch label={`Informe de ${h.titulo}`} checked={soportada && h.activo} disabled={bloqueado}
          onChange={(activo) => enviar({ activo }, activo ? `Informe de ${h.titulo} activado.` : `Informe de ${h.titulo} desactivado.`)} />
      </div>
      {soportada && (
        <div className="grid gap-4 md:grid-cols-2">
          <fieldset className="space-y-2" disabled={bloqueado}>
            <legend className="text-xs font-semibold mb-1">Formatos de esta herramienta</legend>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name={`formatos-${h.clave}`} checked={!propios} onChange={() => setPropios(false)} />
              Los generales ({lista(general.formatos)})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name={`formatos-${h.clave}`} checked={propios} onChange={() => setPropios(true)} />Elegir
            </label>
            {propios && (
              <div className="flex flex-wrap gap-x-4 gap-y-1 pl-6">
                {FORMATOS_INFORME.map((f) => (
                  <label key={f.clave} className="flex items-center gap-1.5 text-sm">
                    <input type="checkbox" checked={elegidos.includes(f.clave)} onChange={(e) => alternar(f.clave, e.target.checked)} />{f.nombre}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
          <label className="text-sm block">
            <span className="text-xs font-semibold block mb-1">Tope de filas por descarga</span>
            <input className="admin-campo w-32" type="number" inputMode="numeric" min={LIMITE_FILAS.minimo} max={LIMITE_FILAS.maximo}
              value={filas} disabled={bloqueado} onChange={(e) => setFilas(e.target.value)} />
            <span className="text-[11px] text-text-muted block mt-1">Entre {LIMITE_FILAS.minimo} y {LIMITE_FILAS.maximo.toLocaleString('es-CO')}. Evita descargas enormes.</span>
          </label>
        </div>
      )}
      {error && <p role="alert" className="text-sm text-red-700 dark:text-red-300">{error}</p>}
      {soportada && puedeEditar && (
        <button type="button" className="admin-boton" disabled={guardar.isPending} onClick={guardarAjustes}>
          {guardar.isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}Guardar formatos y tope
        </button>
      )}
    </li>
  )
}

export default function HerramientasInforme({ herramientas, general, puedeEditar, onAviso }: {
  herramientas: InformeHerramienta[]
  general: InformeGeneral
  puedeEditar: boolean
  onAviso: (mensaje: string) => void
}) {
  return (
    <TarjetaAdmin titulo="Informe por herramienta" icono={Wrench} aviso="Enciende el informe donde ya esté disponible y ajusta sus formatos y su tope de filas.">
      <ul className="space-y-3">
        {herramientas.map((h) => (
          <FilaHerramienta key={`${h.clave}|${h.activo}|${h.formatos?.join(',') ?? '-'}|${h.max_filas}|${general.formatos.join(',')}`}
            h={h} general={general} puedeEditar={puedeEditar} onAviso={onAviso} />
        ))}
      </ul>
    </TarjetaAdmin>
  )
}
