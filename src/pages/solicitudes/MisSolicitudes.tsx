import { Eye } from 'lucide-react'
import { fadeUp } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useMisSolicitudes, type SolicitudData } from '@/hooks/useSolicitudes'

interface MisSolicitudesProps {
  onVerDetalle: (sol: SolicitudData) => void
}

export function MisSolicitudes({ onVerDetalle }: MisSolicitudesProps) {
  const { data, isLoading } = useMisSolicitudes()
  const mis = data?.data ?? []

  if (isLoading || mis.length === 0) return null

  return (
    <Card3D
      {...fadeUp(0.3)}
      glow="rgba(26,86,50,0.14)"
      intensity={3}
      className="bg-[var(--card-bg)] border border-border/70 rounded-xl overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h3 className="text-sm font-bold text-text">Mis Solicitudes</h3>
          <p className="text-[0.65rem] text-text-muted mt-0.5">
            {mis.length} solicitud{mis.length !== 1 ? 'es' : ''} registrada{mis.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
      <div className="divide-y divide-border max-h-72 overflow-y-auto">
        {mis.map((s) => (
          <div key={s._id} className="flex items-center gap-3 px-5 py-3 hover:bg-bg-alt/30 transition-colors">
            <div className="flex-1 min-w-0">
              <p className="text-[0.6rem] font-bold text-primary-800">{s.id}</p>
              <p className="text-xs font-semibold text-text truncate">{s.tipo}</p>
              <p className="text-[0.6rem] text-text-muted">{s.fecha}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${
                s.estadoColor === 'green'  ? 'bg-primary-700/10 text-primary-700'
                : s.estadoColor === 'red'  ? 'bg-red/8 text-red-dark'
                : s.estadoColor === 'teal' ? 'bg-accent/18 text-primary-800'
                : s.estadoColor === 'blue' ? 'bg-primary-500/12 text-primary-500'
                : 'bg-gold-500/12 text-gold-500'
              }`}>{s.estado}</span>
              <button onClick={() => onVerDetalle(s)}
                className="p-1 rounded-lg text-text-muted hover:text-primary-600 hover:bg-primary-800/10 transition-colors">
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card3D>
  )
}
