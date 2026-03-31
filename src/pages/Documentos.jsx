import { FileText } from 'lucide-react'

export default function Documentos() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-alt pt-28">
      <div className="text-center">
        <FileText className="w-16 h-16 text-primary-600 mx-auto mb-4" />
        <h1 className="font-display text-4xl font-bold text-text mb-2">Centro de Documentos</h1>
        <p className="text-text-light">Módulo independiente — Ruta: /documentos</p>
      </div>
    </div>
  )
}