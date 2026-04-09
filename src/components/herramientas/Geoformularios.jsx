import { useState } from 'react'
import { ClipboardList, MapPin, Calendar, User, Camera, Lock } from 'lucide-react'
import ToolCard from './ToolCard'

export default function Geoformularios() {
  const [tipoObservacion, setTipoObservacion] = useState('')

  return (
    <ToolCard tag="Captura en Campo" title="Geoformularios" icon={ClipboardList} color="primary" index={4}>
      <p className="text-sm text-text-muted leading-relaxed mb-4">
        Formularios georreferenciados para captura estructurada de datos en campo.
        Las plantillas configuradas desde el módulo de Administración aparecerán aquí.
      </p>

      <div className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Tipo de observación
            </label>
            <select
              value={tipoObservacion}
              onChange={(e) => setTipoObservacion(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary-800 focus:ring-2 focus:ring-primary-800/10 transition"
            >
              <option value="">Seleccionar...</option>
              <option value="flora">Flora y Vegetación</option>
              <option value="fauna">Fauna Silvestre</option>
              <option value="agua">Calidad del Agua</option>
              <option value="suelo">Uso del Suelo</option>
              <option value="comunidad">Comunidades Humanas</option>
            </select>
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Coordenadas (GPS)
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-alt border border-border rounded-lg text-sm text-text-muted">
              <MapPin className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="font-mono text-xs">4.8213° N, 76.7324° W</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Fecha de captura
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-border rounded-lg text-sm text-text">
              <Calendar className="w-4 h-4 text-text-muted shrink-0" aria-hidden="true" />
              <span>2026-04-07</span>
            </div>
          </div>

          <div>
            <label className="block text-[0.65rem] font-bold uppercase tracking-wider text-text-muted mb-1.5">
              Observador
            </label>
            <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-alt border border-border rounded-lg text-sm text-text-muted">
              <User className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="text-xs">Asignado desde sesión</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 border-2 border-dashed border-border rounded-lg text-text-muted hover:border-primary-300 transition-colors cursor-pointer">
          <Camera className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span className="text-sm">Adjuntar foto o evidencia de campo</span>
        </div>

        <div className="flex items-start gap-2 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2.5">
          <Lock className="w-3.5 h-3.5 text-primary-700 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-xs text-primary-800 leading-relaxed">
            Las plantillas personalizadas se gestionan desde el{' '}
            <span className="font-semibold">Módulo de Administración</span>.
          </p>
        </div>

        <button className="w-full px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
          Iniciar Captura
        </button>
      </div>
    </ToolCard>
  )
}
