import { Eye } from 'lucide-react'
import { fadeUp } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import { useMisSolicitudes } from '@/hooks/useSolicitudes'

export function MisSolicitudes({ onVerDetalle }) {
  const { data, isLoading } = useMisSolicitudes()
  const mis = data?.data ?? []

  if (isLoading || mis.length === 0) return null

  return (
    <Card3D
      {...fadeUp(0.3)}
      glow="rgba(26,86,50,0.14)"
      intensity={3}
      className="bg-white border border-border/70 rounded-xl overflow-hidden"
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
                s.estadoColor === 'green'  ? 'bg-green-100 text-green-700'
                : s.estadoColor === 'red'  ? 'bg-red-100 text-red-700'
                : s.estadoColor === 'teal' ? 'bg-teal-100 text-teal-700'
                : s.estadoColor === 'blue' ? 'bg-blue-100 text-blue-700'
                : 'bg-orange-100 text-orange-700'
              }`}>{s.estado}</span>
              <button onClick={() => onVerDetalle(s)}
                className="p-1 rounded-lg text-text-muted hover:text-primary-800 hover:bg-primary-50 transition-colors">
                <Eye className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </Card3D>
  )
}
