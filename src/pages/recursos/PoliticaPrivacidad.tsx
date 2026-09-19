import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'
import Card3D from '@/components/ui/Card3D'
import api from '@/lib/api'

const POLITICA_PRIVACIDAD_FALLBACK = `En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013 de la República de Colombia, el IIAP informa lo siguiente sobre el tratamiento de sus datos personales:

Responsable del tratamiento: Instituto de Investigaciones Ambientales del Pacífico "John von Neumann" (IIAP), Calle 14 No. 1-61, Quibdó, Chocó, Colombia. Contacto: info@iiap.org.co, teléfono +57 (4) 671 1127.

Datos que se recolectan: Nombre, correo electrónico, institución y motivo de acceso al solicitar una cuenta; adicionalmente, dirección IP y registros de actividad de la sesión, con fines exclusivos de seguridad y auditoría del sistema. No se recolectan datos sensibles (salud, biometría, creencias) ni datos de menores de edad.

Finalidad del tratamiento: Sus datos se usan para gestionar el acceso a la plataforma y verificar su vínculo institucional, habilitar los módulos correspondientes a su rol, enviarle notificaciones sobre solicitudes, cambios de cuenta o de contraseña, y mantener registros de auditoría y seguridad del sistema. No se usan con fines comerciales ni se venden ni comparten con terceros ajenos a la operación del IIAP.

Sus derechos como titular: Usted tiene derecho a conocer qué datos suyos tiene el IIAP (acceso), solicitar la corrección de datos desactualizados o inexactos (rectificación), solicitar la eliminación de sus datos cuando no exista un deber legal o contractual de conservarlos (cancelación/supresión), y oponerse a un tratamiento específico de sus datos (oposición).

Cómo ejercer sus derechos: Escriba a info@iiap.org.co indicando claramente el derecho que desea ejercer y el correo con el que está registrado. Las consultas se resuelven en un máximo de 10 días hábiles y los reclamos en un máximo de 15 días hábiles, plazos que la ley permite prorrogar hasta 8 días hábiles adicionales si se le informa oportunamente el motivo de la demora. Desde su perfil dentro de la plataforma también puede consultar y corregir directamente sus datos de contacto.

Autorización y vigencia: Al marcar la casilla de aceptación en el formulario de solicitud de acceso, usted otorga autorización previa, expresa e informada para el tratamiento aquí descrito. Sus datos se conservan mientras su cuenta permanezca activa y el tiempo adicional que exijan obligaciones legales aplicables. El IIAP aplica medidas técnicas razonables para proteger su información (cifrado de contraseñas, control de acceso por roles, registros de auditoría), sin que ello constituya una garantía absoluta frente a cualquier incidente de seguridad.`

interface PublicConfig { politicaPrivacidad?: string | null }

export default function PoliticaPrivacidad() {
  // Misma fuente de datos que /terminos (config pública editable desde el
  // panel de administración) — una sola política administrada en un solo
  // lugar, mostrada aquí en su propia URL para cumplir el requisito de
  // verificación de marca OAuth de Google/Microsoft, que exige un enlace de
  // Política de Privacidad distinto al de Términos de Uso.
  const { data, isLoading } = useQuery({
    queryKey: ['public', 'configuracion'],
    queryFn: () => api.get('/public/configuracion') as Promise<PublicConfig>,
    staleTime: 5 * 60_000,
  })

  const politicaTexto = data?.politicaPrivacidad?.trim() || POLITICA_PRIVACIDAD_FALLBACK
  const parrafos = politicaTexto.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="page-header-tag block mb-2">Legal</span>
        <h1 className="page-header-title mb-3">Política de Privacidad</h1>
        <p className="page-header-description max-w-2xl">
          Tratamiento de datos personales en el sistema VIGIA-IIAP.
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
          <h3 className="text-lg font-bold text-text">Inicio de sesión con Google o Microsoft</h3>
          <p>
            Cuando usted inicia sesión con su cuenta de Google o Microsoft, únicamente obtenemos su
            nombre, correo electrónico y foto de perfil públicos, provistos directamente por ese
            proveedor con su autorización explícita. Esta información se usa exclusivamente para
            autenticarlo y crear o vincular su cuenta institucional en VIGIA-IIAP — no se comparte
            con terceros ni se usa con fines distintos a la operación del sistema. Usted puede
            revocar el acceso de VIGIA-IIAP a su cuenta de Google o Microsoft en cualquier momento
            desde la configuración de seguridad de esa cuenta.
          </p>

          <h3 className="text-lg font-bold text-text">Contacto</h3>
          <p>Para consultas sobre el tratamiento de sus datos personales, escriba a <strong>info@iiap.org.co</strong> o comuníquese al teléfono +57 (4) 671 1127, Quibdó, Chocó, Colombia.</p>
        </div>
      </Card3D>
    </div>
  )
}
