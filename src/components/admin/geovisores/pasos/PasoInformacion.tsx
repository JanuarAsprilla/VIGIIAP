import type { Dispatch, SetStateAction } from 'react'
import ThumbnailDropzone from '@/components/ui/ThumbnailDropzone'
import CategoryCombobox from '@/components/admin/CategoryCombobox'
import SelectorTipoGeovisor from '../SelectorTipoGeovisor'
import { TituloPaso } from '../PasosGeovisor'
import { inputCls, labelCls, type FormState } from '../formState'
import type { TipoGeovisor } from '../tiposGeovisor'
import type { FormErrors } from '@/types/forms'

/** Paso 1: qué clase de geovisor es y cómo se presenta en el portal público. */
export default function PasoInformacion({ form, setForm, errors, tipo, onCambiarTipo, categorias, onThumb, thumbRemoved }: {
  form: FormState
  setForm: Dispatch<SetStateAction<FormState>>
  errors: FormErrors
  tipo: TipoGeovisor
  onCambiarTipo: (tipo: TipoGeovisor) => void
  categorias: string[]
  onThumb: (file: File | null) => void
  thumbRemoved: boolean
}) {
  return (
    <div className="space-y-5">
      <TituloPaso titulo="Información general"
        explicacion="Elige qué clase de geovisor es y cómo se verá en el portal público." />

      <SelectorTipoGeovisor value={tipo} onChange={onCambiarTipo} />

      <div className="space-y-3">
        <div>
          <label htmlFor="gv-titulo" className={labelCls}>Título <span className="text-orange-500" aria-hidden="true">*</span></label>
          <input id="gv-titulo" type="text" value={form.titulo} autoFocus placeholder="Ej: Geología del Chocó"
            onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))}
            className={inputCls(!!errors.titulo)} />
          {errors.titulo && <p className="text-xs text-red-500 mt-1">{errors.titulo}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="gv-subtitulo" className={labelCls}>Subtítulo</label>
            <input id="gv-subtitulo" type="text" value={form.subtitulo}
              onChange={(e) => setForm((f) => ({ ...f, subtitulo: e.target.value }))} className={inputCls()} />
          </div>
          <div>
            <label htmlFor="gv-categoria" className={labelCls}>Categoría</label>
            <CategoryCombobox
              id="gv-categoria"
              value={form.categoria}
              onChange={(cat) => setForm((f) => ({ ...f, categoria: cat }))}
              options={categorias}
            />
          </div>
        </div>
        <div>
          <label htmlFor="gv-descripcion" className={labelCls}>Descripción</label>
          <textarea id="gv-descripcion" rows={2} value={form.descripcion}
            onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} className={inputCls()} />
        </div>
        <div>
          <label htmlFor="gv-cita" className={labelCls}>Cita sugerida</label>
          <input id="gv-cita" type="text" value={form.cita}
            onChange={(e) => setForm((f) => ({ ...f, cita: e.target.value }))} className={inputCls()} />
        </div>
        <ThumbnailDropzone label="Portada del geovisor" onFile={onThumb} existing={thumbRemoved ? null : (form.thumbnailUrl || null)} />
      </div>
    </div>
  )
}
