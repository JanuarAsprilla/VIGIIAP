import { AnimatePresence } from 'framer-motion'
import GeovisorFormBody from './GeovisorFormBody'
import type { GeovisorRaw } from '@/types'

/** Envoltorio delgado: solo decide cuándo montar/desmontar GeovisorFormBody. La
 *  key por editing?.id fuerza un remontaje limpio (form + mapa) cada vez que se
 *  abre para crear o para editar un geovisor distinto -- sin esto, el centro/zoom
 *  del mapa quedaría pegado al primer geovisor que se abrió, ya que MapContainer
 *  de react-leaflet solo lee center/zoom en el montaje inicial. */
export default function GeovisorFormModal({ open, editing, onClose, onSaved }: {
  open: boolean
  editing: GeovisorRaw | null
  onClose: () => void
  onSaved: (message: string) => void
}) {
  return (
    <AnimatePresence>
      {open && (
        <GeovisorFormBody key={editing?.id ?? 'nuevo'} editing={editing} onClose={onClose} onSaved={onSaved} />
      )}
    </AnimatePresence>
  )
}
