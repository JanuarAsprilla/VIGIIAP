import { ChevronDown, Info } from 'lucide-react'
import { PanelError } from './EstadoConsulta'
import { fmtFecha, fmtNum } from './lib/format'
import { AVISO_SIN_MARCA } from './lib/conservacion'
import { urlDoi } from './lib/enlaces'
import { etiquetaMetodo } from './lib/metodo'
import { NOMBRES_GRUPO, type EstadoBiodiversidad } from './types'

const LISTAS_CONSERVACION = [
  'Amenaza nacional: MADS, Resolución 0126 de 2024',
  'Endemismo del Chocó: lista del IIAP (2011), histórica y parcial',
  'Especies introducidas: GRIIS',
  'Especies invasoras: MADS',
  'Endemismo nacional de aves: ACO',
  'Endemismo nacional de plantas: UNAL',
  'Endemismo nacional de mamíferos: SCMas',
]

interface Props {
  estado: EstadoBiodiversidad | undefined
  error: unknown
  cargando: boolean
  onReintentar: () => void
}

export default function AcercaDatos({ estado, error, cargando, onReintentar }: Props) {
  return (
    <section className="bio-panel" aria-labelledby="bio-acerca-titulo">
      <details open className="group">
        <summary className="flex items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer list-none min-h-11 rounded-xl">
          <span className="flex items-center gap-2.5">
            <Info className="w-5 h-5 text-primary-700 dark:text-primary-300" aria-hidden="true" />
            <h2 id="bio-acerca-titulo" className="section-title">Acerca de los datos</h2>
          </span>
          <ChevronDown className="w-5 h-5 text-text-muted transition-transform group-open:rotate-180 motion-reduce:transition-none" aria-hidden="true" />
        </summary>
        <div className="px-4 sm:px-5 pb-5 space-y-5">
          {cargando && <div role="status" aria-label="Cargando información de las fuentes" className="h-24 rounded-xl bg-bg-alt animate-pulse" />}
          {!cargando && !estado && <PanelError error={error} onReintentar={onReintentar} compacto />}
          {estado && (
            <>
              <p className="text-sm leading-relaxed border-l-2 border-gold-400 pl-3 text-text-light">{estado.aviso}</p>
              <div className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
                <div>
                  <h3 className="bio-eyebrow mb-2">Fuentes y atribución</h3>
                  <p className="text-sm text-text-light leading-relaxed">
                    Los registros provienen de GBIF y de las instituciones que publican cada conjunto de datos; pertenecen a sus
                    publicadores y se usan bajo la licencia indicada en cada registro. Cita siempre el conjunto de datos (DOI) y respeta su licencia.
                  </p>
                  <h3 className="bio-eyebrow mt-4 mb-2">Fotografías</h3>
                  <p className="text-sm text-text-light leading-relaxed">
                    Las fotografías se cargan desde GBIF y pertenecen a sus autores: cada una se muestra con su autoría y licencia.
                    Es la única excepción a que esta herramienta no use servicios externos; las imágenes no se descargan ni se almacenan aquí.
                  </p>
                  <h3 className="bio-eyebrow mt-4 mb-2">Cruce con listas de conservación</h3>
                  <p className="text-sm text-text-light">
                    {estado.conservacion.activa
                      ? `Activo${estado.conservacion.actualizada_en ? `, actualizado el ${fmtFecha(estado.conservacion.actualizada_en)}` : ''}.`
                      : 'Inactivo: no se está aplicando el cruce, por lo que las coordenadas podrían no estar reservadas según la categoría de amenaza.'}
                  </p>
                  <ul className="mt-2 text-sm text-text-light list-disc pl-5 space-y-0.5">
                    {LISTAS_CONSERVACION.map((l) => <li key={l}>{l}</li>)}
                  </ul>
                  <p className="text-sm text-text-light leading-relaxed mt-3">
                    Solo existen listas nacionales de endemismo para aves, plantas y mamíferos: en anfibios, reptiles, insectos y hongos
                    un valor de cero no significa «sin endémicas», sino «sin lista». «Introducida» e «invasora» son indicadores independientes.
                    {' '}{AVISO_SIN_MARCA}
                  </p>
                  <p className="text-sm mt-4 font-semibold text-text">
                    Los conteos reflejan esfuerzo de muestreo, no abundancia: un municipio con más registros no necesariamente tiene más individuos ni más especies.
                  </p>
                </div>
                <div>
                  <h3 className="bio-eyebrow mb-2">Fuente por grupo</h3>
                  <div className="bio-tabla-caja" tabIndex={0} role="region" aria-label="Fuente por grupo, desplazable">
                    <table className="bio-tabla">
                      <caption className="sr-only">Método, periodo, registros y fecha de la fuente por grupo</caption>
                      <thead><tr><th scope="col">Grupo</th><th scope="col">Método</th><th scope="col" className="bio-num">Registros</th><th scope="col">Fecha de la fuente</th></tr></thead>
                      <tbody>
                        {estado.grupos.map((g) => {
                          const doi = urlDoi(g.doi)
                          return (
                            <tr key={g.grupo}>
                              <th scope="row" >{NOMBRES_GRUPO[g.grupo]}</th>
                              <td>{etiquetaMetodo(g.metodo)}<span className="block text-[0.6875rem] text-text-muted">{g.desde}–{g.hasta}</span></td>
                              <td className="bio-num">{fmtNum(g.registros)}</td>
                              <td>{fmtFecha(g.fecha_fuente)}{doi && <a className="bio-enlace block text-[0.6875rem]" href={doi} target="_blank" rel="noopener noreferrer">DOI {g.doi}</a>}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </details>
    </section>
  )
}
