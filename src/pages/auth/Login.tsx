import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'

/**
 * /login ya no es una página propia — el acceso vive en el panel anclado del
 * TopBar (ver LoginPanel). Esta ruta solo reenvía a "/" pidiéndole a TopBar
 * que abra el panel, preservando location.state.from para que RequireAuth,
 * RequireAdmin, RequireInvestigador, RequireSuperAdmin y RequireVerified
 * (todos navegan aquí con state.from al redirigir desde una ruta protegida)
 * sigan funcionando sin que haya que tocar cada uno de ellos.
 */
export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    navigate('/', { replace: true, state: { openLogin: true, from: location.state?.from } })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr una vez al montar
  }, [])

  return null
}
