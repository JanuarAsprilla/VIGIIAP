import { Smartphone, Download } from 'lucide-react'
import ToolCard from './ToolCard'

const APPS = [
  {
    nombre: 'VIGIIAP Field',
    descripcion: 'Captura de datos en campo con soporte offline y sincronización automática.',
    plataformas: ['Android'],
    estado: 'desarrollo',
  },
  {
    nombre: 'VIGIIAP Offline',
    descripcion: 'Visualización de capas y mapas sin conexión a internet para zonas remotas.',
    plataformas: ['Android', 'iOS'],
    estado: 'desarrollo',
  },
  {
    nombre: 'VIGIIAP Monitor',
    descripcion: 'Seguimiento de indicadores ambientales en tiempo real desde dispositivos móviles.',
    plataformas: ['Android', 'iOS'],
    estado: 'planeado',
  },
]

export default function AplicacionesMoviles() {
  return (
    <ToolCard tag="Movilidad" title="Aplicaciones Móviles" icon={Smartphone} color="orange" index={5}>
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Aplicaciones del IIAP para trabajo en campo, monitoreo remoto
        y acceso a datos sin conexión.
      </p>

      <div className="space-y-3">
        {APPS.map((app) => (
          <div key={app.nombre} className="flex items-start gap-3 p-3 bg-bg-alt rounded-lg border border-border">
            <div className="w-9 h-9 bg-primary-800 rounded-lg flex items-center justify-center shrink-0">
              <Smartphone className="w-4 h-4 text-white" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-bold text-text">{app.nombre}</span>
                <span className={`text-[0.6rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                  app.estado === 'desarrollo'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-primary-100 text-primary-700'
                }`}>
                  {app.estado === 'desarrollo' ? 'En desarrollo' : 'Planificado'}
                </span>
              </div>
              <p className="text-xs text-text-muted leading-relaxed mb-1.5">{app.descripcion}</p>
              <div className="flex items-center gap-1.5">
                {app.plataformas.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-border rounded text-[0.65rem] font-semibold text-text-muted"
                  >
                    <Download className="w-3 h-3" aria-hidden="true" />
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}

        <p className="text-xs text-text-muted text-center pt-1">
          Las apps estarán disponibles para descarga en la Fase 2 del sistema.
        </p>
      </div>
    </ToolCard>
  )
}
