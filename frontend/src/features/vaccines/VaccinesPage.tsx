import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Syringe } from 'lucide-react'
import { api, type Vaccine } from '../../api'
import { errorMessage } from '../../shared/format'
import { Button, EmptyState, FormActions, FormField, formStyles, inputStyles, Modal, PageHeading, Panel, Toast } from '../../shared/ui'

export function VaccinesPage({ isAdmin = false }: { isAdmin?: boolean }) {
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVaccine, setEditingVaccine] = useState<Vaccine | null>(null)
  const [error, setError] = useState('')

  async function refreshVaccines() {
    try {
      setVaccines(await api.vaccines(''))
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  useEffect(() => {
    void refreshVaccines()
  }, [])

  async function createVaccine(formData: FormData) {
    try {
      await api.createVaccine({
        name: String(formData.get('name')),
        species: String(formData.get('species')),
      })
      setIsDialogOpen(false)
      await refreshVaccines()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function updateVaccine(formData: FormData) {
    if (!editingVaccine) return
    try {
      await api.updateVaccine(editingVaccine.id, {
        name: String(formData.get('name')),
        species: String(formData.get('species')),
        active: formData.get('active') === 'true',
      })
      setEditingVaccine(null)
      await refreshVaccines()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function deactivateVaccine(id: number) {
    try {
      await api.deactivateVaccine(id)
      await refreshVaccines()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  const displayedVaccines = isAdmin ? vaccines : vaccines.filter((vaccine) => vaccine.active)

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} />}
      <PageHeading
        action={
          isAdmin ? (
            <Button onClick={() => setIsDialogOpen(true)} variant="primary">
              <Plus size={17} /> Nueva vacuna
            </Button>
          ) : undefined
        }
        description={
          isAdmin
            ? 'Catálogo global de vacunas disponibles para todos los veterinarios'
            : 'Vacunas activas disponibles para registrar'
        }
        eyebrow="CATÁLOGO GLOBAL"
        title="Vacunas"
      />
      <Panel className={isAdmin ? 'overflow-hidden' : undefined}>
        {displayedVaccines.length ? (
          isAdmin ? (
            <div className="overflow-auto">
              <table className="w-full min-w-[650px] border-collapse text-left">
                <thead className="bg-slate-50 text-[9px] font-bold tracking-widest text-slate-500">
                  <tr>
                    <th className="h-10 px-4">VACUNA</th>
                    <th className="px-4">ESPECIE</th>
                    <th className="px-4">ESTADO</th>
                    <th className="px-4 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedVaccines.map((vaccine) => (
                    <tr className="h-16 border-t border-slate-100 text-xs text-slate-600" key={vaccine.id}>
                      <td className="px-4">
                        <div className="flex items-center gap-3">
                          <span className={`grid size-[34px] place-items-center rounded-lg ${vaccine.active ? 'bg-emerald-50 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
                            <Syringe size={17} />
                          </span>
                          <strong className="text-slate-700">{vaccine.name}</strong>
                        </div>
                      </td>
                      <td className="px-4">{speciesLabel(vaccine.species)}</td>
                      <td className="px-4">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            vaccine.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {vaccine.active ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 text-right">
                        <div className="inline-flex gap-2">
                          <Button onClick={() => setEditingVaccine(vaccine)}>Editar</Button>
                          {vaccine.active && (
                            <Button onClick={() => void deactivateVaccine(vaccine.id)}>Desactivar</Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 max-[650px]:grid-cols-1">
              {displayedVaccines.map((vaccine) => (
                <article className="flex items-center gap-3 rounded-lg border border-slate-100 p-3" key={vaccine.id}>
                  <span className="grid size-[38px] place-items-center rounded-xl bg-emerald-50 text-brand-700">
                    <Syringe size={19} />
                  </span>
                  <div>
                    <strong className="block text-xs text-slate-700">{vaccine.name}</strong>
                    <span className="mt-1 block text-[10px] text-muted">{speciesLabel(vaccine.species)}</span>
                  </div>
                </article>
              ))}
            </div>
          )
        ) : (
          <EmptyState
            description={
              isAdmin
                ? 'Agregá la primera vacuna para que esté disponible en las atenciones.'
                : 'El administrador todavía no cargó vacunas activas en el catálogo.'
            }
            icon={Syringe}
            title="El catálogo todavía está vacío"
          />
        )}
      </Panel>

      {isDialogOpen && (
        <VaccineDialog onClose={() => setIsDialogOpen(false)} onSave={createVaccine} />
      )}
      {editingVaccine && (
        <VaccineDialog
          onClose={() => setEditingVaccine(null)}
          onSave={updateVaccine}
          vaccine={editingVaccine}
        />
      )}
    </>
  )
}

function VaccineDialog({
  vaccine,
  onClose,
  onSave,
}: {
  vaccine?: Vaccine
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal
      eyebrow="CATÁLOGO GLOBAL"
      onClose={onClose}
      title={vaccine ? 'Editar vacuna' : 'Nueva vacuna'}
    >
      <form className={formStyles} onSubmit={submit}>
        <FormField label="Nombre de la vacuna">
          <input
            className={inputStyles}
            defaultValue={vaccine?.name}
            name="name"
            placeholder="Ej. Antirrábica"
            required
          />
        </FormField>
        <FormField label="Especie">
          <select className={inputStyles} defaultValue={vaccine?.species ?? 'both'} name="species">
            <option value="both">Perros y gatos</option>
            <option value="dog">Solo perros</option>
            <option value="cat">Solo gatos</option>
          </select>
        </FormField>
        {vaccine && (
          <FormField label="Estado">
            <select
              className={inputStyles}
              defaultValue={vaccine.active ? 'true' : 'false'}
              name="active"
            >
              <option value="true">Activa</option>
              <option value="false">Inactiva (desactivada)</option>
            </select>
          </FormField>
        )}
        <FormActions>
          <Button onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {vaccine ? 'Guardar cambios' : 'Crear vacuna'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}

function speciesLabel(species: string) {
  if (species === 'both') return 'Perros y gatos'
  return species === 'dog' ? 'Perros' : 'Gatos'
}
