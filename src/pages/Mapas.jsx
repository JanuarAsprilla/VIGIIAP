import { MapPin } from 'lucide-react'

export default function Mapas() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg pt-28">
      <div className="text-center">
        <MapPin className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-text mb-2">Repositorio de Mapas</h1>
        <p className="text-text-light">Módulo independiente — Ruta: /mapas</p>
      </div>
    </div>
  )
}