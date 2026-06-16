import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FileText, FileSpreadsheet, Eye, Download, X } from 'lucide-react'
import { typeStyles } from './documentos.constants'
import { forceDownload } from './documentos.utils'

export default function DocumentoPreviewModal({ doc, categoryTitle, onClose }) {
  const s = typeStyles[doc.type] || typeStyles.pdf
  const isImage  = doc.url && /\.(jpe?g|png|webp|gif|avif)(\?|$)/i.test(doc.url)
  const isPdf    = doc.type === 'pdf'
  const isOffice = doc.type === 'docx' || doc.type === 'doc' || doc.type === 'xlsx' || doc.type === 'xls'
  const OfficeIcon = (doc.type === 'xlsx' || doc.type === 'xls') ? FileSpreadsheet : FileText

  useEffect(() => {
    const handleKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${s.bg} ${s.text}`}>
              {s.label}
            </span>
            <span className="text-sm font-semibold text-text truncate max-w-xs">{doc.name}</span>
          </div>
          <button onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:bg-bg-alt transition-colors shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {doc.url ? (
          <div className="w-full">
            {isImage ? (
              <div className="p-4 flex justify-center bg-bg-alt">
                <img src={doc.url} alt={doc.name}
                  className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-sm" />
              </div>
            ) : isPdf ? (
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <FileText className={`w-8 h-8 ${s.text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text mb-1">{doc.name}</p>
                  <p className="text-xs text-text-muted">{categoryTitle}</p>
                </div>
                <div className="flex gap-3">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                    <Eye className="w-4 h-4" />
                    Visualizar PDF
                  </a>
                  <button onClick={() => forceDownload(doc.url, `${doc.name}.${doc.type}`)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-50 border border-primary-200 text-primary-800 rounded-lg text-sm font-semibold hover:bg-primary-100 transition-colors">
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                </div>
              </div>
            ) : isOffice ? (
              <div className="p-6 flex flex-col items-center gap-4 text-center">
                <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${s.bg}`}>
                  <OfficeIcon className={`w-8 h-8 ${s.text}`} />
                </div>
                <div>
                  <p className="text-sm font-medium text-text mb-1">{doc.name}</p>
                  <p className="text-xs text-text-muted mb-1">{categoryTitle}</p>
                  <p className="text-xs text-text-muted">Los archivos {s.label} no se pueden previsualizar en el navegador.</p>
                </div>
                <button onClick={() => forceDownload(doc.url, `${doc.name}.${doc.type}`)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors">
                  <Download className="w-4 h-4" />
                  Descargar {s.label}
                </button>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="px-6 py-10 flex flex-col items-center text-center text-text-muted">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-4 ${s.bg}`}>
              <FileText className={`w-7 h-7 ${s.text}`} />
            </div>
            <p className="text-sm font-medium text-text mb-1">{doc.name}</p>
            <p className="text-xs">Archivo no disponible</p>
          </div>
        )}

        <div className="px-6 py-4 border-t border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 text-xs text-text-muted">
            {doc.updated && <span>Actualizado: {doc.updated}</span>}
            {categoryTitle && <span>{categoryTitle}</span>}
          </div>
          <button onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text transition-colors">
            Cerrar
          </button>
        </div>
      </motion.div>
    </div>
  )
}
