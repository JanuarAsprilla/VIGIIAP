import React, { useState, useRef, useEffect } from 'react'
import type { FormErrors } from '@/types/forms'
import { validatePasswordStrength, validatePasswordMatch, passwordCriteria } from '@/lib/validators'
import { motion, AnimatePresence } from 'framer-motion'
import { fadeUpSm } from '@/lib/animations'
import {
  User, Building2, Shield,
  Lock, Eye, EyeOff, CheckCircle, AlertCircle,
  Camera, LogOut, ChevronRight, Layers, Monitor, Sun,
  Smartphone, Laptop, Trash2, RefreshCw, Loader2,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useUI, type NotifPrefs } from '@/contexts/UIContext'
import { useNavigate, Link } from 'react-router-dom'
import { useUpdatePassword, useUpdatePerfil, useUpdateAvatar } from '@/hooks/useUsuarios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import Avatar from '@/components/ui/Avatar'

const fadeUp = fadeUpSm

// ── Section wrapper ──
interface SectionProps { title: string; description?: string; children: React.ReactNode }
function Section({ title, description, children }: SectionProps) {
  return (
    <div className="bg-[var(--card-bg)] border border-border rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-border">
        <h3 className="font-semibold text-text">{title}</h3>
        {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Field row ──
function FieldRow({ label, value, editable, onEdit, children }: { label: string; value?: string; editable?: boolean; onEdit?: () => void; children?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
        {children ?? <p className="text-sm text-text font-medium">{value}</p>}
      </div>
      {editable && (
        <button
          type="button"
          onClick={onEdit}
          className="text-xs text-primary-800 font-semibold shrink-0 cursor-pointer hover:text-primary-600 transition-colors"
        >
          Editar
        </button>
      )}
    </div>
  )
}

// ── Password strength meter ──
function PasswordStrengthMeter({ value }: { value: string }) {
  const criteria = passwordCriteria(value)
  const met      = Object.values(criteria).filter(Boolean).length
  if (!value) return null
  const bars = [
    met <= 1 ? 'bg-red-400'   : 'bg-bg-alt',
    met >= 2 ? 'bg-amber-400' : 'bg-bg-alt',
    met >= 3 ? 'bg-amber-400' : 'bg-bg-alt',
    met >= 4 ? 'bg-green-500' : 'bg-bg-alt',
  ]
  const label =
    met <= 1 ? { text: 'Muy débil',  color: 'text-red-500'   } :
    met === 2 ? { text: 'Débil',     color: 'text-amber-500' } :
    met === 3 ? { text: 'Moderada',  color: 'text-amber-600' } :
               { text: 'Segura',     color: 'text-green-600' }
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {bars.map((cls, i) => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${cls}`} />
        ))}
      </div>
      <p className={`text-xs font-semibold ${label.color}`}>{label.text}</p>
    </motion.div>
  )
}

// ── Password section ──
interface PasswordInputProps {
  id: string; placeholder: string; value: string; visible: boolean
  error?: string; onChange: (value: string) => void; onToggle: () => void
}
function PasswordInput({ id, placeholder, value, visible, error, onChange, onToggle }: PasswordInputProps) {
  const cls = `w-full pl-10 pr-10 py-2.5 border rounded-xl text-sm text-text placeholder:text-text-muted bg-[var(--card-bg)] focus:outline-none focus:ring-2 transition ${
    error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
          : 'border-border focus:border-primary-800 focus:ring-primary-800/10'
  }`
  return (
    <div className="relative">
      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cls}
      />
      <button type="button" onClick={onToggle}
        aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors">
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="text-xs text-red-500 mt-1 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />{error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

function CambiarPassword() {
  const [form, setForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [show, setShow] = useState({ actual: false, nueva: false, confirmar: false })
  const [errors, setErrors] = useState<FormErrors>({})
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const updatePassword = useUpdatePassword()

  const set = (k: keyof typeof form, v: string) => { setForm((p) => ({ ...p, [k]: v })); setErrors((p) => ({ ...p, [k]: undefined })); setServerError('') }

  const validate = () => {
    const e: FormErrors = {}
    if (!form.actual)         e.actual    = 'Ingrese su contraseña actual'
    const nuevaErr            = validatePasswordStrength(form.nueva)
    if (nuevaErr)             e.nueva     = nuevaErr
    const confirmarErr        = validatePasswordMatch(form.nueva, form.confirmar)
    if (confirmarErr)         e.confirmar = confirmarErr
    return e
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }
    try {
      await updatePassword.mutateAsync({ currentPassword: form.actual, newPassword: form.nueva })
      setSuccess(true)
      setForm({ actual: '', nueva: '', confirmar: '' })
      setTimeout(() => setSuccess(false), 4000)
    } catch (err) {
      setServerError((err as Error)?.message ?? 'No se pudo actualizar la contraseña.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-primary-500/10 border border-primary-500/25 text-primary-600 rounded-xl px-4 py-3 text-sm">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Contraseña actualizada correctamente.
          </motion.div>
        )}
        {serverError && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-2.5 bg-red/10 border border-red/25 text-red-dark rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {serverError}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <label htmlFor="pf-actual" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Contraseña actual
        </label>
        <PasswordInput id="pf-actual" placeholder="Tu contraseña actual"
          value={form.actual} visible={show.actual} error={errors.actual}
          onChange={(v) => set('actual', v)}
          onToggle={() => setShow((p) => ({ ...p, actual: !p.actual }))} />
      </div>
      <div>
        <label htmlFor="pf-nueva" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Nueva contraseña
        </label>
        <PasswordInput id="pf-nueva" placeholder="Mín. 8 caracteres, mayúscula, número o símbolo"
          value={form.nueva} visible={show.nueva} error={errors.nueva}
          onChange={(v) => set('nueva', v)}
          onToggle={() => setShow((p) => ({ ...p, nueva: !p.nueva }))} />
        <PasswordStrengthMeter value={form.nueva} />
      </div>
      <div>
        <label htmlFor="pf-confirmar" className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
          Confirmar nueva contraseña
        </label>
        <PasswordInput id="pf-confirmar" placeholder="Repita la nueva contraseña"
          value={form.confirmar} visible={show.confirmar} error={errors.confirmar}
          onChange={(v) => set('confirmar', v)}
          onToggle={() => setShow((p) => ({ ...p, confirmar: !p.confirmar }))} />
      </div>

      <button type="submit" disabled={updatePassword.isPending}
        className="flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-xl text-sm font-bold hover:bg-primary-700 disabled:opacity-60 transition-colors">
        {updatePassword.isPending
          ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          : <Shield className="w-4 h-4" />}
        Actualizar contraseña
      </button>
    </form>
  )
}

// ── 2FA section ──
function TwoFactor() {
  const [step, setStep]                   = useState<'idle' | 'setup' | 'done'>('idle')
  const [qr, setQr]                       = useState<string | null>(null)
  const [secret, setSecret]               = useState<string | null>(null)
  const [code, setCode]                   = useState('')
  const [backupCodes, setBackupCodes]     = useState<string[]>([])
  const [error, setError]                 = useState<string | null>(null)
  const [loading, setLoading]             = useState(false)
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [disableCode, setDisableCode]     = useState('')
  const { user, refreshProfile } = useAuth()
  const has2fa = user?.twoFactorEnabled

  const startSetup = async () => {
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/2fa/setup') as { qrDataUrl: string; secret: string }
      setQr(res.qrDataUrl)
      setSecret(res.secret)
      setStep('setup')
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  const verify = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const res = await api.post('/auth/2fa/verify', { code }) as { backupCodes?: string[] }
      setBackupCodes(res.backupCodes ?? [])
      setStep('done')
      setCode('')
      await refreshProfile()
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  const disable = async () => {
    setError(null)
    setLoading(true)
    try {
      await api.post('/auth/2fa/disable', { code: disableCode })
      setShowDisableConfirm(false)
      setDisableCode('')
      setStep('idle')
      await refreshProfile()
    } catch (e) { setError((e as Error).message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${has2fa || step === 'done' ? 'bg-primary-500/12' : 'bg-surface'}`}>
            <Smartphone className={`w-4 h-4 ${has2fa || step === 'done' ? 'text-primary-600' : 'text-text-muted'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Autenticación en dos pasos</p>
            <p className="text-xs text-text-muted">{has2fa || step === 'done' ? 'Activa — su cuenta tiene protección adicional' : 'Inactiva — active para mayor seguridad'}</p>
          </div>
        </div>
        {(has2fa || step === 'done') ? (
          <button onClick={() => setShowDisableConfirm(true)} disabled={loading}
            className="text-xs text-red-dark hover:text-red-dark font-medium px-3 py-1.5 rounded-lg hover:bg-red/10 transition-colors">
            Desactivar
          </button>
        ) : (
          <button onClick={startSetup} disabled={loading || step === 'setup'}
            className="text-xs text-primary-800 font-medium px-3 py-1.5 rounded-lg hover:bg-primary-500/10 transition-colors">
            {loading ? 'Cargando…' : 'Activar'}
          </button>
        )}
      </div>

      {step === 'setup' && qr && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-surface">
          <p className="text-xs text-text-muted">Escanee este código con su app de autenticación (Google Authenticator, Authy, etc.)</p>
          <img src={qr} alt="QR 2FA" className="w-40 h-40 mx-auto rounded-lg border border-border" />
          {secret && <p className="text-xs text-center font-mono text-text-muted break-all">Clave manual: {secret}</p>}
          <form onSubmit={verify} className="flex gap-2">
            <input value={code} onChange={e => setCode(e.target.value)} placeholder="Código de 6 dígitos"
              maxLength={6} className="flex-1 px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400" />
            <button type="submit" disabled={code.length < 6 || loading}
              className="px-4 py-2 bg-primary-800 text-white text-sm font-semibold rounded-lg hover:bg-primary-900 disabled:opacity-50 transition-colors">
              {loading ? '…' : 'Verificar'}
            </button>
          </form>
        </div>
      )}

      {step === 'done' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-primary-600 bg-primary-500/10 px-4 py-3 rounded-xl text-sm">
            <CheckCircle className="w-4 h-4 flex-shrink-0" />
            ¡2FA activado exitosamente! Su cuenta está protegida.
          </div>
          {backupCodes.length > 0 && (
            <div className="border border-gold-500/30 bg-gold-500/8 rounded-xl p-4 space-y-2">
              <p className="text-xs font-bold text-gold-500 uppercase tracking-wider">
                Guarda estos códigos de emergencia
              </p>
              <p className="text-xs text-text-muted">
                Cada uno funciona una sola vez para entrar si pierdes el acceso a tu app de autenticación. No se volverán a mostrar.
              </p>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-xs">
                {backupCodes.map((c) => (
                  <span key={c} className="px-2 py-1.5 bg-[var(--card-bg)] border border-border rounded-lg text-center tabular">{c}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-dark bg-red/10 px-4 py-3 rounded-xl">{error}</p>}

      <AnimatePresence>
        {showDisableConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center"
            >
              <div className="w-12 h-12 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-5 h-5 text-red-600" aria-hidden="true" />
              </div>
              <h3 className="text-base font-bold text-text mb-2">Desactivar 2FA</h3>
              <p className="text-sm text-text-muted mb-4 leading-relaxed">
                Su cuenta tendrá menor protección. Ingrese el código de 6 dígitos de su app de autenticación (o un código de emergencia) para confirmar.
              </p>
              <input
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value)}
                placeholder="Código de 6 dígitos"
                maxLength={8}
                autoFocus
                className="w-full px-3 py-2.5 mb-4 text-sm text-center border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-400"
              />
              {error && (
                <p className="text-xs text-red-dark mb-4 -mt-2">{error}</p>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDisableConfirm(false); setDisableCode(''); setError(null) }}
                  className="flex-1 py-2.5 border border-border rounded-lg text-sm font-semibold text-text-muted hover:border-primary-800 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={disable}
                  disabled={loading || disableCode.length < 6}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Desactivando…' : 'Desactivar'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sesiones activas section ──
interface SessionItem { id: string; ip: string; userAgent: string; creadoEn: string; esSesionActual?: boolean }
function SesionesActivas() {
  const qc = useQueryClient()
  const { data, isLoading, refetch } = useQuery<SessionItem[]>({
    queryKey: ['auth', 'sessions'],
    queryFn: () => api.get('/auth/sessions') as Promise<SessionItem[]>,
  })

  const revoke = useMutation({
    mutationFn: (id: string) => api.delete(`/auth/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'sessions'] }),
  })

  const revokeAll = useMutation({
    mutationFn: () => api.delete('/auth/sessions'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth', 'sessions'] }),
  })

  const sessions = data ?? []

  const deviceIcon = (ua: string) =>
    /mobile|android|iphone/i.test(ua) ? <Smartphone className="w-4 h-4" /> : <Laptop className="w-4 h-4" />

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-text-muted">{sessions.length} sesión{sessions.length !== 1 ? 'es' : ''} activa{sessions.length !== 1 ? 's' : ''}</p>
        <div className="flex gap-2">
          <button onClick={() => refetch()} className="text-xs text-text-muted hover:text-text flex items-center gap-1">
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
          {sessions.length > 1 && (
            <button onClick={() => revokeAll.mutate()} disabled={revokeAll.isPending}
              className="text-xs text-red-600 hover:text-red-700 font-medium">
              Cerrar todas
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 rounded-xl bg-surface animate-pulse" />)}</div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-4">No hay sesiones activas</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => (
            <div key={s.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${s.esSesionActual ? 'border-primary-500/30 bg-primary-500/8' : 'border-border bg-surface'}`}>
              <div className="flex items-center gap-3">
                <div className="text-text-muted">{deviceIcon(s.userAgent)}</div>
                <div>
                  <p className="text-xs font-medium text-text truncate max-w-[180px]">
                    {s.esSesionActual ? 'Esta sesión' : (s.userAgent.split('(')[0].trim() || 'Dispositivo')}
                  </p>
                  <p className="text-[10px] text-text-muted">{s.ip} · {new Date(s.creadoEn).toLocaleDateString('es-CO')}</p>
                </div>
              </div>
              {!s.esSesionActual && (
                <button onClick={() => revoke.mutate(s.id)} disabled={revoke.isPending}
                  className="p-1.5 text-text-muted hover:text-red-dark hover:bg-red/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Notificaciones section ──
function Notificaciones() {
  const { notifPrefs: prefs, setNotifPrefs: setPrefs } = useUI()

  const toggle = (k: keyof NotifPrefs) => setPrefs({ ...prefs, [k]: !prefs[k] })

  const items: { key: keyof NotifPrefs; label: string; desc: string }[] = [
    { key: 'solicitudes', label: 'Estado de solicitudes',    desc: 'Cambios en el estado de tus trámites' },
    { key: 'mapas',      label: 'Actualizaciones de mapas',  desc: 'Nuevas capas o versiones de mapas' },
    { key: 'email',      label: 'Resumen por correo',        desc: 'Recibir resumen semanal de actividad' },
  ]

  return (
    <div className="space-y-0 divide-y divide-border">
      {items.map(({ key, label, desc }) => (
        <div key={key} className="flex items-center justify-between gap-4 py-3">
          <div>
            <p className="text-sm font-medium text-text">{label}</p>
            <p className="text-xs text-text-muted">{desc}</p>
          </div>
          <button
            onClick={() => toggle(key)}
            aria-pressed={prefs[key]}
            className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${prefs[key] ? 'bg-primary-800' : 'bg-border'}`}
          >
            <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${prefs[key] ? 'left-5' : 'left-1'}`} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ── Apariencia section ──
function Apariencia() {
  const { density, setDensity } = useUI()

  const densityOptions = [
    { value: 'compact', label: 'Compacto', Icon: Layers,  desc: 'Más contenido en pantalla' },
    { value: 'normal',  label: 'Normal',   Icon: Monitor, desc: 'Espaciado equilibrado'    },
    { value: 'comfortable', label: 'Cómodo', Icon: Sun,   desc: 'Mayor legibilidad'         },
  ]

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-3">
          Densidad del contenido
        </p>
        <div className="grid grid-cols-3 gap-3">
          {densityOptions.map(({ value, label, Icon, desc }) => (
            <button
              key={value}
              onClick={() => setDensity(value as Parameters<typeof setDensity>[0])}
              className={`flex flex-col items-center gap-2 px-3 py-4 rounded-xl border-2 text-center transition-all ${
                density === value
                  ? 'bg-primary-500/10 border-primary-800 text-primary-800'
                  : 'border-border text-text-muted hover:border-primary-300 hover:text-text'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-bold">{label}</span>
              <span className="text-[0.65rem] leading-tight opacity-70">{desc}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Avatar uploader ──
function AvatarUploader({ avatarUrl, initials, onUploaded }: { avatarUrl: string | null; initials?: string; onUploaded: () => Promise<unknown> }) {
  const updateAvatar = useUpdateAvatar()
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const previewUrlRef = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
  }, [])

  const handleFile = async (file: File | null | undefined) => {
    if (!file) return
    setError(null)
    if (!file.type.startsWith('image/')) { setError('Selecciona una imagen JPG, PNG o WebP'); return }
    if (file.size > 5 * 1024 * 1024) { setError('La imagen no puede superar 5 MB'); return }

    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current)
    const url = URL.createObjectURL(file)
    previewUrlRef.current = url
    setPreview(url)

    try {
      await updateAvatar.mutateAsync(file)
      await onUploaded()
    } catch (err) {
      setError((err as Error)?.message ?? 'No se pudo actualizar la foto de perfil')
      setPreview(null)
    }
  }

  const avatarSrc = preview || avatarUrl

  return (
    <div className="relative shrink-0">
      <Avatar avatarUrl={avatarSrc} initials={initials} size="w-20 h-20" shape="squircle" textSize="text-2xl font-display" className="shadow-md" />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={updateAvatar.isPending}
        className="absolute -bottom-1 -right-1 w-7 h-7 bg-[var(--card-bg)] border border-border rounded-full flex items-center justify-center hover:bg-bg-alt transition-colors shadow-sm disabled:opacity-60"
        title="Cambiar foto"
      >
        {updateAvatar.isPending
          ? <Loader2 className="w-3.5 h-3.5 text-text-muted animate-spin" />
          : <Camera className="w-3.5 h-3.5 text-text-muted" />}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = '' }}
        className="sr-only"
      />
      {error && (
        <p className="absolute top-full left-0 mt-1.5 w-40 text-[0.65rem] text-red-500 leading-snug">{error}</p>
      )}
    </div>
  )
}

// ── Inline field editor ──
interface InlineEditorProps {
  value: string; onSave: (val: string) => void; onCancel: () => void
  isSaving: boolean; error?: string; placeholder?: string
}
function InlineEditor({ value, onSave, onCancel, isSaving, error, placeholder }: InlineEditorProps) {
  const [val, setVal] = useState(value)
  return (
    <div className="space-y-2 mt-1">
      <input
        autoFocus
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 border rounded-xl text-sm focus:outline-none focus:ring-2 transition ${
          error ? 'border-red-400 focus:border-red-400 focus:ring-red-400/10'
                : 'border-border focus:border-primary-800 focus:ring-primary-800/10'
        }`}
      />
      {error && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSave(val)}
          disabled={isSaving}
          className="px-3 py-1.5 bg-primary-800 text-white rounded-lg text-xs font-bold hover:bg-primary-700 disabled:opacity-60 transition-colors"
        >
          {isSaving ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block" /> : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          className="px-3 py-1.5 bg-bg-alt text-text-muted rounded-lg text-xs font-semibold hover:bg-border transition-colors"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── Main ──
export default function Perfil() {
  const { user, logout, refreshProfile } = useAuth()
  const { density } = useUI()
  const navigate = useNavigate()
  const updatePerfil = useUpdatePerfil()

  // Cuentas no verificadas (publico/visitante) no pueden editar perfil ni cambiar
  // contraseña — el backend responde 403. Se muestran los datos en solo lectura.
  const isVerified = !!user?.rol && !['publico', 'visitante'].includes(user.rol)

  const [editField, setEditField] = useState<'nombre' | 'institucion' | null>(null)
  const [editError, setEditError]   = useState('')

  const startEdit = (field: 'nombre' | 'institucion') => {
    setEditField(field)
    setEditError('')
  }
  const cancelEdit = () => { setEditField(null); setEditError('') }

  const saveEdit = async (field: 'nombre' | 'institucion', value: string) => {
    const trimmed = value.trim()
    if (field === 'nombre' && !trimmed) { setEditError('El nombre no puede estar vacío'); return }
    try {
      await updatePerfil.mutateAsync({ [field]: trimmed || null })
      await refreshProfile()
      setEditField(null)
    } catch (err) {
      setEditError((err as Error)?.message ?? 'Error al guardar')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const roleColor = {
    'Administrador SIG': 'bg-primary-700/10 text-primary-700',
    'Investigador':      'bg-gold-400/12 text-gold-400',
    'Público':           'bg-bg-alt text-text-muted',
  }[user?.role ?? ''] ?? 'bg-bg-alt text-text-muted'

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <p className="page-header-tag">Cuenta de Usuario</p>
        <h1 className="page-header-title">Mi Perfil</h1>
        <p className="page-header-description">
          Gestione su información personal, seguridad y preferencias del portal.
        </p>
      </div>

      {/* Avatar card */}
      <motion.div
        {...fadeUp(0)}
        className="relative bg-[var(--card-bg)] border border-border/70 rounded-2xl p-6 flex items-center gap-5"
      >
        <AvatarUploader avatarUrl={user?.avatarUrl ?? null} initials={user?.initials} onUploaded={refreshProfile} />

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h2 className="font-display text-xl font-bold text-text">{user?.name}</h2>
          <p className="text-sm text-text-muted mb-2">{user?.email}</p>
          <span className={`inline-block text-[0.65rem] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${roleColor}`}>
            {user?.role}
          </span>
        </div>

        {/* Density badge */}
        <div className="hidden sm:flex flex-col items-end gap-1 shrink-0">
          <span className="text-[0.6rem] font-bold uppercase tracking-wider text-text-muted">Vista</span>
          <span className="text-xs font-semibold text-text capitalize">{density}</span>
        </div>
      </motion.div>

      {/* Información personal */}
      <motion.div
        {...fadeUp(0.08)}
        whileHover={{ y: -3 }}
      >
        <Section
          title="Información Personal"
          description="Datos de su cuenta registrados en el sistema"
        >
          <div className="divide-y divide-border">
            <FieldRow
              label="Nombre completo"
              editable={isVerified && editField !== 'nombre'}
              onEdit={() => startEdit('nombre')}
            >
              {editField === 'nombre' ? (
                <InlineEditor
                  value={user?.name ?? ''}
                  onSave={(v) => saveEdit('nombre', v)}
                  onCancel={cancelEdit}
                  isSaving={updatePerfil.isPending}
                  error={editError}
                  placeholder="Tu nombre completo"
                />
              ) : (
                <p className="text-sm text-text font-medium">{user?.name}</p>
              )}
            </FieldRow>
            <FieldRow label="Correo electrónico">
              <div className="flex items-center gap-2">
                <span className="text-sm text-text font-medium">{user?.email}</span>
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold text-primary-600 bg-primary-500/10 px-2 py-0.5 rounded-full">
                  <CheckCircle className="w-2.5 h-2.5" />
                  Verificado
                </span>
              </div>
            </FieldRow>
            <FieldRow
              label="Institución"
              editable={isVerified && editField !== 'institucion'}
              onEdit={() => startEdit('institucion')}
            >
              {editField === 'institucion' ? (
                <InlineEditor
                  value={user?.institucion ?? ''}
                  onSave={(v) => saveEdit('institucion', v)}
                  onCancel={cancelEdit}
                  isSaving={updatePerfil.isPending}
                  error={editField === 'institucion' ? editError : ''}
                  placeholder="Nombre de tu institución"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 className="w-3.5 h-3.5 text-text-muted shrink-0" />
                  <span className="text-sm text-text font-medium">
                    {user?.institucion || 'Sin institución registrada'}
                  </span>
                </div>
              )}
            </FieldRow>
            <FieldRow label="Perfil de acceso">
              <span className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${roleColor}`}>
                {user?.role}
              </span>
            </FieldRow>
          </div>
        </Section>
      </motion.div>

      {/* Seguridad */}
      <motion.div
        {...fadeUp(0.14)}
        whileHover={{ y: -3 }}
      >
        <Section
          title="Seguridad"
          description="Actualice su contraseña periódicamente para proteger su cuenta"
        >
          {isVerified ? (
            <CambiarPassword />
          ) : (
            <p className="text-sm text-text-muted bg-bg-alt/60 border border-border/50 rounded-xl px-4 py-3">
              La gestión de contraseña está disponible para cuentas verificadas. Solicita acceso para habilitar esta opción.
            </p>
          )}
        </Section>
      </motion.div>

      {/* 2FA */}
      <motion.div
        {...fadeUp(0.17)}
        whileHover={{ y: -3 }}
      >
        <Section
          title="Autenticación en dos pasos (2FA)"
          description="Añada una capa extra de seguridad con una app de autenticación"
        >
          <TwoFactor />
        </Section>
      </motion.div>

      {/* Sesiones activas */}
      <motion.div
        {...fadeUp(0.19)}
        whileHover={{ y: -3 }}
      >
        <Section
          title="Sesiones activas"
          description="Dispositivos con sesión abierta en su cuenta"
        >
          <SesionesActivas />
        </Section>
      </motion.div>

      {/* Notificaciones */}
      <motion.div
        {...fadeUp(0.20)}
        whileHover={{ y: -3 }}
      >
        <Section
          title="Notificaciones"
          description="Configure qué alertas desea recibir del sistema"
        >
          <Notificaciones />
        </Section>
      </motion.div>

      {/* Apariencia */}
      <motion.div
        {...fadeUp(0.26)}
        whileHover={{ y: -3 }}
      >
        <Section
          title="Apariencia"
          description="Ajuste la presentación visual del portal"
        >
          <Apariencia />
        </Section>
      </motion.div>

      {/* Acciones de cuenta */}
      <motion.div
        {...fadeUp(0.32)}
        whileHover={{ y: -3 }}
        className="bg-[var(--card-bg)] border border-border/70 rounded-2xl overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-text">Acciones de Cuenta</h3>
        </div>
        <div className="divide-y divide-border">
          <Link
            to="/solicitudes"
            className="flex items-center justify-between px-6 py-4 hover:bg-bg-alt transition-colors no-underline group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-bg-alt rounded-xl flex items-center justify-center">
                <User className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text group-hover:text-primary-800 transition-colors">
                  Mis Solicitudes
                </p>
                <p className="text-xs text-text-muted">Ver trámites y solicitudes radicadas</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary-800 transition-colors" />
          </Link>

          <a
            href={`mailto:info@iiap.org.co?subject=${encodeURIComponent('Solicitud sobre mis datos personales')}&body=${encodeURIComponent(`Solicito ejercer mi derecho de [acceso / rectificación / eliminación / oposición] sobre mis datos personales tratados por VIGIA-IIAP.\n\nCorreo registrado: ${user?.email ?? ''}`)}`}
            className="flex items-center justify-between px-6 py-4 hover:bg-bg-alt transition-colors no-underline group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-bg-alt rounded-xl flex items-center justify-center">
                <Shield className="w-4 h-4 text-text-muted" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text group-hover:text-primary-800 transition-colors">
                  Privacidad y mis datos
                </p>
                <p className="text-xs text-text-muted">Solicita acceso, corrección o eliminación de tus datos (Ley 1581 de 2012)</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-primary-800 transition-colors" />
          </a>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-red/10 transition-colors group text-left"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red/10 rounded-xl flex items-center justify-center">
                <LogOut className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-orange-600">Cerrar Sesión</p>
                <p className="text-xs text-text-muted">Salir del portal VIGIA-IIAP</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-orange-400 group-hover:text-orange-600 transition-colors" />
          </button>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="text-center text-[0.65rem] text-text-muted/50 font-mono pb-4">
        VIGIA-IIAP v1.0 · © {new Date().getFullYear()} IIAP · Chocó Biogeográfico
      </p>
    </div>
  )
}
