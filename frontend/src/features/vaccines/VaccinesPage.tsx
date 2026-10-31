import { useEffect, useState } from 'react'
import { Syringe } from 'lucide-react'
import { api, type Vaccine } from '../../api'
import { errorMessage } from '../../shared/format'
import { EmptyState, PageHeading, Panel, Toast } from '../../shared/ui'

export function VaccinesPage() {
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    api.vaccines('').then(setVaccines).catch((cause) => setError(errorMessage(cause)))
  }, [])

  const activeVaccines = vaccines.filter((vaccine) => vaccine.active)

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} />}
      <PageHeading
        description="Vacunas activas disponibles para registrar"
        eyebrow="CATÁLOGO GLOBAL"
        title="Vacunas"
      />
      <Panel>
        {activeVaccines.length ? (
          <div className="grid grid-cols-2 gap-3 p-4 max-[650px]:grid-cols-1">
            {activeVaccines.map((vaccine) => (
              <article className="flex items-center gap-3 rounded-lg border border-slate-100 p-3" key={vaccine.id}>
                <span className="grid size-[38px] place-items-center rounded-xl bg-emerald-50 text-brand-700"><Syringe size={19} /></span>
                <div>
                  <strong className="block text-xs text-slate-700">{vaccine.name}</strong>
                  <span className="mt-1 block text-[10px] text-muted">{speciesLabel(vaccine.species)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState
            description="El administrador puede agregar vacunas para que estén disponibles en las atenciones."
            icon={Syringe}
            title="El catálogo todavía está vacío"
          />
        )}
      </Panel>
    </>
  )
}

function speciesLabel(species: string) {
  if (species === 'both') return 'Perros y gatos'
  return species === 'dog' ? 'Perros' : 'Gatos'
}
