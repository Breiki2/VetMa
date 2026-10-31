import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { api, type VaccineReminder } from '../../api'
import { errorMessage } from '../../shared/format'
import { Badge, Button, EmptyState, PageHeading, Toast } from '../../shared/ui'

const views = [
  { status: 'pending', label: 'Próximos' },
  { status: 'sent', label: 'Enviados' },
  { status: 'error', label: 'Con error' },
  { status: 'cancelled', label: 'Cancelados' },
]

export function RemindersPage() {
  const [status, setStatus] = useState('pending')
  const [items, setItems] = useState<VaccineReminder[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load(nextPage = 1, append = false) {
    try {
      const result = await api.reminders(status, nextPage)
      setItems((current) => (append ? [...current, ...result.items] : result.items))
      setPage(nextPage)
      setTotal(result.pagination.total)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  useEffect(() => {
    void load()
  }, [status])

  async function generateMissing() {
    try {
      const result = await api.generateMissingReminders()
      setNotice(
        result.generated
          ? `Se generaron ${result.generated} recordatorios.`
          : 'No hay recordatorios faltantes para generar.',
      )
      await load()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function cancel(id: number) {
    try {
      await api.cancelReminder(id)
      await load()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} tone="error" />}
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} tone="success" />}

      <PageHeading
        action={
          <Button className="max-sm:w-full" onClick={() => void generateMissing()} variant="primary">
            Generar faltantes
          </Button>
        }
        description="Recordatorios anuales de vacunación por email"
        title="Recordatorios"
      />

      <div className="overflow-x-auto border-b border-border">
        <div aria-label="Estado de recordatorios" className="flex gap-5" role="tablist">
          {views.map((view) => (
            <button
              aria-selected={status === view.status}
              className={`-mb-px shrink-0 border-b-2 px-0.5 pb-2 text-[13px] transition-colors ${
                status === view.status
                  ? 'border-accent-ink font-medium text-text'
                  : 'border-transparent text-muted hover:text-text'
              }`}
              key={view.status}
              onClick={() => setStatus(view.status)}
              role="tab"
              type="button"
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <span className="text-[13px] text-muted">
          {total} {total === 1 ? 'recordatorio' : 'recordatorios'}
        </span>
      </div>

      {items.length > 0 && (
        <ul className="divide-y divide-rule border-t border-rule">
          {items.map((item) => (
            <li className="py-3.5" key={item.id}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-4 gap-y-1.5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0 max-lg:col-start-1 max-lg:row-start-1">
                  <p className="text-sm font-medium text-text">
                    {item.patientName} · {item.vaccineName}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] text-muted">
                    {item.clientName} · {item.clientEmail || 'Sin email'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[13px] text-muted max-lg:col-span-2 max-lg:row-start-2 lg:col-start-2 lg:row-start-1">
                  <span>
                    {item.status === 'sent' && item.sentAt
                      ? `Enviado el ${formatDate(item.sentAt.slice(0, 10))}`
                      : `Programado para el ${formatDate(item.scheduledAt)}`}
                  </span>
                  <span>Aplicada el {formatDate(item.appliedAt)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 max-lg:col-start-2 max-lg:row-start-1 max-lg:justify-self-end lg:col-start-3 lg:row-start-1">
                  {item.status === 'error' && (
                    <Badge tone="danger">Falló {item.attempts} veces</Badge>
                  )}
                  {item.status === 'sent' && <Badge tone="positive">Enviado</Badge>}
                  {item.status === 'cancelled' && <Badge>Cancelado</Badge>}
                  {item.status === 'pending' && (
                    <Button onClick={() => void cancel(item.id)} variant="ghost">
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
              {item.status === 'error' && item.lastError && (
                <p className="mt-1 max-w-[560px] text-[13px] text-danger" title={item.lastError}>
                  {item.lastError}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length === 0 && (
        <EmptyState
          description={
            status === 'pending'
              ? 'Las próximas dosis aparecerán cuando registres vacunas aplicadas.'
              : 'No hay recordatorios en este estado.'
          }
          icon={CalendarClock}
          title="No hay recordatorios"
        />
      )}

      {items.length < total && (
        <div className="mt-2 border-t border-rule pt-3 text-center">
          <Button onClick={() => void load(page + 1, true)} variant="ghost">
            Cargar más recordatorios
          </Button>
        </div>
      )}
    </>
  )
}

function formatDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('es-AR', { dateStyle: 'medium' })
}
