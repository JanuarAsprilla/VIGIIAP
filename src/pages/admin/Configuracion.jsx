import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Save, Globe, Bell, Shield, AlertTriangle,
  Mail, Phone, MapPin, Info,
} from 'lucide-react'

const fadeUp = (d = 0) => ({ initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: d, ease: [0.22, 1, 0.36, 1] } })

function SectionCard({ title, icon: Icon, children, delay = 0 }) {
  return (
    <motion.div {...fadeUp(delay)} className="bg-white border border-border rounded-xl overflow-hidden">
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-bg-alt/40">
        <div className="w-7 h-7 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary-700" />
        </div>
        <h3 className="text-sm font-bold text-text">{title}</h3>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </motion.div>
  )
}

function FieldRow({ label, hint, children }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-3 items-start">
      <div>
        <p className="text-sm font-semibold text-text">{label}</p>
        {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function Toggle({ checked, onChange, label }) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <div
        onClick={onChange}
        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 ${checked ? 'bg-primary-800' : 'bg-gray-200'}`}
        style={{ height: '22px' }}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
          style={{ display: 'block' }}
        />
      </div>
      <span className="text-sm text-text">{label}</span>
    </label>
  )
}

export default function Configuracion() {
  const [general, setGeneral] = useState({
    siteName: 'VIGIIAP',
    siteDesc: 'Visor y Gestor de Información Ambiental del IIAP',
    region: 'Chocó Biogeográfico',
    email: 'info@iiap.org.co',
    phone: '+57 (4) 671 1767',
    address: 'Calle 14 No. 1-61, Quibdó, Chocó',
  })

  const [notifs, setNotifs] = useState({
    emailNotifs: true,
    solicitudNotifs: true,
    loginNotifs: false,
    reportesSemanal: true,
  })

  const [roles, setRoles] = useState({
    publicoCanSolicitar: true,
    investigadorCanUpload: true,
    requireApproval: true,
  })

  const [mantenimiento, setMantenimiento] = useState({
    modoMantenimiento: false,
    mensaje: 'El sistema estará en mantenimiento programado. Disculpe las molestias.',
  })

  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest text-primary-700">Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Configuración del Sistema</h1>
          <p className="text-sm text-text-muted mt-1">Ajustes globales de la plataforma VIGIIAP</p>
        </div>
        <button
          onClick={handleSave}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 ${saved ? 'bg-green-600 text-white' : 'bg-primary-800 text-white hover:bg-primary-700'}`}
        >
          <Save className="w-4 h-4" />
          {saved ? '¡Guardado!' : 'Guardar Cambios'}
        </button>
      </motion.div>

      {/* General */}
      <SectionCard title="Información General" icon={Globe} delay={0.08}>
        <FieldRow label="Nombre del Sistema" hint="Nombre visible en el navegador y cabeceras">
          <input
            type="text"
            value={general.siteName}
            onChange={(e) => setGeneral((g) => ({ ...g, siteName: e.target.value }))}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
          />
        </FieldRow>
        <hr className="border-border" />
        <FieldRow label="Descripción" hint="Subtítulo del sistema">
          <input
            type="text"
            value={general.siteDesc}
            onChange={(e) => setGeneral((g) => ({ ...g, siteDesc: e.target.value }))}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
          />
        </FieldRow>
        <hr className="border-border" />
        <FieldRow label="Región de Cobertura">
          <input
            type="text"
            value={general.region}
            onChange={(e) => setGeneral((g) => ({ ...g, region: e.target.value }))}
            className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
          />
        </FieldRow>
        <hr className="border-border" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { key: 'email', label: 'Correo de contacto', icon: Mail },
            { key: 'phone', label: 'Teléfono', icon: Phone },
            { key: 'address', label: 'Dirección', icon: MapPin },
          ].map(({ key, label, icon: Ic }) => (
            <div key={key}>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
                <Ic className="w-3 h-3" />{label}
              </label>
              <input
                type="text"
                value={general[key]}
                onChange={(e) => setGeneral((g) => ({ ...g, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notificaciones" icon={Bell} delay={0.14}>
        <div className="space-y-3">
          {[
            { key: 'emailNotifs', label: 'Notificaciones por correo electrónico' },
            { key: 'solicitudNotifs', label: 'Alertas de nuevas solicitudes' },
            { key: 'loginNotifs', label: 'Notificar nuevos inicios de sesión' },
            { key: 'reportesSemanal', label: 'Reporte semanal de actividad' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-text">{label}</span>
              <Toggle checked={notifs[key]} onChange={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))} label="" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Roles & Permisos */}
      <SectionCard title="Roles y Permisos" icon={Shield} delay={0.2}>
        <div className="space-y-3">
          {[
            { key: 'publicoCanSolicitar', label: 'Usuarios Público pueden enviar solicitudes' },
            { key: 'investigadorCanUpload', label: 'Investigadores pueden subir documentos' },
            { key: 'requireApproval', label: 'Requerir aprobación de administrador para nuevos usuarios' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-text">{label}</span>
              <Toggle checked={roles[key]} onChange={() => setRoles((r) => ({ ...r, [key]: !r[key] }))} label="" />
            </div>
          ))}
        </div>
        <hr className="border-border" />
        <div className="bg-primary-50 rounded-xl p-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-primary-700 mb-2">Roles del Sistema</p>
          {[
            { rol: 'Administrador SIG', desc: 'Acceso completo al panel de administración y todos los módulos' },
            { rol: 'Investigador', desc: 'Acceso a mapas, documentos, geovisor, herramientas y solicitudes' },
            { rol: 'Público', desc: 'Solo acceso a noticias e inicio de sesión. Módulos técnicos bloqueados' },
          ].map(({ rol, desc }) => (
            <div key={rol} className="flex items-start gap-2 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-700 mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-primary-800">{rol}: </span>
                <span className="text-xs text-text-muted">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Mantenimiento */}
      <SectionCard title="Modo Mantenimiento" icon={AlertTriangle} delay={0.26}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-text">Activar modo mantenimiento</p>
            <p className="text-xs text-text-muted">Muestra un aviso a todos los usuarios no administradores</p>
          </div>
          <Toggle
            checked={mantenimiento.modoMantenimiento}
            onChange={() => setMantenimiento((m) => ({ ...m, modoMantenimiento: !m.modoMantenimiento }))}
            label=""
          />
        </div>
        {mantenimiento.modoMantenimiento && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">El modo mantenimiento está activo. Los usuarios no administradores verán el mensaje configurado.</p>
            </div>
            <div>
              <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Mensaje de mantenimiento</label>
              <textarea
                rows={3}
                value={mantenimiento.mensaje}
                onChange={(e) => setMantenimiento((m) => ({ ...m, mensaje: e.target.value }))}
                className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition resize-none"
              />
            </div>
          </motion.div>
        )}
      </SectionCard>

      {/* Info */}
      <motion.div {...fadeUp(0.32)} className="bg-primary-50 border border-primary-200/60 rounded-xl p-5 flex gap-3">
        <Info className="w-4 h-4 text-primary-700 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-primary-800">VIGIIAP — Fase 1 Frontend</p>
          <p className="text-xs text-primary-700/80 mt-0.5">
            Los cambios de configuración en esta fase son de demostración. En Fase 2 (backend), se conectarán al API REST con persistencia en PostgreSQL.
          </p>
        </div>
      </motion.div>
    </div>
  )
}
