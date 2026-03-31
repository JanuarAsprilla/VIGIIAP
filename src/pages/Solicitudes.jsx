import { ClipboardList } from 'lucide-react'

export default function Solicitudes() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg pt-28">
      <div className="text-center">
        <ClipboardList className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-text mb-2">Solicitudes</h1>
        <p className="text-text-light">Módulo independiente — Ruta: /solicitudes</p>
      </div>
    </div>
  )
}