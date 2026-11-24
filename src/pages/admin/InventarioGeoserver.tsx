import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { fadeUpSm } from '@/lib/animations'
import { getApiErrorMessage } from '@/lib/apiError'
import { puedeEditarModulo, puedeVerModulo } from '@/lib/permisosModulo'
import { useAuth } from '@/contexts/AuthContext'
import { useConexionesSeleccionables, useInventarioGeoserver } from '@/hooks/useConexionesGeoserver'
import { SkeletonLista } from '@/components/ui/Skeleton'
import EstadoSincronizacion from '@/components/admin/inventario/EstadoSincronizacion'
import InventarioTablas from '@/components/admin/inventario/InventarioTablas'

export default function InventarioGeoserver() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const { data: inventario, isPending, isError, error, refetch } = useInventarioGeoserver(id)
  const { data: conexiones } = useConexionesSeleccionables()
  const conexion = conexiones?.find((c) => c.id === id)
  const puedeEditar = puedeEditarModulo(user, 'geovisores')
  const volverA = puedeVerModulo(user, 'conexiones_geoserver')
    ? { ruta: '/admin/conexiones-geoserver', texto: 'Conexiones GeoServer' }
    : { ruta: '/admin/geovisores', texto: 'Geovisores' }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.header {...fadeUpSm(0)}>
        <Link to={volverA.ruta} className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary-700 no-underline mb-2">
          <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
          {volverA.texto}
        </Link>
        <span className="block text-[0.7rem] font-bold uppercase tracking-widest" style={{ color: 'var(--hero-eyebrow-text)' }}>Administración</span>
        <h1 className="font-display text-2xl font-bold text-text mt-0.5">Inventario de GeoServer</h1>
        <p className="text-sm text-text-muted mt-1">
          {conexion ? <span className="font-semibold text-text">{conexion.nombre}</span> : 'Conexión'}
          {' · '}Lo que GeoServer tiene publicado: espacios de trabajo, capas, grupos y estilos. Es la misma información que alimenta los geovisores.
        </p>
      </motion.header>

      {isPending && <SkeletonLista filas={4} />}

      {isError && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-red-600/30 bg-red-600/10 px-4 py-3 text-sm text-red-800 dark:text-red-300">
          <span>{getApiErrorMessage(error, 'No se pudo cargar el inventario de GeoServer')}</span>
          <button type="button" onClick={() => void refetch()}
            className="rounded-lg border border-red-600/40 px-3 py-1.5 text-xs font-semibold hover:bg-red-600/10 transition-colors">
            Reintentar
          </button>
        </div>
      )}

      {inventario && id && (
        <motion.div {...fadeUpSm(0.05)} className="space-y-6">
          <EstadoSincronizacion conexionId={id} sincronizacion={inventario.sincronizacion} puedeEditar={puedeEditar} />
          <InventarioTablas inventario={inventario} />
        </motion.div>
      )}
    </div>
  )
}
