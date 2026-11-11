import { ShieldCheck } from 'lucide-react'
import TarjetaAdmin from '@/components/admin/TarjetaAdmin'
import { getApiErrorMessage } from '@/lib/apiError'
import { FORMATOS_INFORME, type AccesoInforme, type FormatoInforme } from '@/lib/informes'
import { useActualizarGeneral, type InformeGeneral } from '@/hooks/useInformesAdmin'

const ACCESOS: { clave: AccesoInforme; titulo: string; ayuda: string }[] = [
  { clave: 'usuarios', titulo: 'Solo cuentas con sesión', ayuda: 'Quien no haya iniciado sesión ve el botón con la invitación a entrar. Es lo recomendado.' },
  { clave: 'publico', titulo: 'Cualquier persona', ayuda: 'También quien visita sin cuenta puede descargar el informe.' },
]

export default function AccesoYFormatos({ general, puedeEditar, onAviso }: {
  general: InformeGeneral
  puedeEditar: boolean
  onAviso: (mensaje: string) => void
}) {
  const guardar = useActualizarGeneral()
  const aplicar = (cambio: Parameters<typeof guardar.mutate>[0]) => guardar.mutate(cambio, {
    onSuccess: () => onAviso('Configuración guardada.'),
    onError: (err) => onAviso(getApiErrorMessage(err, 'No se pudo guardar')),
  })
  const bloqueado = !puedeEditar || guardar.isPending

  const alternarFormato = (formato: FormatoInforme, activo: boolean) => {
    const siguientes = activo ? [...general.formatos, formato] : general.formatos.filter((f) => f !== formato)
    aplicar({ formatos: FORMATOS_INFORME.map((f) => f.clave).filter((c) => siguientes.includes(c)) })
  }

  return (
    <TarjetaAdmin titulo="Quién descarga y en qué formato" icono={ShieldCheck}
      aviso={puedeEditar ? 'Vale para todas las herramientas; cada una puede limitar sus formatos más abajo.' : 'Solo lectura: no tienes permiso de edición en este módulo.'}>
      <div className="grid gap-5 md:grid-cols-2">
        <fieldset className="space-y-2" disabled={bloqueado}>
          <legend className="text-sm font-semibold mb-1">Quién puede descargar</legend>
          {ACCESOS.map((a) => (
            <label key={a.clave} className="flex items-start gap-2 text-sm">
              <input type="radio" name="acceso-informe" className="mt-1" checked={general.acceso === a.clave} onChange={() => aplicar({ acceso: a.clave })} />
              <span><span className="font-semibold block">{a.titulo}</span><span className="text-xs text-text-muted">{a.ayuda}</span></span>
            </label>
          ))}
        </fieldset>
        <fieldset className="space-y-2" disabled={bloqueado}>
          <legend className="text-sm font-semibold mb-1">Formatos disponibles</legend>
          {FORMATOS_INFORME.map((f) => {
            const activo = general.formatos.includes(f.clave)
            return (
              <label key={f.clave} className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={activo} disabled={activo && general.formatos.length === 1}
                  onChange={(e) => alternarFormato(f.clave, e.target.checked)} />
                <span><span className="font-semibold block">{f.nombre}</span><span className="text-xs text-text-muted">{f.ayuda}</span></span>
              </label>
            )
          })}
          <p className="text-xs text-text-muted">Debe quedar al menos un formato.</p>
        </fieldset>
      </div>
      <p className="text-xs text-text-muted">
        Esta opción controla el botón de informe. Quien ya puede ver la información en pantalla puede copiarla a mano: para ocultar datos hay que
        ocultar la herramienta, no el informe.
      </p>
    </TarjetaAdmin>
  )
}
