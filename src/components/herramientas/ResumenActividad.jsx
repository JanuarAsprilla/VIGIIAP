import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { fadeUp } from '@/lib/animations'
import { useAdminStats } from '@/hooks/useStats'
import { useAuth } from '@/contexts/AuthContext'

export default function ResumenActividad() {
  const { user }  = useAuth()
  const isAdmin   = user?.rol === 'admin_sig'
  const { data: stats, isLoading } = useAdminStats()

  const items = isAdmin && stats
    ? [
        { value: stats.documentos,            label: 'Documentos'          },
        { value: stats.noticias,              label: 'Noticias publicadas' },
        { value: stats.solicitudesPendientes, label: 'Solicitudes activas' },
      ]
    : null

  return (
    <motion.div
      {...fadeUp(0.5)}
      className="bg-primary-800 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6"
    >
      <div className="flex-1 text-white">
        <h3 className="text-base font-bold mb-1">Resumen del Sistema</h3>
        <p className="text-sm text-white/70 leading-relaxed">
          Estado actual de contenidos y solicitudes gestionadas en VIGIIAP.
        </p>
      </div>

      <div className="flex gap-4 shrink-0">
        {isLoading ? (
          <div className="flex items-center justify-center w-24 h-16">
            <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
          </div>
        ) : items ? (
          items.map((stat) => (
            <div key={stat.label} className="bg-white/10 rounded-lg px-4 py-3 text-center min-w-[90px]">
              <span className="block text-xl font-bold text-white">{stat.value}</span>
              <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-white/60 mt-0.5">
                {stat.label}
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-white/60 italic">
            Estadísticas disponibles para administradores.
          </p>
        )}
      </div>
    </motion.div>
  )
}
