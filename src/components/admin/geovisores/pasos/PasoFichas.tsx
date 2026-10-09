import { AlertCircle, Images } from 'lucide-react'
import FichaCapaConfigRow from '../fichas/FichaCapaConfigRow'
import { TituloPaso } from '../PasosGeovisor'
import type { FormErrors } from '@/types/forms'

/** Paso 3 (solo geovisores con fichas): cómo se reconoce cada punto y dónde se carga su foto, video y descripción. */
export default function PasoFichas({ conexionId, capas, sinConfigurar, errors }: {
  conexionId: string
  /** Capas vectoriales del geovisor que exigen fichas. */
  capas: { id: string; nombre: string }[]
  /** Subconjunto de `capas` que todavía no tiene su atributo identificador guardado. */
  sinConfigurar: string[]
  errors: FormErrors
}) {
  return (
    <div className="space-y-4">
      <TituloPaso titulo="Fichas por punto"
        explicacion="Cada punto de estas capas lleva una foto o video y una descripción. Elige qué dato identifica a cada punto y carga su información." />

      {capas.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-8 px-4 border border-dashed border-border rounded-xl text-center">
          <Images className="w-6 h-6 text-text-faint" aria-hidden="true" />
          <p className="text-sm text-text-muted">
            Aún no hay capas con fichas. Vuelve al paso «Capas» y marca «Con fichas» en las capas de puntos que lo necesiten.
          </p>
        </div>
      ) : (
        <>
          <ol className="text-xs text-text-muted leading-relaxed list-decimal pl-4 space-y-0.5">
            <li>Elige el atributo que identifica cada punto y pulsa «Habilitar».</li>
            <li>Con «Gestionar fichas» carga la foto o video y la descripción de cada punto.</li>
          </ol>
          <p className="text-[0.65rem] text-text-muted leading-snug">
            Esta configuración se guarda al pulsar «Habilitar» y se comparte con otros geovisores que usen la misma capa.
          </p>

          <div className="space-y-3">
            {capas.map((c) => (
              <div key={c.id}>
                <FichaCapaConfigRow conexionId={conexionId} capaId={c.id} capaNombre={c.nombre} />
                {errors[`ficha-${c.id}`] && sinConfigurar.includes(c.id) && (
                  <p className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                    <AlertCircle className="w-3 h-3 shrink-0" /> {errors[`ficha-${c.id}`]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
