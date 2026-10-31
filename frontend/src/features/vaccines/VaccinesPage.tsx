import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Syringe } from 'lucide-react'
import { api, type Vaccine } from '../../api'
import { errorMessage } from '../../shared/format'
import {
  Badge,
  Button,
  EmptyState,
  FormActions,
  FormField,
  Modal,
  PageHeading,
  Toast,
  formStyles,
  inputStyles,
} from '../../shared/ui'

const vaccineRowGrid =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 lg:grid-cols-[minmax(0,1fr)_150px_100px_170px] lg:gap-4'

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
      {error && <Toast message={error} onDismiss={() => setError('')} tone="error" />}
      <PageHeading
        action={
          isAdmin ? (
            <Button className="max-sm:w-full" onClick={() => setIsDialogOpen(true)} variant="primary">
              <Plus size={17} /> Nueva vacuna
            </Button>
          ) : undefined
        }
        description={
          isAdmin
            ? 'Catálogo global disponible para todos los veterinarios'
            : 'Vacunas activas para registrar en las atenciones'
        }
        title="Vacunas"
      />

      {displayedVaccines.length ? (
        <>
          {isAdmin && (
            <div className={`${vaccineRowGrid} hidden border-b border-rule px-3 py-2 text-xs text-muted lg:grid`}>
              <span>Vacuna</span>
              <span>Especie</span>
              <span>Estado</span>
              <span />
            </div>
          )}
          <ul className="divide-y divide-rule border-t border-rule lg:border-t-0">
            {displayedVaccines.map((vaccine) => (
              <li key={vaccine.id}>
                <div className={`${vaccineRowGrid} px-3 py-3`}>
                  <strong className="truncate text-sm font-medium text-text max-lg:col-start-1 max-lg:row-start-1">
                    {vaccine.name}
                  </strong>
                  <span className="text-[13px] text-muted max-lg:col-start-1 max-lg:row-start-2">
                    {speciesLabel(vaccine.species)}
                  </span>
                  <span className="max-lg:col-start-2 max-lg:row-start-1 max-lg:self-start">
                    <Badge tone={vaccine.active ? 'positive' : 'neutral'}>
                      {vaccine.active ? 'Activa' : 'Inactiva'}
                    </Badge>
                  </span>
                  {isAdmin && (
                    <span className="flex flex-wrap gap-2 max-lg:col-start-2 max-lg:row-start-2 max-lg:justify-self-end">
                      <Button onClick={() => setEditingVaccine(vaccine)} variant="ghost">
                        Editar
                      </Button>
                      {vaccine.active && (
                        <Button onClick={() => void deactivateVaccine(vaccine.id)} variant="danger">
                          Desactivar
                        </Button>
                      )}
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          {isAdmin && (
            <p className="mt-4 max-w-xl text-[13px] leading-6 text-muted">
              Las vacunas que ya se usaron en una atención no se eliminan: se desactivan para que
              no estén disponibles en nuevas atenciones.
            </p>
          )}
        </>
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
    <Modal onClose={onClose} title={vaccine ? 'Editar vacuna' : 'Nueva vacuna'}>
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
