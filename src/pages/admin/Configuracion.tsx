import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Save, Globe, Bell, Shield, AlertTriangle, Scale,
  Mail, Phone, MapPin, CheckCircle, AlertCircle, ArrowRight,
  Server, Send, Loader2, Eye, EyeOff, Gauge, Network,
  type LucideIcon,
} from 'lucide-react'

import { fadeUpSm, EASE_OUT_EXPO } from '@/lib/animations'
import Card3D from '@/components/ui/Card3D'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { ROLES } from '@/lib/constants/roles'

const fadeUp = fadeUpSm

interface SectionCardProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  delay?: number
}

function SectionCard({ title, icon: Icon, children, delay = 0 }: SectionCardProps) {
  return (
    <Card3D
      disabled
      initial={{ opacity: 0, y: 22, rotateX: 4, scale: 0.97 }}
      animate={{ opacity: 1, y: 0,  rotateX: 0, scale: 1    }}
      transition={{ delay, duration: 0.5, ease: EASE_OUT_EXPO }}
      style={{ transformPerspective: 900 }}
      glow="rgba(26,86,50,0.12)"
      intensity={3}
      className="bg-[var(--card-bg)] border border-border/70 rounded-xl overflow-hidden"
      whileHover={{ y: -3 }}
    >
      <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border bg-bg-alt/40">
        <div className="w-7 h-7 bg-gradient-to-br from-primary-50 to-primary-100 rounded-lg flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-primary-700" />
        </div>
        <h3 className="text-sm font-bold text-text">{title}</h3>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </Card3D>
  )
}

function FieldRow({ label, hint, children }: { label?: string; hint?: string; children?: React.ReactNode }) {
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

interface ToggleProps {
  checked: boolean
  onChange: () => void
  label?: string
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onChange}
        className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 ${checked ? 'bg-primary-800' : 'bg-bg-alt border border-border'}`}
        style={{ height: '22px' }}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0.5'}`}
          style={{ display: 'block' }}
        />
      </button>
      {label && <span className="text-sm text-text">{label}</span>}
    </label>
  )
}

