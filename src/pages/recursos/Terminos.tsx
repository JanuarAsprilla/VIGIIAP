import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import Card3D from '@/components/ui/Card3D'
import api from '@/lib/api'

const TERMINOS_USO_FALLBACK = `Al acceder y utilizar la plataforma VIGIA-IIAP del Instituto de Investigaciones Ambientales del Pacífico (IIAP), usted acepta cumplir con estos términos y condiciones de uso. Si no está de acuerdo, le solicitamos abstenerse de utilizar el sistema.

El sistema VIGIA-IIAP está destinado exclusivamente para fines de investigación, gestión territorial y toma de decisiones ambientales. Queda prohibido el uso de la información con fines comerciales no autorizados.

Toda la cartografía, datos estadísticos, documentos y contenido del sistema son propiedad del IIAP y están protegidos por la legislación colombiana de derechos de autor. La descarga de materiales se autoriza únicamente para uso institucional y académico.

El IIAP se esfuerza por mantener la información actualizada y precisa, pero no garantiza la ausencia de errores. El usuario es responsable de verificar la información antes de utilizarla en procesos oficiales.`

interface PublicConfig { terminosUso?: string | null }

export default function Terminos() {
  // Misma fuente de datos que /politica-privacidad (config pública editable
  // desde el panel de administración) -- terminosUso es un campo propio,
  // independiente de politicaPrivacidad, aunque comparten el mismo patrón.
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'configuracion'],
    queryFn: () => api.get('/public/configuracion') as Promise<PublicConfig>,
    staleTime: 5 * 60_000,
  })

  const terminosTexto = data?.terminosUso?.trim() || TERMINOS_USO_FALLBACK
  const parrafos = terminosTexto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="page-header-tag block mb-2">Legal</span>
        <h1 className="page-header-title mb-3">Términos de Uso</h1>
        <p className="page-header-description max-w-2xl">
          Condiciones generales de uso del sistema VIGIA-IIAP.
        </p>
      </motion.div>

      <Card3D
        initial={{ opacity: 0, y: 24, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.08, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformPerspective: 900 }}
        glow="rgba(26,86,50,0.12)"
        intensity={3}
        className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-8 max-w-3xl mx-auto"
        whileHover={{ y: -2 }}
      >
        <div className="prose prose-sm max-w-none space-y-5 text-text-light leading-relaxed">
          {isLoading ? (
            <div className="space-y-2 animate-pulse" aria-hidden="true">
              <div className="h-3 bg-bg-alt rounded w-full" />
              <div className="h-3 bg-bg-alt rounded w-11/12" />
              <div className="h-3 bg-bg-alt rounded w-4/5" />
            </div>
          ) : (
            parrafos.map((parrafo, i) => <p key={i}>{parrafo}</p>)
          )}
        </div>
      </Card3D>

      <Card3D
        initial={{ opacity: 0, y: 24, rotateX: 4, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
        transition={{ delay: 0.14, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ transformPerspective: 900 }}
        glow="rgba(26,86,50,0.12)"
        intensity={3}
        className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-8 max-w-3xl mx-auto"
        whileHover={{ y: -2 }}
      >
        <div className="prose prose-sm max-w-none space-y-5 text-text-light leading-relaxed">
          <h3 className="text-lg font-bold text-text">Tratamiento de datos personales</h3>
          <p>
            El tratamiento de sus datos personales, incluidos los obtenidos al iniciar sesión con
            Google o Microsoft, se describe en detalle en nuestra{' '}
            <Link to="/politica-privacidad" className="font-semibold text-primary-800 hover:underline">
              Política de Privacidad
            </Link>.
          </p>

          <h3 className="text-lg font-bold text-text">Contacto</h3>
          <p>Para consultas sobre estos términos, escriba a <strong>info@iiap.org.co</strong> o comuníquese al teléfono +57 (4) 671 1127, Quibdó, Chocó, Colombia.</p>
        </div>
      </Card3D>
    </div>
  )
}
