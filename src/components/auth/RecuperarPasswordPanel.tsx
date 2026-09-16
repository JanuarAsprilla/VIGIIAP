import { KeyRound } from 'lucide-react'
import CenteredAuthPanel from './CenteredAuthPanel'
import RecuperarPasswordForm from './RecuperarPasswordForm'

export default function RecuperarPasswordPanel({ onClose }: { onClose: () => void }) {
  return (
    <CenteredAuthPanel title="Recuperar Contraseña" icon={KeyRound} onClose={onClose}>
      <RecuperarPasswordForm onClose={onClose} />
    </CenteredAuthPanel>
  )
}
