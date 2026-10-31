import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { localDateTime } from '../../shared/format'
import type { Attention, Client, Patient } from '../../api'
import { Button, FormActions, FormField, formStyles, inputStyles, Modal } from '../../shared/ui'

type VaccineApp = { vaccineId: string; appliedAt: string; batchNumber: string; observations: string }

export function ClientDialog({
  client,
  onClose,
  onSave,
}: {
  client?: Client
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal eyebrow={client ? 'FICHA DEL CLIENTE' : 'NUEVO REGISTRO'} onClose={onClose} title={client ? 'Editar cliente' : 'Agregar cliente'}>
      <form className={formStyles} onSubmit={submit}>
        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Nombre"><input className={inputStyles} defaultValue={client?.name} name="name" required /></FormField>
          <FormField label="Apellido"><input className={inputStyles} defaultValue={client?.surname} name="surname" required /></FormField>
        </div>
        <FormField label="Teléfono"><input className={inputStyles} defaultValue={client?.phone} name="phone" required /></FormField>
        <FormField label="Email" optional><input className={inputStyles} defaultValue={client?.email ?? ''} name="email" type="email" /></FormField>
        <FormField label="Dirección" optional><input className={inputStyles} defaultValue={client?.address ?? ''} name="address" /></FormField>
        <FormField label="Notas" optional><textarea className={`${inputStyles} min-h-20 py-2`} defaultValue={client?.notes ?? ''} name="notes" rows={3} /></FormField>
        <FormActions>
          <Button onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" variant="primary">{client ? 'Guardar cambios' : 'Guardar cliente'}</Button>
        </FormActions>
      </form>
    </Modal>
  )
}

