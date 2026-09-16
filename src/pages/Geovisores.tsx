import { motion } from 'framer-motion'
import { Globe, Construction } from 'lucide-react'
import { fadeUp } from '@/lib/animations'

/**
 * Portal de Geovisores — placeholder honesto mientras se construye el módulo real
 * (conectado a GeoServer vía el módulo `geovisores` de VIGIIAP-backend, no una
 * maqueta). Reemplaza la página anterior, que solo mostraba datos de ejemplo
 * sin ninguna conexión real y ya no representa hacia dónde va este módulo.
 */
export default function Geovisores() {
  return (
    <div className="flex-1 flex items-center justify-center min-h-[70vh] px-6" style={{ background: 'var(--shell-bg)' }}>
      <motion.div {...fadeUp(0)} className="max-w-md text-center flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-primary-800/10 flex items-center justify-center">
          <Globe className="w-8 h-8 text-primary-800" aria-hidden="true" />
        </div>
        <h1 className="text-2xl font-bold text-text">Portal de Geovisores</h1>
        <p className="text-sm text-text-muted leading-relaxed">
          Estamos construyendo el módulo real de geovisores temáticos, conectado en vivo a
          GeoServer — capas reales, leyendas reales, sin datos de ejemplo. Vuelve pronto.
        </p>
        <div className="flex items-center gap-2 text-xs text-text-muted/80 mt-1">
          <Construction className="w-3.5 h-3.5" aria-hidden="true" />
          <span>En desarrollo</span>
        </div>
      </motion.div>
    </div>
  )
}
