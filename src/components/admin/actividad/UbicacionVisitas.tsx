import { motion } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import { formatDate } from '@/lib/dateUtils'
import { DISPOSITIVO_LABEL } from '@/lib/constants/auditoria'
import { useUbicaciones, useSesionesRecientes, type RangoFechas, type SesionReciente } from '@/hooks/useAnalitica'
import BarraCategoria from './BarraCategoria'
import EstadoCarga from './EstadoCarga'

const fadeUp = fadeUpSm
const MAX_SESIONES = 8
const nombresPais = new Intl.DisplayNames(['es'], { type: 'region' })

function nombrePais(codigo: string): string {
  try {
    return nombresPais.of(codigo) ?? codigo
  } catch {
    return codigo
  }
}

function lugarDeSesion(s: SesionReciente): string {
  const partes = [s.ciudad, s.departamento, s.pais ? nombrePais(s.pais) : null].filter(Boolean)
  return partes.length ? partes.join(', ') : 'Sin ubicación'
}

/** De dónde llegan las visitas (por departamento y país) y las últimas sesiones con su IP. */
export default function UbicacionVisitas({ rango }: { rango: RangoFechas }) {
  const ubicaciones = useUbicaciones(rango)
  const sesiones = useSesionesRecientes()

  const departamentos = ubicaciones.data?.departamentos ?? []
  const paises = ubicaciones.data?.paises ?? []
  const totalDepartamentos = departamentos.reduce((suma, d) => suma + d.sesiones, 0)
  const totalPaises = paises.reduce((suma, p) => suma + p.sesiones, 0)
  const vacio = departamentos.length === 0 && paises.length === 0
  const recientes = (sesiones.data ?? []).slice(0, MAX_SESIONES)

  return (
    <div className="space-y-4">
      <motion.div {...fadeUp(0.09)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
        <h3 className="section-title mb-1 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary-700" aria-hidden="true" />
          Ubicación de las visitas
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Aproximada, según la IP: indica el proveedor de internet, no el lugar exacto de la persona.
        </p>
        <EstadoCarga isLoading={ubicaciones.isLoading} isError={ubicaciones.isError} vacio={!ubicaciones.isLoading && !ubicaciones.isError && vacio} />
        {!ubicaciones.isLoading && !ubicaciones.isError && !vacio && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">Departamentos de Colombia</p>
              <div className="space-y-2.5">
                {departamentos.slice(0, 10).map((d, i) => (
                  <BarraCategoria key={d.departamento} label={d.departamento} valor={d.sesiones} total={totalDepartamentos} delay={0.1 + i * 0.04} />
                ))}
                {departamentos.length === 0 && <p className="text-xs text-text-muted">Sin visitas desde Colombia en el período.</p>}
              </div>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-2">Países</p>
              <div className="space-y-2.5">
                {paises.slice(0, 8).map((p, i) => (
                  <BarraCategoria key={p.pais} label={nombrePais(p.pais)} valor={p.sesiones} total={totalPaises} delay={0.1 + i * 0.04} />
                ))}
              </div>
              {(ubicaciones.data?.sinUbicacion ?? 0) > 0 && (
                <p className="text-xs text-text-muted mt-3">{ubicaciones.data!.sinUbicacion} sesiones sin ubicación determinada.</p>
              )}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div {...fadeUp(0.11)} className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-5">
        <h3 className="section-title mb-1">Sesiones recientes</h3>
        <p className="text-xs text-text-muted mb-4">La IP se elimina automáticamente a los 90 días; la ubicación aproximada se conserva.</p>
        <EstadoCarga isLoading={sesiones.isLoading} isError={sesiones.isError} vacio={!sesiones.isLoading && !sesiones.isError && recientes.length === 0} />
        {recientes.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <caption className="sr-only">Últimas sesiones de visitantes con su IP y ubicación aproximada</caption>
              <thead>
                <tr className="border-b border-border">
                  {['Fecha', 'IP', 'Ubicación', 'Dispositivo'].map((h) => (
                    <th key={h} scope="col" className="text-[0.65rem] font-bold uppercase tracking-wider text-text-muted py-2 pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recientes.map((s) => (
                  <tr key={s.id} className="border-b border-border/50 last:border-b-0">
                    <td className="py-2 pr-4 text-sm text-text-muted whitespace-nowrap">{formatDate(s.primera_visita_en)}</td>
                    <td className="py-2 pr-4 text-xs font-mono text-text">{s.ip ?? 'Eliminada'}</td>
                    <td className="py-2 pr-4 text-sm text-text">{lugarDeSesion(s)}</td>
                    <td className="py-2 text-sm text-text-muted whitespace-nowrap">
                      {[DISPOSITIVO_LABEL[s.dispositivo] ?? s.dispositivo, s.navegador].filter(Boolean).join(' · ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
