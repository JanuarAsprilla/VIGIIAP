/**
 * Botones de proveedor externo — Google y Microsoft. Apple Sign In queda
 * fuera: exige Apple Developer Program (de pago) y no es una prioridad por
 * ahora. Cuáles están activos depende de si el backend tiene credenciales
 * configuradas (ver useOAuthProviders) — así el día que el instituto agregue
 * GOOGLE_CLIENT_ID/MICROSOFT_CLIENT_ID no hace falta tocar el frontend, el
 * botón se activa solo. El que siga sin configurar se muestra deshabilitado
 * con "Próximamente" — un botón que no hace nada al hacer clic es peor que
 * no tenerlo.
 */
import api from '@/lib/api'
import { useOAuthProviders, type OAuthProvidersStatus } from '@/hooks/useOAuthProviders'

function GoogleIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.2-.1-2.4-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.2 18.9 12 24 12c3.1 0 5.8 1.1 8 3l6-6C34.5 5.1 29.6 3 24 3 16.3 3 9.7 7.4 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 45c5.5 0 10.4-1.8 14-5l-6.7-5.5C29.3 36 26.7 37 24 37c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.6 40.6 16.3 45 24 45z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4 5.7l6.7 5.5C41.9 36 44 30.5 44 24c0-1.2-.1-2.4-.4-3.5z"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg className="w-[16px] h-[16px]" viewBox="0 0 23 23" aria-hidden="true">
      <path fill="#f35325" d="M1 1h10v10H1z"/>
      <path fill="#81bc06" d="M12 1h10v10H12z"/>
      <path fill="#05a6f0" d="M1 12h10v10H1z"/>
      <path fill="#ffba08" d="M12 12h10v10H12z"/>
    </svg>
  )
}

const PROVIDERS = [
  { id: 'google',    label: 'Google',    Icon: GoogleIcon    },
  { id: 'microsoft', label: 'Microsoft', Icon: MicrosoftIcon },
] as const

function oauthStartUrl(id: string) {
  // Navegación de página completa a propósito — un fetch/XHR no puede seguir
  // la redirección cross-site a la pantalla de consentimiento del proveedor.
  return `${api.defaults.baseURL}/auth/oauth/${id}/start`
}

export default function OAuthProviders() {
  const { data: providers } = useOAuthProviders()

  return (
    <div className="pt-1">
      <div className="flex items-center gap-4 mb-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-muted uppercase tracking-wider">o continúa con</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {PROVIDERS.map(({ id, label, Icon }) => {
          const enabled = providers?.[id as keyof OAuthProvidersStatus] ?? false
          const className = 'flex flex-col items-center gap-1.5 px-2 py-3 border border-border rounded-xl transition-colors ' + (
            enabled
              ? 'text-text bg-[var(--card-bg)] hover:bg-bg-alt hover:border-primary-400'
              : 'text-text-muted bg-[var(--card-bg)] cursor-not-allowed opacity-60'
          )
          const content = (
            <>
              <Icon />
              <span className="text-xs font-semibold">{label}</span>
              {!enabled && (
                <span className="text-[0.5rem] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-bg-alt text-text-muted">
                  Pronto
                </span>
              )}
            </>
          )
          if (enabled) return (
            <a key={id} href={oauthStartUrl(id)} title={`Iniciar sesión con ${label}`} className={className}>
              {content}
            </a>
          )
          return (
            <button key={id} type="button" disabled title={`Iniciar sesión con ${label} — próximamente`} aria-disabled="true" className={className}>
              {content}
            </button>
          )
        })}
      </div>
    </div>
  )
}