export default function Configuracion() {
  const { user } = useAuth()
  const isSuperAdmin = user?.role === ROLES.SUPER_ADMIN

  const [general, setGeneral] = useState({
    siteName: 'VIGIA-IIAP',
    siteDesc: 'Visor Gestor de Información del Instituto de Investigaciones Ambientales del Pacífico',
    region: 'Chocó Biogeográfico',
    email: 'info@iiap.org.co',
    phone: '+57 (4) 671 1767',
    address: 'Calle 14 No. 1-61, Quibdó, Chocó',
  })

  const [notifs, setNotifs] = useState({
    emailNotifs: true,
    solicitudNotifs: true,
    loginNotifs: false,
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

  // mail_pass nunca llega del backend (ver redactConfig en admin.controller.js) —
  // arranca vacío siempre. Si la persona no escribe una nueva, no se manda en
  // el guardado, para no pisar la que ya está guardada con un string vacío.
  const [smtp, setSmtp] = useState({
    mail_host: '', mail_port: '', mail_secure: false, mail_user: '', mail_pass: '',
  })
  const [mailPassConfigurado, setMailPassConfigurado] = useState(false)
  const [showMailPass, setShowMailPass] = useState(false)
  const [testEmailStatus, setTestEmailStatus] = useState<'ok' | 'error' | null>(null)
  const [testEmailError, setTestEmailError] = useState('')

  // Todos aditivos a su env var — nunca la reemplazan (ver dynamicConfig.js
  // en el backend). Así un error al guardarlos no puede bloquear el acceso
  // al propio panel ni dejar el sitio sin ningún límite de peticiones.
  const [avanzado, setAvanzado] = useState({
    corsExtraOrigins: '',
    rateLimitMax: '',
    adminEmailFallback: '',
  })

  const [politicaPrivacidad, setPoliticaPrivacidad] = useState('')

  const [saveStatus, setSaveStatus] = useState<'ok' | 'error' | null>(null)

  // ── Load config from API ──
  const { data: remoteConfig } = useQuery({
    queryKey: ['admin', 'configuracion'],
    queryFn: () => api.get('/admin/configuracion'),
    select: (res) => res.data,
    staleTime: 60_000,
  })

  useEffect(() => {
    if (!remoteConfig) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync intencional al llegar la config remota
    setGeneral((g) => ({
      siteName: remoteConfig.siteName ?? g.siteName,
      siteDesc: remoteConfig.siteDesc ?? g.siteDesc,
      region:   remoteConfig.region   ?? g.region,
      email:    remoteConfig.email    ?? g.email,
      phone:    remoteConfig.phone    ?? g.phone,
      address:  remoteConfig.address  ?? g.address,
    }))
    setNotifs((n) => ({
      emailNotifs:      remoteConfig.emailNotifs      === undefined ? n.emailNotifs      : remoteConfig.emailNotifs      === 'true',
      solicitudNotifs:  remoteConfig.solicitudNotifs  === undefined ? n.solicitudNotifs  : remoteConfig.solicitudNotifs  === 'true',
      loginNotifs:      remoteConfig.loginNotifs      === undefined ? n.loginNotifs      : remoteConfig.loginNotifs      === 'true',
    }))
    setRoles((r) => ({
      publicoCanSolicitar:   remoteConfig.publicoCanSolicitar   === undefined ? r.publicoCanSolicitar   : remoteConfig.publicoCanSolicitar   === 'true',
      investigadorCanUpload: remoteConfig.investigadorCanUpload === undefined ? r.investigadorCanUpload : remoteConfig.investigadorCanUpload === 'true',
      requireApproval:       remoteConfig.requireApproval       === undefined ? r.requireApproval       : remoteConfig.requireApproval       === 'true',
    }))
    setMantenimiento((m) => ({
      modoMantenimiento: remoteConfig.modoMantenimiento === 'true',
      mensaje: remoteConfig.mensajeMantenimiento ?? m.mensaje,
    }))
    if (remoteConfig.politicaPrivacidad !== undefined) {
      setPoliticaPrivacidad(remoteConfig.politicaPrivacidad ?? '')
    }
    setSmtp((s) => ({
      ...s,
      mail_host:   remoteConfig.mail_host   ?? s.mail_host,
      mail_port:   remoteConfig.mail_port   ?? s.mail_port,
      mail_secure: remoteConfig.mail_secure === undefined ? s.mail_secure : remoteConfig.mail_secure === 'true',
      mail_user:   remoteConfig.mail_user   ?? s.mail_user,
      // mail_pass queda fuera a propósito — nunca llega del backend.
    }))
    setMailPassConfigurado(Boolean(remoteConfig.mail_pass_configurado))
    setAvanzado((a) => ({
      corsExtraOrigins:   remoteConfig.cors_extra_origins   ?? a.corsExtraOrigins,
      rateLimitMax:       remoteConfig.rate_limit_max       ?? a.rateLimitMax,
      adminEmailFallback: remoteConfig.admin_email_fallback ?? a.adminEmailFallback,
    }))
  }, [remoteConfig])

  // ── Save mutation ──
  const saveMutation = useMutation<unknown, Error, Record<string, unknown>>({
    mutationFn: (body) => api.put('/admin/configuracion', body),
    onSuccess: () => {
      setSaveStatus('ok')
      setTimeout(() => setSaveStatus(null), 3000)
    },
    onError: () => {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus(null), 4000)
    },
  })

  const handleSave = () => {
    saveMutation.mutate({
      ...general,
      emailNotifs:           String(notifs.emailNotifs),
      solicitudNotifs:       String(notifs.solicitudNotifs),
      loginNotifs:           String(notifs.loginNotifs),
      publicoCanSolicitar:   String(roles.publicoCanSolicitar),
      investigadorCanUpload: String(roles.investigadorCanUpload),
      requireApproval:       String(roles.requireApproval),
      // Modo mantenimiento, política de privacidad y SMTP son exclusivos de
      // super_admin — el backend rechaza toda la petición si cualquiera de
      // estas claves llega de un admin_sig, así que ni siquiera se incluyen
      // en el payload para el resto de roles.
      ...(isSuperAdmin ? {
        modoMantenimiento:    String(mantenimiento.modoMantenimiento),
        mensajeMantenimiento: mantenimiento.mensaje,
        politicaPrivacidad,
        mail_host: smtp.mail_host,
        mail_port: smtp.mail_port,
        mail_secure: smtp.mail_secure,
        mail_user: smtp.mail_user,
        // Campo vacío = "no la estoy cambiando" — nunca se manda para no
        // pisar la contraseña ya guardada con un string vacío.
        ...(smtp.mail_pass ? { mail_pass: smtp.mail_pass } : {}),
        cors_extra_origins:   avanzado.corsExtraOrigins,
        rate_limit_max:       avanzado.rateLimitMax,
        admin_email_fallback: avanzado.adminEmailFallback,
      } : {}),
    })
  }

  const testEmailMutation = useMutation<unknown, Error>({
    mutationFn: () => api.post('/admin/configuracion/probar-correo'),
    onSuccess: () => {
      setTestEmailStatus('ok')
      setTimeout(() => setTestEmailStatus(null), 4000)
    },
    onError: (err) => {
      setTestEmailStatus('error')
      setTestEmailError((err as Error)?.message || 'No se pudo enviar el correo de prueba.')
      setTimeout(() => setTestEmailStatus(null), 6000)
    },
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div {...fadeUp(0)} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
          <h1 className="font-display text-2xl font-bold text-text mt-0.5">Configuración del Sistema</h1>
          <p className="text-sm text-text-muted mt-1">Ajustes globales de la plataforma VIGIA-IIAP</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shrink-0 disabled:opacity-60 ${
            saveStatus === 'ok'    ? 'bg-green-600 text-white' :
            saveStatus === 'error' ? 'bg-red-600 text-white'   :
            'bg-primary-800 text-white hover:bg-primary-700'
          }`}
        >
          {saveMutation.isPending ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saveStatus === 'ok' ? (
            <CheckCircle className="w-4 h-4" />
          ) : saveStatus === 'error' ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saveStatus === 'ok' ? '¡Guardado!' : saveStatus === 'error' ? 'Error al guardar' : 'Guardar Cambios'}
        </button>
      </motion.div>

      {/* General */}
      <SectionCard title="Información General" icon={Globe} delay={0.08}>
        <FieldRow label="Nombre del Sistema" hint="Nombre visible en el navegador y cabeceras">
          <input
            type="text"
            value={general.siteName}
            onChange={(e) => setGeneral((g) => ({ ...g, siteName: e.target.value }))}
            className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
          />
        </FieldRow>
        <hr className="border-border" />
        <FieldRow label="Descripción" hint="Subtítulo del sistema">
          <input
            type="text"
            value={general.siteDesc}
            onChange={(e) => setGeneral((g) => ({ ...g, siteDesc: e.target.value }))}
            className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
          />
        </FieldRow>
        <hr className="border-border" />
        <FieldRow label="Región de Cobertura">
          <input
            type="text"
            value={general.region}
            onChange={(e) => setGeneral((g) => ({ ...g, region: e.target.value }))}
            className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
          />
        </FieldRow>
        <hr className="border-border" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { key: 'email', label: 'Correo de contacto', icon: Mail },
            { key: 'phone', label: 'Teléfono', icon: Phone },
            { key: 'address', label: 'Dirección', icon: MapPin },
          ] as { key: keyof typeof general; label: string; icon: LucideIcon }[]).map(({ key, label, icon: Ic }) => (
            <div key={key}>
              <label htmlFor={`conf-${key}`} className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5 flex items-center gap-1">
                <Ic className="w-3 h-3" aria-hidden="true" />{label}
              </label>
              <input
                id={`conf-${key}`}
                type="text"
                value={general[key]}
                onChange={(e) => setGeneral((g) => ({ ...g, [key]: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notificaciones" icon={Bell} delay={0.14}>
        <div className="space-y-3">
          {([
            {
              key: 'emailNotifs',
              label: 'Notificaciones por correo electrónico',
              hint: 'Interruptor general de las alertas operativas al equipo admin. Los correos que necesita el propio usuario para completar una acción (verificar su correo, recuperar contraseña, estado de su solicitud) nunca se apagan con esto.',
            },
            {
              key: 'solicitudNotifs',
              label: 'Alertas de nuevas solicitudes',
              hint: 'Avisa por correo al equipo admin cada vez que llega una solicitud nueva.',
            },
            {
              key: 'loginNotifs',
              label: 'Notificar nuevos inicios de sesión',
              hint: 'Cada usuario recibe un correo de seguridad cuando su propia cuenta inicia sesión (con IP y navegador), como en Gmail o GitHub.',
            },
          ] as { key: keyof typeof notifs; label: string; hint: string }[]).map(({ key, label, hint }) => (
            <div key={key} className="flex items-center justify-between gap-4 py-1">
              <div>
                <span className="text-sm text-text">{label}</span>
                <p className="text-xs text-text-muted mt-0.5">{hint}</p>
              </div>
              <Toggle checked={notifs[key]} onChange={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))} label="" />
            </div>
          ))}
        </div>
        <hr className="border-border" />
        <Link
          to="/admin/reportes"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-800 hover:text-primary-600 transition-colors no-underline"
        >
          Generar reporte de actividad (día, semana, mes o año)
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </SectionCard>

      {/* Roles & Permisos */}
      <SectionCard title="Roles y Permisos" icon={Shield} delay={0.2}>
        <div className="space-y-3">
          {([
            { key: 'publicoCanSolicitar', label: 'Usuarios Público pueden enviar solicitudes' },
            { key: 'investigadorCanUpload', label: 'Investigadores pueden subir documentos' },
            { key: 'requireApproval', label: 'Requerir aprobación de administrador para nuevos usuarios' },
          ] as { key: keyof typeof roles; label: string }[]).map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between py-1">
              <span className="text-sm text-text">{label}</span>
              <Toggle checked={roles[key]} onChange={() => setRoles((r) => ({ ...r, [key]: !r[key] }))} label="" />
            </div>
          ))}
        </div>
        <hr className="border-border" />
        <div className="bg-[var(--welcome-bg)] border border-[var(--welcome-border)] rounded-xl p-4">
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-[var(--stats-value)] mb-2">Roles del Sistema</p>
          {[
            { rol: 'Administrador SIG', desc: 'Acceso completo al panel de administración y todos los módulos' },
            { rol: 'Investigador', desc: 'Acceso a mapas, documentos, geovisor, herramientas y solicitudes' },
            { rol: 'Público', desc: 'Solo acceso al inicio de sesión y módulos públicos. Módulos técnicos bloqueados' },
          ].map(({ rol, desc }) => (
            <div key={rol} className="flex items-start gap-2 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--stats-value)] mt-1.5 shrink-0" />
              <div>
                <span className="text-xs font-bold text-[var(--stats-value)]">{rol}: </span>
                <span className="text-xs text-text-muted">{desc}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Correo (SMTP) — exclusivo super_admin: el instituto cambia de proveedor
          de correo de vez en cuando; esto reemplaza tener que tocar variables
          de entorno y redesplegar. */}
      {isSuperAdmin && (
        <SectionCard title="Correo (SMTP)" icon={Server} delay={0.26}>
          <p className="text-xs text-text-muted">
            Configura el servidor de correo que envía verificaciones, recuperación de contraseña,
            alertas de solicitudes y demás notificaciones. Solo Super Administrador puede verlo y
            cambiarlo.
          </p>
          <hr className="border-border" />
          <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr] gap-4">
            <div>
              <label htmlFor="smtp-host" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Servidor (host)</label>
              <input
                id="smtp-host"
                type="text"
                placeholder="smtp.ejemplo.co"
                value={smtp.mail_host}
                onChange={(e) => setSmtp((s) => ({ ...s, mail_host: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
              />
            </div>
            <div>
              <label htmlFor="smtp-port" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Puerto</label>
              <input
                id="smtp-port"
                type="text"
                inputMode="numeric"
                placeholder="587"
                value={smtp.mail_port}
                onChange={(e) => setSmtp((s) => ({ ...s, mail_port: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="smtp-user" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Usuario</label>
              <input
                id="smtp-user"
                type="text"
                placeholder="notificaciones@iiap.org.co"
                value={smtp.mail_user}
                onChange={(e) => setSmtp((s) => ({ ...s, mail_user: e.target.value }))}
                className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
              />
            </div>
            <div>
              <label htmlFor="smtp-pass" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
                Contraseña {mailPassConfigurado && <span className="normal-case font-normal text-text-muted">(ya hay una guardada)</span>}
              </label>
              <div className="relative">
                <input
                  id="smtp-pass"
                  type={showMailPass ? 'text' : 'password'}
                  placeholder={mailPassConfigurado ? '•••••••• (deja vacío para no cambiarla)' : 'Contraseña o clave de aplicación'}
                  value={smtp.mail_pass}
                  onChange={(e) => setSmtp((s) => ({ ...s, mail_pass: e.target.value }))}
                  className="w-full px-3 py-2.5 pr-10 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowMailPass((v) => !v)}
                  aria-label={showMailPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
                >
                  {showMailPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between py-1">
            <div>
              <span className="text-sm text-text">Conexión segura (TLS/SSL)</span>
              <p className="text-xs text-text-muted mt-0.5">Actívalo si el proveedor usa el puerto 465. Para 587 (el más común), déjalo apagado.</p>
            </div>
            <Toggle checked={smtp.mail_secure} onChange={() => setSmtp((s) => ({ ...s, mail_secure: !s.mail_secure }))} label="" />
          </div>
          <hr className="border-border" />
          <div className="flex items-center gap-3 flex-wrap">
            <button
              type="button"
              onClick={() => testEmailMutation.mutate()}
              disabled={testEmailMutation.isPending}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-border text-text hover:border-primary-800 hover:text-primary-800 transition-colors disabled:opacity-60"
            >
              {testEmailMutation.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />}
              Enviar correo de prueba
            </button>
            {testEmailStatus === 'ok' && (
              <span className="inline-flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle className="w-4 h-4" />Enviado — revisa tu bandeja
              </span>
            )}
            {testEmailStatus === 'error' && (
              <span className="inline-flex items-center gap-1.5 text-sm text-red-600">
                <AlertCircle className="w-4 h-4" />{testEmailError}
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted">
            Guarda primero los cambios de arriba — la prueba usa la configuración ya guardada, no lo que esté sin guardar en estos campos.
          </p>
        </SectionCard>
      )}

      {/* Ajustes avanzados — exclusivo super_admin: todos aditivos a su
          variable de entorno correspondiente, nunca la reemplazan. */}
      {isSuperAdmin && (
        <SectionCard title="Ajustes Avanzados" icon={Network} delay={0.29}>
          <p className="text-xs text-text-muted">
            Estos ajustes se suman a los ya fijos en el servidor — nunca los reemplazan. Un valor mal
            guardado aquí no puede bloquear el acceso a la plataforma ni a este panel.
          </p>
          <hr className="border-border" />
          <div>
            <label htmlFor="conf-cors" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Dominios adicionales permitidos (CORS)
            </label>
            <input
              id="conf-cors"
              type="text"
              placeholder="https://otro-dominio.co, https://staging.iiap.org.co"
              value={avanzado.corsExtraOrigins}
              onChange={(e) => setAvanzado((a) => ({ ...a, corsExtraOrigins: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
            />
            <p className="text-xs text-text-muted mt-1">Separados por coma. Se suman a los dominios ya configurados en el servidor.</p>
          </div>
          <hr className="border-border" />
          <FieldRow label="Límite de peticiones" hint="Peticiones permitidas por usuario sin sesión en la ventana de tiempo del servidor. Vacío = usar el valor del servidor.">
            <div className="flex items-center gap-2 max-w-[160px]">
              <Gauge className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
              <input
                id="conf-rate-limit"
                type="text"
                inputMode="numeric"
                placeholder="100"
                value={avanzado.rateLimitMax}
                onChange={(e) => setAvanzado((a) => ({ ...a, rateLimitMax: e.target.value.replace(/\D/g, '') }))}
                className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
              />
            </div>
          </FieldRow>
          <hr className="border-border" />
          <div>
            <label htmlFor="conf-admin-fallback" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Correo de respaldo para alertas admin
            </label>
            <input
              id="conf-admin-fallback"
              type="text"
              placeholder="respaldo@iiap.org.co"
              value={avanzado.adminEmailFallback}
              onChange={(e) => setAvanzado((a) => ({ ...a, adminEmailFallback: e.target.value }))}
              className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition"
            />
            <p className="text-xs text-text-muted mt-1">Solo se usa si no hay ningún administrador activo en el sistema — un respaldo para ese caso.</p>
          </div>
        </SectionCard>
      )}

      {/* Mantenimiento — exclusivo super_admin: apaga la plataforma para todos */}
      {isSuperAdmin && (
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
              <div className="bg-[var(--note-bg)] border border-[var(--note-border)] rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-4 h-4 text-[var(--note-text)] shrink-0 mt-0.5" />
                <p className="text-xs text-[var(--note-text)]">El modo mantenimiento está activo. Los usuarios no administradores verán el mensaje configurado.</p>
              </div>
              <div>
                <label htmlFor="conf-mant-msg" className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">Mensaje de mantenimiento</label>
                <textarea
                  id="conf-mant-msg"
                  rows={3}
                  value={mantenimiento.mensaje}
                  onChange={(e) => setMantenimiento((m) => ({ ...m, mensaje: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm focus:outline-none focus:border-primary-800 transition resize-none"
                />
              </div>
            </motion.div>
          )}
        </SectionCard>
      )}

      {/* Política de privacidad — exclusivo super_admin */}
      {isSuperAdmin && (
        <SectionCard title="Política de Tratamiento de Datos Personales" icon={Scale} delay={0.32}>
          <p className="text-xs text-text-muted">
            Este texto se muestra públicamente en <code className="text-[0.7rem]">/terminos</code> y
            es lo que respalda el cumplimiento de la Ley 1581 de 2012. Solo Super Administrador
            puede editarlo — el backend rechaza el cambio si lo intenta cualquier otro rol.
          </p>
          <textarea
            rows={12}
            value={politicaPrivacidad}
            onChange={(e) => setPoliticaPrivacidad(e.target.value)}
            placeholder="Responsable del tratamiento, datos que se recolectan, finalidad, derechos ARCO, cómo ejercerlos, autorización y vigencia. Separe cada apartado con una línea en blanco — así se muestran como párrafos independientes."
            className="w-full px-3 py-2.5 bg-[var(--card-bg)] border border-border rounded-lg text-sm font-mono leading-relaxed focus:outline-none focus:border-primary-800 transition resize-y"
          />
        </SectionCard>
      )}

    </div>
  )
}
