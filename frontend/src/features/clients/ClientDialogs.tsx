import type { FormEvent } from 'react'
import { localDateTime } from '../../shared/format'
import { Button, FormActions, FormField, formStyles, inputStyles, Modal } from '../../shared/ui'

export function ClientDialog({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal eyebrow="NUEVO REGISTRO" onClose={onClose} title="Agregar cliente">
      <form className={formStyles} onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Nombre"><input className={inputStyles} name="name" required /></FormField>
          <FormField label="Apellido"><input className={inputStyles} name="surname" required /></FormField>
        </div>
        <FormField label="Teléfono"><input className={inputStyles} name="phone" required /></FormField>
        <FormField label="Email" optional><input className={inputStyles} name="email" type="email" /></FormField>
        <FormField label="Dirección" optional><input className={inputStyles} name="address" /></FormField>
        <FormActions>
          <Button onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" variant="primary">Guardar cliente</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

export function PatientDialog({
  onClose,
  onSave,
}: {
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal eyebrow="FICHA DEL PACIENTE" onClose={onClose} title="Agregar paciente">
      <form className={formStyles} onSubmit={submit}>
        <FormField label="Nombre del paciente"><input className={inputStyles} name="name" required /></FormField>
        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Especie">
            <select className={inputStyles} name="species"><option value="dog">Perro</option><option value="cat">Gato</option></select>
          </FormField>
          <FormField label="Sexo">
            <select className={inputStyles} name="sex">
              <option value="female">Hembra</option><option value="male">Macho</option><option value="unknown">No indicado</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Edad aproximada"><input className={inputStyles} name="age" placeholder="Ej. 2 años" required /></FormField>
          <FormField label="Castrado/a">
            <select className={inputStyles} name="castrated"><option value="no">No</option><option value="yes">Sí</option></select>
          </FormField>
        </div>
        <FormActions>
          <Button onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" variant="primary">Guardar paciente</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

export function AttentionDialog({
  vaccines,
  onClose,
  onSave,
}: {
  vaccines: { id: number; name: string }[]
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal eyebrow="HISTORIAL CLÍNICO" onClose={onClose} title="Nueva atención">
      <form className={formStyles} onSubmit={submit}>
        <FormField label="Fecha y hora">
          <input className={inputStyles} defaultValue={localDateTime()} name="dateTime" required type="datetime-local" />
        </FormField>
        <fieldset className="border-0 p-0">
          <legend className="mb-2 text-[11px] font-semibold text-slate-600">Tipo de atención</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ['atencion', 'Atención clínica'],
              ['vacuna', 'Vacuna'],
              ['ecografia', 'Ecografía'],
            ].map(([value, label]) => (
              <label className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-2 text-[11px] text-slate-600" key={value}>
                <input className="accent-brand-700" name="types" type="checkbox" value={value} />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <FormField label="Motivo"><input className={inputStyles} name="reason" placeholder="Ej. Control anual" /></FormField>
        <FormField label="Observaciones">
          <textarea className={`${inputStyles} min-h-20 py-2`} name="observations" placeholder="Diagnóstico, tratamiento, indicaciones…" rows={3} />
        </FormField>
        <FormField label="Vacuna">
          <select className={inputStyles} name="vaccine">
            <option value="">Seleccionar si corresponde</option>
            {vaccines.map((vaccine) => <option key={vaccine.id} value={vaccine.id}>{vaccine.name}</option>)}
          </select>
        </FormField>
        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Monto cobrado"><input className={inputStyles} inputMode="decimal" name="chargedAmount" placeholder="0,00" /></FormField>
          <FormField label="Monto adeudado"><input className={inputStyles} inputMode="decimal" name="debtAmount" placeholder="0,00" /></FormField>
        </div>
        <p className="-mt-1.5 text-[10px] text-muted">Los montos se ingresan manualmente para esta atención.</p>
        <FormActions>
          <Button onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" variant="primary">Guardar atención</Button>
        </FormActions>
      </form>
    </Modal>
  )
}
