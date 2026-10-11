import type { Dispatch, SetStateAction } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import Switch from '@/components/ui/Switch'
import { TituloPaso } from '../PasosGeovisor'
import { inputCls, labelCls, VISIBILIDAD, type FormState } from '../formState'
import type { FormErrors } from '@/types/forms'

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`

/** Paso final: quién lo ve, cómo se muestra la información de cada capa y un resumen antes de guardar. */
export default function PasoPublicar({ form, setForm, errors, totalTemas }: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  errors: FormErrors
  totalTemas: number
}) {
  const visibilidad = VISIBILIDAD.find((v) => v.value === form.visibilidad)
  const capas = form.capasSeleccionadas.length

  const addCampoPopup = () => setForm((f) => ({ ...f, camposPopup: [...f.camposPopup, { campo: '', alias: '' }] }))
  const updateCampoPopup = (i: number, patch: Partial<FormState['camposPopup'][number]>) => setForm((f) => ({
    ...f, camposPopup: f.camposPopup.map((c, idx) => idx === i ? { ...c, ...patch } : c),
  }))
  const removeCampoPopup = (i: number) => setForm((f) => ({
    ...f, camposPopup: f.camposPopup.filter((_, idx) => idx !== i),
  }))

  return (
    <div className="space-y-5">
      <TituloPaso titulo="Visibilidad y presentación"
        explicacion="Decide quién puede ver el geovisor y qué información aparece al consultar una capa." />

      <div>
        <label className={labelCls}>Visibilidad</label>
        <div className="grid grid-cols-3 gap-2">
          {VISIBILIDAD.map(({ value, label, desc, Icon, border, bg, text }) => {
            const active = form.visibilidad === value
            return (
              <button key={value} type="button" onClick={() => setForm((f) => ({ ...f, visibilidad: value }))}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center ${active ? `${border} ${bg}` : 'border-border bg-[var(--card-bg)] hover:bg-bg-alt'}`}>
                <Icon className={`w-4 h-4 ${active ? text : 'text-text-muted'}`} />
                <span className={`text-[0.65rem] font-bold uppercase tracking-wide ${active ? text : 'text-text-muted'}`}>{label}</span>
                <span className="text-[0.6rem] text-text-muted leading-tight hidden sm:block">{desc}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-text">Mostrar métricas al medir o consultar una capa</span>
          <Switch checked={form.mostrarMetricas} onChange={(v) => setForm((f) => ({ ...f, mostrarMetricas: v }))} label="Mostrar métricas" />
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="text-sm text-text">Mostrar imágenes en el popup</span>
          <Switch checked={form.mostrarImagenes} onChange={(v) => setForm((f) => ({ ...f, mostrarImagenes: v }))} label="Mostrar imágenes en el popup" />
        </div>
        {form.mostrarImagenes && (
          <div>
            <label htmlFor="gv-campo-img" className={labelCls}>Atributo con la URL de la imagen</label>
            <input id="gv-campo-img" type="text" value={form.campoImagenUrl} placeholder="Ej: foto_url"
              onChange={(e) => setForm((f) => ({ ...f, campoImagenUrl: e.target.value }))}
              className={inputCls(!!errors.campoImagenUrl)} />
            {errors.campoImagenUrl && <p className="text-xs text-red-500 mt-1">{errors.campoImagenUrl}</p>}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className={labelCls}>
            Atributos a mostrar en el popup <span className="font-normal normal-case tracking-normal text-text-muted">(vacío = todos)</span>
          </label>
          <button type="button" onClick={addCampoPopup}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary-800 hover:text-primary-700">
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
        </div>
        {form.camposPopup.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="text" value={c.campo} placeholder="Atributo"
              onChange={(e) => updateCampoPopup(i, { campo: e.target.value })} className={inputCls()} />
            <input type="text" value={c.alias} placeholder="Nombre legible"
              onChange={(e) => updateCampoPopup(i, { alias: e.target.value })} className={inputCls()} />
            <button type="button" onClick={() => removeCampoPopup(i)} title="Eliminar" aria-label={`Eliminar atributo ${i + 1}`}
              className="p-2 rounded-lg text-text-muted hover:text-red-dark hover:bg-red/10 transition-colors shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            {errors[`campo-${i}`] && <p className="text-xs text-red-500 col-span-2">{errors[`campo-${i}`]}</p>}
          </div>
        ))}
      </div>

      <section aria-label="Resumen del geovisor" className="rounded-xl bg-bg-alt px-4 py-3.5 space-y-2">
        <h5 className="text-sm font-bold text-text">Antes de guardar</h5>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-xs">
          <dt className="text-text-muted">Título</dt>
          <dd className="font-semibold text-text truncate">{form.titulo.trim() || 'Sin título'}</dd>
          <dt className="text-text-muted">Capas</dt>
          <dd className="font-semibold text-text">
            {capas === 0 ? 'Todas las de la conexión' : `${plural(capas, 'capa', 'capas')} de ${plural(totalTemas, 'tema', 'temas')}`}
          </dd>
          <dt className="text-text-muted">Fichas</dt>
          <dd className="font-semibold text-text">
            {form.capasConFicha.length === 0 ? 'No usa fichas' : `${plural(form.capasConFicha.length, 'capa', 'capas')} con fichas por punto`}
          </dd>
          <dt className="text-text-muted">Quién lo ve</dt>
          <dd className="font-semibold text-text">{visibilidad?.label} — {visibilidad?.desc.toLowerCase()}</dd>
        </dl>
      </section>
    </div>
  )
}
