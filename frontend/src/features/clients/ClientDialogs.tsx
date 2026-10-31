import { useState, type FormEvent } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { localDateTime } from '../../shared/format'
import type { Attention, Client, Patient } from '../../api'
import {
  Button,
  FormActions,
  FormField,
  Modal,
  formStyles,
  inputStyles,
  textareaStyles,
} from '../../shared/ui'

type VaccineApp = {
  vaccineId: string
  appliedAt: string
  batchNumber: string
  observations: string
}

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
    <Modal onClose={onClose} title={client ? 'Editar cliente' : 'Agregar cliente'}>
      <form className={formStyles} onSubmit={submit}>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Nombre">
            <input className={inputStyles} defaultValue={client?.name} name="name" required />
          </FormField>
          <FormField label="Apellido">
            <input className={inputStyles} defaultValue={client?.surname} name="surname" required />
          </FormField>
        </div>
        <FormField label="Teléfono">
          <input className={inputStyles} defaultValue={client?.phone} name="phone" required />
        </FormField>
        <FormField label="Email" optional>
          <input className={inputStyles} defaultValue={client?.email ?? ''} name="email" type="email" />
        </FormField>
        <FormField label="Dirección" optional>
          <input className={inputStyles} defaultValue={client?.address ?? ''} name="address" />
        </FormField>
        <FormField label="Notas" optional>
          <textarea className={textareaStyles} defaultValue={client?.notes ?? ''} name="notes" rows={3} />
        </FormField>
        <FormActions>
          <Button onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {client ? 'Guardar cambios' : 'Guardar cliente'}
          </Button>
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
    <Modal
      onClose={onClose}
      title={patient ? `Editar a ${patient.name}` : 'Agregar paciente'}
    >
      <form className={formStyles} onSubmit={submit}>
        <FormField label="Nombre del paciente">
          <input className={inputStyles} defaultValue={patient?.name} name="name" required />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Especie">
            <select className={inputStyles} defaultValue={patient?.species ?? 'dog'} name="species">
              <option value="dog">Perro</option>
              <option value="cat">Gato</option>
            </select>
          </FormField>
          <FormField label="Sexo">
            <select className={inputStyles} defaultValue={patient?.sex ?? 'female'} name="sex">
              <option value="female">Hembra</option>
              <option value="male">Macho</option>
              <option value="unknown">No indicado</option>
            </select>
          </FormField>
        </div>
        <FormField label="Raza" optional>
          <input className={inputStyles} defaultValue={patient?.breed ?? ''} name="breed" />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Fecha de nacimiento" optional>
            <input className={inputStyles} defaultValue={patient?.birthDate ?? ''} name="birthDate" type="date" />
          </FormField>
          <FormField label="Edad aproximada">
            <input
              className={inputStyles}
              defaultValue={patient?.approximateAge ?? ''}
              name="age"
              placeholder="Ej. 2 años"
            />
          </FormField>
        </div>
        <FormField label="Castrado/a">
          <select className={inputStyles} defaultValue={patient?.castrated ? 'yes' : 'no'} name="castrated">
            <option value="no">No</option>
            <option value="yes">Sí</option>
          </select>
        </FormField>
        <FormActions>
          <Button onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            Guardar paciente
          </Button>
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
  const [types, setTypes] = useState<string[]>(attention?.types ?? [])
  const [vaccineApps, setVaccineApps] = useState<VaccineApp[]>(
    attention?.vaccineApplications?.length
      ? attention.vaccineApplications.map((application) => ({
          vaccineId: String(application.vaccineId),
          appliedAt: application.appliedAt ? toDateOnly(application.appliedAt) : '',
          batchNumber: application.batchNumber ?? '',
          observations: application.observations ?? '',
        }))
      : [{ vaccineId: '', appliedAt: '', batchNumber: '', observations: '' }],
  )
  const hasClinicalAttention = types.includes('atencion')
  const hasUltrasound = types.includes('ecografia')
  const hasVaccine = types.includes('vacuna')

  function toggleType(value: string) {
    setTypes((current) =>
      current.includes(value) ? current.filter((type) => type !== value) : [...current, value],
    )
  }

  function updateApp(index: number, field: keyof VaccineApp, value: string) {
    setVaccineApps((prev) =>
      prev.map((app, i) => (i === index ? { ...app, [field]: value } : app)),
    )
  }

  function addApp() {
    setVaccineApps((prev) => [
      ...prev,
      { vaccineId: '', appliedAt: '', batchNumber: '', observations: '' },
    ])
  }

  function removeApp(index: number) {
    setVaccineApps((prev) => prev.filter((_, i) => i !== index))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal onClose={onClose} title={attention ? 'Editar atención' : 'Nueva atención'}>
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
          <legend className="mb-2 text-[13px] font-medium text-text">Tipo de atención</legend>
          <div className="flex flex-wrap gap-2">
            {[
              ['atencion', 'Atención clínica'],
              ['vacuna', 'Vacuna'],
              ['ecografia', 'Ecografía'],
            ].map(([value, label]) => (
              <label
                className="flex h-10 cursor-pointer items-center gap-2 rounded-control border border-control px-3 text-[13px] text-text transition-colors has-[:checked]:border-accent has-[:checked]:bg-accent-soft has-[:checked]:text-accent-ink"
                key={value}
              >
                <input
                  checked={types.includes(value)}
                  className="size-4 accent-accent"
                  name="types"
                  onChange={() => toggleType(value)}
                  type="checkbox"
                  value={value}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>

        {hasUltrasound && (
          <>
            <FormField label="Informe de ecografía" optional>
              <textarea
                className={textareaStyles}
                defaultValue={attention?.ultrasoundReport ?? ''}
                name="ultrasoundReport"
                placeholder="Hallazgos e informe…"
                rows={3}
              />
            </FormField>
            <FormField
              hint="JPG, PNG o PDF. Hasta 10 archivos de 10 MB cada uno."
              hintId="attachments-hint"
              label="Estudios e informes"
              optional
            >
              <input
                accept="image/jpeg,image/png,application/pdf"
                aria-describedby="attachments-hint"
                className="block w-full rounded-control border border-control bg-surface px-3 py-2 text-[13px] text-muted file:mr-3 file:rounded-[4px] file:border-0 file:bg-raised file:px-3 file:py-1.5 file:text-[13px] file:font-medium file:text-text"
                multiple
                name="attachments"
                type="file"
              />
            </FormField>
          </>
        )}

        {(hasClinicalAttention || hasUltrasound) && (
          <FormField label="Motivo">
            <input
              className={inputStyles}
              defaultValue={attention?.reason ?? ''}
              name="reason"
              placeholder="Ej. Control anual"
            />
          </FormField>
        )}

        {hasClinicalAttention && (
          <FormField label="Observaciones">
            <textarea
              className={textareaStyles}
              defaultValue={attention?.observations ?? ''}
              name="observations"
              placeholder="Diagnóstico, tratamiento, indicaciones…"
              rows={3}
            />
          </FormField>
        )}

        {hasVaccine && (
          <div>
            <p className="mb-2 text-[13px] font-medium text-text">Vacunas aplicadas</p>
            <div className="flex flex-col gap-3">
              {vaccineApps.map((app, index) => (
                <div className="rounded-card border border-border p-3" key={index}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-xs text-muted">Vacuna {index + 1}</span>
                    {vaccineApps.length > 1 && (
                      <button
                        aria-label="Eliminar vacuna"
                        className="grid size-9 place-items-center rounded-control text-danger transition-colors hover:bg-danger-bg"
                        onClick={() => removeApp(index)}
                        type="button"
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <FormField label="Vacuna">
                      <select
                        className={inputStyles}
                        onChange={(event) => updateApp(index, 'vaccineId', event.target.value)}
                        value={app.vaccineId}
                      >
                        <option value="">Seleccionar si corresponde</option>
                        {vaccines.map((vaccine) => (
                          <option key={vaccine.id} value={vaccine.id}>
                            {vaccine.name}
                          </option>
                        ))}
                      </select>
                    </FormField>
                    <FormField label="Fecha de aplicación" optional>
                      <input
                        className={inputStyles}
                        onChange={(event) => updateApp(index, 'appliedAt', event.target.value)}
                        placeholder="Por defecto: fecha de atención"
                        type="date"
                        value={app.appliedAt}
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="mt-2 inline-flex items-center gap-1 rounded-control py-1 text-[13px] text-accent hover:underline"
              onClick={addApp}
              type="button"
            >
              <Plus size={14} /> Agregar otra vacuna
            </button>
          </div>
        )}

        <input
          name="vaccineApplicationsJson"
          type="hidden"
          value={JSON.stringify(vaccineApps)}
        />

        <div className="grid gap-4 sm:grid-cols-2">
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
        <p className="text-xs text-muted">Los montos se ingresan manualmente para esta atención.</p>

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
