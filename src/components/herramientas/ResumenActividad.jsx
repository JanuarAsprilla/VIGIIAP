import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/animations'

const STATS = [
  { value: '24',   label: 'Capas Activas'     },
  { value: '1.2GB', label: 'Datos Procesados' },
  { value: '98%',  label: 'Precisión SIG'     },
]

export default function ResumenActividad() {
  return (
    <motion.div
      {...fadeUp(0.5)}
      className="bg-primary-800 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6"
    >
      <div className="flex-1 text-white">
        <h3 className="text-base font-bold mb-1">Resumen de Actividad Técnica</h3>
        <p className="text-sm text-white/70 leading-relaxed">
          Has realizado 12 análisis espaciales esta semana. El almacenamiento
          de geodatos está al 65% de su capacidad.
        </p>
      </div>

      <div className="flex gap-4 shrink-0">
        {STATS.map((stat) => (
          <div key={stat.label} className="bg-white/10 rounded-lg px-4 py-3 text-center min-w-[90px]">
            <span className="block text-xl font-bold text-white">{stat.value}</span>
            <span className="block text-[0.6rem] font-bold uppercase tracking-wider text-white/60 mt-0.5">
              {stat.label}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
