import { Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Captura errores de renderizado en el árbol de componentes hijos.
 * Evita que un crash en un módulo deje la app en blanco.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    // En producción aquí iría el reporte a un servicio (Sentry, etc.)
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="min-h-[50vh] flex items-center justify-center p-8">
        <div className="max-w-md w-full text-center">
          <div className="w-14 h-14 bg-orange-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-7 h-7 text-orange-500" />
          </div>
          <h2 className="font-display text-xl font-bold text-text mb-2">
            Ocurrió un error inesperado
          </h2>
          <p className="text-sm text-text-muted mb-6 leading-relaxed">
            El módulo no pudo cargar correctamente. Puedes intentar de nuevo
            o navegar a otra sección.
          </p>
          <button
            onClick={this.handleReset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-800 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Intentar de nuevo
          </button>
        </div>
      </div>
    )
  }
}
