import { Link } from 'react-router-dom'

interface Fila { nombre: string; duracion: string; finalidad: string }

const COOKIES_NECESARIAS: Fila[] = [
  { nombre: 'vigiiap_token', duracion: '15 minutos (8 horas en acceso de visitante)', finalidad: 'Mantiene tu sesión iniciada' },
  { nombre: 'vigiiap_refresh', duracion: '30 días', finalidad: 'Renueva la sesión sin pedirte la contraseña de nuevo' },
  { nombre: 'vigiiap_2fa_temp', duracion: '15 minutos', finalidad: 'Paso intermedio del inicio de sesión con segundo factor' },
  { nombre: 'vigiiap_expired_temp', duracion: '15 minutos', finalidad: 'Paso intermedio para cambiar una contraseña vencida' },
  { nombre: 'vigiiap_oauth_csrf, vigiiap_oauth_cv', duracion: 'Minutos (solo durante el flujo)', finalidad: 'Protegen el inicio de sesión con Google o Microsoft contra falsificación' },
]

const ALMACENAMIENTO_LOCAL: Fila[] = [
  { nombre: 'vigiiap_theme_v1', duracion: 'Hasta que lo borres', finalidad: 'Recordar el tema claro u oscuro' },
  { nombre: 'vigiiap_notif_enabled_v1', duracion: 'Hasta que lo borres', finalidad: 'Recordar si activaste las notificaciones' },
  { nombre: 'vigiiap:welcome-seen, vigiiap:aviso-privacidad-v1', duracion: 'Hasta que lo borres', finalidad: 'No repetir el mensaje de bienvenida ni este aviso' },
  { nombre: 'vigiiap:*-cols', duracion: 'Hasta que lo borres', finalidad: 'Recordar cuántas columnas muestra cada listado' },
  { nombre: 'choco_*', duracion: 'Hasta que lo borres o cambie la versión', finalidad: 'Guardar en tu equipo las estadísticas del Panel Chocó (datos del DANE, no tuyos) para no descargarlas de nuevo' },
  { nombre: 'vigiiap_analytics_session', duracion: 'Hasta cerrar la pestaña o 30 minutos de inactividad', finalidad: 'Identificador aleatorio y anónimo de la visita, para contar visitas sin saber quién eres' },
  { nombre: 'vigiiap:preload-error-reload, vigiiap:chunk-reload-attempted', duracion: 'Hasta cerrar la pestaña', finalidad: 'Evitar un bucle de recarga si una actualización falla' },
]

function Tabla({ titulo, filas }: { titulo: string; filas: Fila[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border-collapse">
        <caption className="sr-only">{titulo}</caption>
        <thead>
          <tr className="border-b border-border text-text">
            <th scope="col" className="py-2 pr-4 font-semibold">Nombre</th>
            <th scope="col" className="py-2 pr-4 font-semibold">Duración</th>
            <th scope="col" className="py-2 font-semibold">Para qué sirve</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((f) => (
            <tr key={f.nombre} className="border-b border-border/60 align-top">
              <td className="py-2 pr-4 font-mono text-[11px] text-text break-all">{f.nombre}</td>
              <td className="py-2 pr-4 text-text-muted">{f.duracion}</td>
              <td className="py-2 text-text-muted">{f.finalidad}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function PoliticaCookies() {
  return (
    <div className="space-y-8">
      <div>
        <span className="page-header-tag block mb-2">Legal</span>
        <h1 className="page-header-title mb-3">Política de Cookies</h1>
        <p className="page-header-description max-w-2xl">
          Qué cookies y almacenamiento local usa VIGIA-IIAP, para qué y cómo controlarlos.
        </p>
      </div>

      <div className="bg-[var(--card-bg)] border border-border/70 rounded-xl p-8 max-w-3xl mx-auto space-y-6 text-sm text-text-light leading-relaxed">
        <p>
          VIGIA-IIAP <strong>no usa cookies publicitarias</strong>, no se integra con redes sociales y no envía los datos de
          uso a servicios de analítica de terceros. Solo usa las cookies y el almacenamiento local estrictamente necesarios
          para que la plataforma funcione, y unas pocas preferencias que tú controlas.
        </p>

        <section aria-labelledby="cookies-necesarias" className="space-y-3">
          <h2 id="cookies-necesarias" className="text-lg font-bold text-text">Cookies estrictamente necesarias</h2>
          <p>
            Se crean al iniciar sesión o durante un trámite de seguridad. Son indispensables para mantener tu sesión y
            proteger tu cuenta, por eso no requieren que las aceptes. Todas son <code>HttpOnly</code> (los scripts de la
            página no pueden leerlas), <code>Secure</code> (solo viajan por HTTPS) y <code>SameSite=Lax</code>.
          </p>
          <Tabla titulo="Cookies estrictamente necesarias" filas={COOKIES_NECESARIAS} />
        </section>

        <section aria-labelledby="almacenamiento" className="space-y-3">
          <h2 id="almacenamiento" className="text-lg font-bold text-text">Almacenamiento local de tu navegador</h2>
          <Tabla titulo="Almacenamiento local" filas={ALMACENAMIENTO_LOCAL} />
        </section>

        <section aria-labelledby="analitica" className="space-y-2">
          <h2 id="analitica" className="text-lg font-bold text-text">Analítica de uso</h2>
          <p>
            Para saber cómo se usa la plataforma y mejorarla registramos las páginas visitadas, el tipo de dispositivo, el
            navegador, el sitio de referencia, la dirección IP y la ubicación aproximada que se deduce de ella (país,
            departamento y ciudad) con una base de datos local. <strong>No se envía a terceros ni se vincula con tu cuenta</strong>,
            aunque hayas iniciado sesión. La IP se elimina a los 90 días y el resto de la información de la visita a los 2 años.
          </p>
        </section>

        <section aria-labelledby="terceros" className="space-y-2">
          <h2 id="terceros" className="text-lg font-bold text-text">Servicios de terceros que reciben tu IP</h2>
          <p>
            Para mostrar los mapas, tu navegador descarga imágenes directamente de OpenStreetMap, OpenTopoMap y Esri /
            ArcGIS Online, y las miniaturas de biodiversidad de GBIF. Esos proveedores reciben tu dirección IP y la zona que
            consultas, y aplican sus propias políticas. Si decides iniciar sesión con Google o Microsoft, esas empresas
            también la reciben. No controlamos las cookies que establezcan en sus propios dominios.
          </p>
        </section>

        <section aria-labelledby="control" className="space-y-2">
          <h2 id="control" className="text-lg font-bold text-text">Cómo controlarlas</h2>
          <p>
            Desde tu navegador puedes ver, bloquear o borrar las cookies y el almacenamiento local en cualquier momento
            (Configuración → Privacidad). Si bloqueas las cookies necesarias no podrás iniciar sesión. El tema y las
            preferencias se restablecen al borrar los datos del sitio.
          </p>
        </section>

        <p>
          Más información sobre el tratamiento de tus datos en la{' '}
          <Link to="/politica-privacidad" className="font-semibold text-primary-800 hover:underline">Política de Privacidad</Link>.
          Consultas: <strong>info@iiap.org.co</strong>.
        </p>
      </div>
    </div>
  )
}
