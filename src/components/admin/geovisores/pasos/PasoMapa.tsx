import type { Dispatch, SetStateAction } from 'react'
import { TituloPaso } from '../PasosGeovisor'
import { BASEMAPS, inputCls, labelCls, type FormState } from '../formState'
import type { FormErrors } from '@/types/forms'

/** Paso 4: dónde abre el mapa y cuánta área se puede consultar. El mapa de la derecha es el control. */
export default function PasoMapa({ form, setForm, errors }: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  errors: FormErrors
}) {
  return (
    <div className="space-y-4">
      <TituloPaso titulo="Mapa y área"
        explicacion="Arrastra y haz zoom en el mapa de vista previa hasta dejarlo como quieres que abra. La posición se guarda sola." />

      <div className="grid grid-cols-3 gap-2 text-xs bg-bg-alt rounded-lg px-3 py-2.5">
        <div><span className="text-text-muted">Lat </span><span className="font-mono text-text">{form.centroLat}</span></div>
        <div><span className="text-text-muted">Lng </span><span className="font-mono text-text">{form.centroLng}</span></div>
        <div><span className="text-text-muted">Zoom </span><span className="font-mono text-text">{form.zoomInicial}</span></div>
      </div>

      <div>
        <label htmlFor="gv-basemap" className={labelCls}>Mapa base por defecto</label>
        <select id="gv-basemap" value={form.basemapDefecto}
          onChange={(e) => setForm((f) => ({ ...f, basemapDefecto: e.target.value }))} className={inputCls()}>
          {BASEMAPS.map((b) => <option key={b.id} value={b.id}>{b.label}</option>)}
        </select>
      </div>

      <div>
        <label htmlFor="gv-area-max" className={labelCls}>
          Área máxima <span className="font-normal normal-case tracking-normal text-text-muted">(hectáreas, opcional)</span>
        </label>
        <input id="gv-area-max" type="number" min={0} step="any" value={form.areaMaxHa}
          onChange={(e) => setForm((f) => ({ ...f, areaMaxHa: e.target.value }))} className={inputCls(!!errors.areaMaxHa)} />
        {errors.areaMaxHa
          ? <p className="text-xs text-red-500 mt-1">{errors.areaMaxHa}</p>
          : <p className="text-[0.65rem] text-text-muted mt-1">Límite del área que la gente puede dibujar o medir. Vacío = sin límite.</p>}
      </div>

      <p className="text-[0.65rem] text-text-muted leading-relaxed">
        {form.presetsArea.length > 0
          ? `${form.presetsArea.length} preset${form.presetsArea.length === 1 ? '' : 's'} de área: ${form.presetsArea.map((p) => p.nombre).join(', ')}.`
          : 'Dibuja presets de área directamente en el mapa con el botón "Dibujar preset de área".'}
      </p>
    </div>
  )
}
