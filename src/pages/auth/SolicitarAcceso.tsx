import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * /solicitar-acceso ya no es una página propia — el formulario vive en un
 * panel centrado (ver SolicitarAccesoPanel), abierto desde MainLayout. Esta
 * ruta solo reenvía a "/" pidiéndole que lo abra, para que enlaces externos
 * (un correo, un marcador guardado) sigan funcionando.
 */
export default function SolicitarAcceso() {
  const navigate = useNavigate()

  useEffect(() => {
    navigate('/', { replace: true, state: { openAuthModal: 'solicitar' } })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo debe correr una vez al montar
  }, [])

  return null
}
