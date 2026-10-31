import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { api, type VaccineReminder } from '../../api'
import { errorMessage } from '../../shared/format'
import { Button, EmptyState, PageHeading, Panel, Toast } from '../../shared/ui'

const views = [
  { status: 'pending', label: 'Próximos' },
  { status: 'sent', label: 'Enviados' },
  { status: 'error', label: 'Con error' },
  { status: 'cancelled', label: 'Cancelados' },
]

export function RemindersPage() {
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState<VaccineReminder[]>([])
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    try { setItems(await api.reminders(status)) } catch (cause) { setError(errorMessage(cause)) }
  }

  useEffect(() => { void load() }, [status])

  async function generateMissing() {
    try {
      const result = await api.generateMissingReminders()
      setNotice(result.generated ? `Se generaron ${result.generated} recordatorios.` : 'No hay recordatorios faltantes para generar.')
      await load()
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function cancel(id: number) {
    try { await api.cancelReminder(id); await load() } catch (cause) { setError(errorMessage(cause)) }
  }

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} />}
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <PageHeading action={<Button onClick={() => void generateMissing()} variant="primary">Generar faltantes</Button>} description="Seguimiento de los recordatorios anuales de vacunación por email." eyebrow="SEGUIMIENTO CLÍNICO" title="Recordatorios" />
      <div className="mb-4 flex gap-5 overflow-x-auto border-b border-slate-200" role="tablist" aria-label="Estado de recordatorios">
        {views.map((view) => <button aria-selected={status === view.status} className={`shrink-0 border-b-2 px-1 pb-2 text-xs ${status === view.status ? 'border-brand-700 font-semibold text-slate-800' : 'border-transparent text-slate-500'}`} key={view.status} onClick={() => setStatus(view.status)} role="tab" type="button">{view.label}</button>)}
      </div>
      <Panel>
        {items.length ? <div className="divide-y divide-slate-100 px-4">
          {items.map((item) => <article className="flex flex-wrap items-center gap-x-5 gap-y-2 py-4" key={item.id}>
            <div className="min-w-[190px] flex-1"><strong className="block text-sm text-slate-800">{item.patientName} · {item.vaccineName}</strong><span className="mt-1 block text-xs text-slate-500">{item.clientName} · {item.clientEmail || 'Sin email'}</span></div>
            <div className="text-xs text-slate-600"><span className="block text-slate-400">Fecha prevista</span>{formatDate(item.scheduledAt)}</div>
            {item.status === 'error' && <span className="max-w-[240px] text-xs text-red-700" title={item.lastError || ''}>Falló después de {item.attempts} intentos</span>}
            {item.status === 'sent' && <span className="text-xs text-slate-500">Enviado {item.sentAt ? formatDate(item.sentAt.slice(0, 10)) : ''}</span>}
            {item.status === 'pending' && <Button onClick={() => void cancel(item.id)}>Cancelar</Button>}
          </article>)}
        </div> : <EmptyState description={status === 'pending' ? 'Las próximas dosis aparecerán cuando registres vacunas aplicadas.' : 'No hay recordatorios en este estado.'} icon={CalendarClock} title="No hay recordatorios" />}
      </Panel>
    </>
  )
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { dateStyle: 'medium' })
}
