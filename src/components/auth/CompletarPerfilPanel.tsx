import { UserCircle } from 'lucide-react'
import CenteredAuthPanel from './CenteredAuthPanel'
import CompletarPerfilForm from './CompletarPerfilForm'

export default function CompletarPerfilPanel({ onClose }: { onClose: () => void }) {
  return (
    <CenteredAuthPanel title="Completa tu Perfil" icon={UserCircle} onClose={onClose}>
      <CompletarPerfilForm onClose={onClose} />
    </CenteredAuthPanel>
  )
}
