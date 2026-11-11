import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { getApiErrorMessage } from '@/lib/apiError'
import { puedeEditarModulo } from '@/lib/permisosModulo'
import { usePanelInformes } from '@/hooks/useInformesAdmin'
import { SkeletonLista } from '@/components/ui/Skeleton'
import AccesoYFormatos from '@/components/admin/informes/AccesoYFormatos'
import PlantillaInforme from '@/components/admin/informes/PlantillaInforme'
import HerramientasInforme from '@/components/admin/informes/HerramientasInforme'

export default function Informes() {
  const { user } = useAuth()
  const { data, isPending, isError, error } = usePanelInformes()
  const [aviso, setAviso] = useState<string | null>(null)
  const puedeEditar = puedeEditarModulo(user, 'informes')

  return (
    <div className="space-y-5 max-w-5xl">
      <header>
        <h1 className="font-display text-2xl font-bold">Informes descargables</h1>
        <p className="text-sm text-text-muted mt-1">
          Define quién puede descargar informes, en qué formatos y con qué plantilla institucional. Vale para todas las herramientas que ofrecen informe.
        </p>
      </header>
      {aviso && <p role="status" className="rounded-xl bg-primary-600/10 border border-primary-600/30 px-4 py-2 text-sm">{aviso}</p>}
      {isPending ? <SkeletonLista filas={4} /> : isError || !data ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">{getApiErrorMessage(error, 'No se pudo cargar la configuración de informes')}</p>
      ) : (
        <div className="space-y-5">
          <AccesoYFormatos general={data.general} puedeEditar={puedeEditar} onAviso={setAviso} />
          <PlantillaInforme key={data.general.actualizado_en} general={data.general} puedeEditar={puedeEditar} onAviso={setAviso} />
          <HerramientasInforme herramientas={data.herramientas} general={data.general} puedeEditar={puedeEditar} onAviso={setAviso} />
        </div>
      )}
    </div>
  )
}