export function PatientDialog({
  patient,
  onClose,
  onSave,
}: {
  patient?: Patient
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal eyebrow="FICHA DEL PACIENTE" onClose={onClose} title={patient ? `Editar a ${patient.name}` : 'Agregar paciente'}>
      <form className={formStyles} onSubmit={submit}>
        <FormField label="Nombre del paciente"><input className={inputStyles} defaultValue={patient?.name} name="name" required /></FormField>
        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Especie">
            <select className={inputStyles} defaultValue={patient?.species ?? 'dog'} name="species"><option value="dog">Perro</option><option value="cat">Gato</option></select>
          </FormField>
          <FormField label="Sexo">
            <select className={inputStyles} defaultValue={patient?.sex ?? 'female'} name="sex">
              <option value="female">Hembra</option><option value="male">Macho</option><option value="unknown">No indicado</option>
            </select>
          </FormField>
        </div>
        <FormField label="Raza" optional><input className={inputStyles} defaultValue={patient?.breed ?? ''} name="breed" /></FormField>
        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Fecha de nacimiento" optional><input className={inputStyles} defaultValue={patient?.birthDate ?? ''} name="birthDate" type="date" /></FormField>
          <FormField label="Edad aproximada"><input className={inputStyles} defaultValue={patient?.approximateAge ?? ''} name="age" placeholder="Ej. 2 años" /></FormField>
        </div>
        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Castrado/a">
            <select className={inputStyles} defaultValue={patient?.castrated ? 'yes' : 'no'} name="castrated"><option value="no">No</option><option value="yes">Sí</option></select>
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
  attention,
  vaccines,
  onClose,
  onSave,
}: {
  attention?: Attention | null
  vaccines: { id: number; name: string }[]
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  const [vaccineApps, setVaccineApps] = useState<VaccineApp[]>(
    attention?.vaccineApplications?.length
      ? attention.vaccineApplications.map((a) => ({
          vaccineId: String(a.vaccineId),
          appliedAt: a.appliedAt ? toDateOnly(a.appliedAt) : '',
          batchNumber: a.batchNumber ?? '',
          observations: a.observations ?? '',
        }))
      : [{ vaccineId: '', appliedAt: '', batchNumber: '', observations: '' }],
  )

  function updateApp(index: number, field: keyof VaccineApp, value: string) {
    setVaccineApps((prev) => prev.map((app, i) => (i === index ? { ...app, [field]: value } : app)))
  }

  function addApp() {
    setVaccineApps((prev) => [...prev, { vaccineId: '', appliedAt: '', batchNumber: '', observations: '' }])
  }

  function removeApp(index: number) {
    setVaccineApps((prev) => prev.filter((_, i) => i !== index))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal
      eyebrow="HISTORIAL CLÍNICO"
      onClose={onClose}
      title={attention ? 'Editar atención' : 'Nueva atención'}
    >
      <form className={formStyles} onSubmit={submit}>
        <FormField label="Fecha y hora">
          <input
            className={inputStyles}
            defaultValue={attention ? toDateTimeLocal(attention.dateTime) : localDateTime()}
            name="dateTime"
            required
            type="datetime-local"
          />
        </FormField>
        <fieldset className="border-0 p-0">
          <legend className="mb-2 text-[11px] font-semibold text-slate-600">Tipo de atención</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ['atencion', 'Atención clínica'],
              ['vacuna', 'Vacuna'],
              ['ecografia', 'Ecografía'],
            ].map(([value, label]) => (
              <label
                className="flex items-center gap-1.5 rounded-md border border-slate-200 px-2 py-2 text-[11px] text-slate-600"
                key={value}
              >
                <input
                  className="accent-brand-700"
                  defaultChecked={attention ? attention.types.includes(value) : false}
                  name="types"
                  type="checkbox"
                  value={value}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <FormField label="Informe de ecografía" optional>
          <textarea
            className={`${inputStyles} min-h-20 py-2`}
            defaultValue={attention?.ultrasoundReport ?? ''}
            name="ultrasoundReport"
            placeholder="Hallazgos e informe…"
            rows={3}
          />
        </FormField>
        <FormField label="Estudios e informes" optional>
          <input
            accept="image/jpeg,image/png,application/pdf"
            className={inputStyles}
            multiple
            name="attachments"
            type="file"
          />
          <span className="mt-1 block text-[10px] text-muted">
            JPG, PNG o PDF · hasta 10 archivos de 10 MB cada uno · requiere tipo ecografía
          </span>
        </FormField>
        <FormField label="Motivo">
          <input
            className={inputStyles}
            defaultValue={attention?.reason ?? ''}
            name="reason"
            placeholder="Ej. Control anual"
          />
        </FormField>
        <FormField label="Observaciones">
          <textarea
            className={`${inputStyles} min-h-20 py-2`}
            defaultValue={attention?.observations ?? ''}
            name="observations"
            placeholder="Diagnóstico, tratamiento, indicaciones…"
            rows={3}
          />
        </FormField>

        {/* Multi-vaccine section (RF-21) */}
        <div>
          <p className="mb-2 text-[11px] font-semibold text-slate-600">Vacunas aplicadas</p>
          <div className="flex flex-col gap-3">
            {vaccineApps.map((app, index) => (
              <div className="rounded-lg border border-slate-200 p-3" key={index}>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-500">Vacuna {index + 1}</span>
                  {vaccineApps.length > 1 && (
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => removeApp(index)}
                      type="button"
                      aria-label="Eliminar vacuna"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 max-[650px]:grid-cols-1">
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">Vacuna</label>
                    <select
                      className={inputStyles}
                      value={app.vaccineId}
                      onChange={(e) => updateApp(index, 'vaccineId', e.target.value)}
                    >
                      <option value="">Seleccionar si corresponde</option>
                      {vaccines.map((vaccine) => (
                        <option key={vaccine.id} value={vaccine.id}>
                          {vaccine.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      Fecha de aplicación <span className="text-slate-400">(opcional)</span>
                    </label>
                    <input
                      className={inputStyles}
                      placeholder="Por defecto: fecha de atención"
                      type="date"
                      value={app.appliedAt}
                      onChange={(e) => updateApp(index, 'appliedAt', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      N° de lote <span className="text-slate-400">(opcional)</span>
                    </label>
                    <input
                      className={inputStyles}
                      placeholder="Ej. AB-1234"
                      type="text"
                      value={app.batchNumber}
                      onChange={(e) => updateApp(index, 'batchNumber', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[11px] text-slate-600">
                      Observaciones <span className="text-slate-400">(opcional)</span>
                    </label>
                    <input
                      className={inputStyles}
                      placeholder="Reacción, próximo refuerzo…"
                      type="text"
                      value={app.observations}
                      onChange={(e) => updateApp(index, 'observations', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            className="mt-2 flex items-center gap-1 text-[11px] text-brand-700 hover:text-brand-900"
            onClick={addApp}
            type="button"
          >
            <Plus size={14} /> Agregar otra vacuna
          </button>
        </div>

        <input type="hidden" name="vaccineApplicationsJson" value={JSON.stringify(vaccineApps)} />

        <div className="grid grid-cols-2 gap-3 max-[650px]:grid-cols-1">
          <FormField label="Monto cobrado">
            <input
              className={inputStyles}
              defaultValue={attention?.chargedAmount ?? ''}
              inputMode="decimal"
              name="chargedAmount"
              placeholder="0,00"
            />
          </FormField>
          <FormField label="Monto adeudado">
            <input
              className={inputStyles}
              defaultValue={attention?.debtAmount ?? ''}
              inputMode="decimal"
              name="debtAmount"
              placeholder="0,00"
            />
          </FormField>
        </div>
        <p className="-mt-1.5 text-[10px] text-muted">
          Los montos se ingresan manualmente para esta atención.
        </p>
        <FormActions>
          <Button onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {attention ? 'Guardar cambios' : 'Guardar atención'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

function toDateTimeLocal(iso?: string) {
  if (!iso) return localDateTime()
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function toDateOnly(iso: string) {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
