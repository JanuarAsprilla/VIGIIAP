import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'

export type OAuthProvidersStatus = Record<'google' | 'microsoft', boolean>

// Qué proveedores tienen credenciales configuradas en el backend — permite
// activar/desactivar los botones de OAuthProviders sin tocar el frontend el
// día que se agregue GOOGLE_CLIENT_ID/MICROSOFT_CLIENT_ID en producción.
export function useOAuthProviders() {
  return useQuery<OAuthProvidersStatus>({
    queryKey: ['auth', 'oauth-providers'],
    queryFn:  () => api.get('/auth/oauth/providers') as Promise<OAuthProvidersStatus>,
    staleTime: 5 * 60_000,
  })
}
