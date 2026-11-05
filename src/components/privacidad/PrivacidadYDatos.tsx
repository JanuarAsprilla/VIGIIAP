import { useState } from 'react'
import { Download, Trash2, Loader2, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import api from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/lib/apiError'

export const FRASE_ELIMINAR = 'ELIMINAR'
const ROLES_ADMINISTRATIVOS = new Set(['admin_sig', 'super_admin'])

function guardarComoArchivo(nombre: string, contenido: unknown) {
  const blob = new Blob([JSON.stringify(contenido, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombre
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}

/** Derechos del titular sobre su cuenta (Ley 1581): descargar sus datos y eliminar la cuenta. */
export default function PrivacidadYDatos() {
  const { user } = useAuth()
  const [descargando, setDescargando] = useState(false)
  const [errorDescarga, setErrorDescarga] = useState<string | null>(null)
  const [confirmando, setConfirmando] = useState(false)
  const [frase, setFrase] = useState('')
  const [password, setPassword] = useState('')
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null)

  const esAdministrativa = ROLES_ADMINISTRATIVOS.has(user?.rol ?? '')

  const descargar = async () => {
    setDescargando(true)
    setErrorDescarga(null)
    try {
      const datos = await api.get('/usuarios/me/datos')
      guardarComoArchivo(`mis-datos-vigiiap-${new Date().toISOString().slice(0, 10)}.json`, datos)
    } catch (err) {
      setErrorDescarga(getApiErrorMessage(err, 'No se pudieron descargar tus datos. Intenta de nuevo.'))
    } finally {
      setDescargando(false)
    }
  }

  const eliminar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (frase !== FRASE_ELIMINAR) return
    setEliminando(true)
    setErrorEliminar(null)
    try {
      await api.delete('/usuarios/me', { data: { confirmacion: frase, password: password || undefined } })
      // El servidor ya cerró la sesión; se recarga para descartar todo el estado de la aplicación.
      window.location.assign('/')
    } catch (err) {
      setErrorEliminar(getApiErrorMessage(err, 'No se pudo eliminar la cuenta. Intenta de nuevo.'))
      setEliminando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold text-text">Descargar mis datos</h4>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          Obtén un archivo con lo que VIGIA-IIAP guarda sobre ti: tu cuenta, solicitudes, sesiones, notificaciones,
          descargas y actividad. No incluye contraseñas ni claves de seguridad.
        </p>
        <button
          type="button" onClick={descargar} disabled={descargando}
          className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-primary-800/30 text-primary-800 hover:bg-primary-800/5 disabled:opacity-50 transition-colors"
        >
          {descargando ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Download className="w-4 h-4" aria-hidden="true" />}
          {descargando ? 'Preparando…' : 'Descargar mis datos'}
        </button>
        {errorDescarga && <p role="alert" className="text-xs text-red-500 mt-2">{errorDescarga}</p>}
      </div>

      <div className="border-t border-border pt-6">
        <h4 className="text-sm font-semibold text-text">Eliminar mi cuenta</h4>
        {esAdministrativa ? (
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Las cuentas administrativas las elimina un Super Administrador, porque el contenido que gestionas está
            enlazado a otros registros. Escribe a la administración de la plataforma para solicitarlo.
          </p>
        ) : !confirmando ? (
          <>
            <p className="text-xs text-text-muted mt-1 leading-relaxed">
              Se borrarán tus solicitudes, notificaciones y sesiones, y tu cuenta quedará anonimizada. Algunos registros de
              seguridad se conservan sin tu nombre ni tu correo durante el plazo indicado en la{' '}
              <Link to="/politica-privacidad" className="font-semibold text-primary-800 hover:underline">Política de Privacidad</Link>.
              Esta acción no se puede deshacer.
            </p>
            <button
              type="button" onClick={() => setConfirmando(true)}
              className="mt-3 inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-red-300 text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" /> Eliminar mi cuenta
            </button>
          </>
        ) : (
          <form onSubmit={eliminar} className="mt-3 space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4" aria-labelledby="eliminar-titulo">
            <p id="eliminar-titulo" className="flex items-start gap-2 text-xs font-semibold text-red-700">
              <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
              Vas a eliminar tu cuenta de forma permanente.
            </p>
            <div>
              <label htmlFor="eliminar-password" className="block text-xs font-medium text-text mb-1">
                Contraseña <span className="text-text-muted font-normal">(si tu cuenta usa una; no aplica con Google o Microsoft)</span>
              </label>
              <input
                id="eliminar-password" type="password" autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-[var(--card-bg)] text-text"
              />
            </div>
            <div>
              <label htmlFor="eliminar-frase" className="block text-xs font-medium text-text mb-1">
                Escribe <strong>{FRASE_ELIMINAR}</strong> para confirmar
              </label>
              <input
                id="eliminar-frase" type="text" autoComplete="off" value={frase}
                onChange={(e) => setFrase(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-[var(--card-bg)] text-text"
              />
            </div>
            {errorEliminar && <p role="alert" className="text-xs text-red-600">{errorEliminar}</p>}
            <div className="flex gap-2">
              <button
                type="submit" disabled={frase !== FRASE_ELIMINAR || eliminando}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {eliminando && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
                {eliminando ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
              <button
                type="button" disabled={eliminando}
                onClick={() => { setConfirmando(false); setFrase(''); setPassword(''); setErrorEliminar(null) }}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-border text-text hover:bg-bg-alt transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
