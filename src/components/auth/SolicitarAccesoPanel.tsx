import { UserPlus } from 'lucide-react'
import CenteredAuthPanel from './CenteredAuthPanel'
import SolicitarAccesoForm from './SolicitarAccesoForm'

export default function SolicitarAccesoPanel({ onClose }: { onClose: () => void }) {
  return (
    <CenteredAuthPanel title="Solicitar Acceso" icon={UserPlus} onClose={onClose}>
      <SolicitarAccesoForm onClose={onClose} />
    </CenteredAuthPanel>
  )
}
