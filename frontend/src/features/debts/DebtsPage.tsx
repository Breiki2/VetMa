import { useEffect, useState } from 'react'
import { ChevronRight, CircleDollarSign } from 'lucide-react'
import { api, type Client } from '../../api'
import { errorMessage, formatMoney } from '../../shared/format'
import { Button, EmptyState, PageHeading, Toast } from '../../shared/ui'

const debtRowGrid =
  'grid grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-x-3 gap-y-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px_20px] lg:gap-4'

export function DebtsPage({ onOpenClient }: { onOpenClient: (id: number) => void }) {
  const [clients, setClients] = useState<Client[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    api
      .debts()
      .then((result) => {
        setClients(result.items)
        setTotal(result.pagination.total)
      })
      .catch((cause) => setError(errorMessage(cause)))
  }, [])

  function loadMore() {
    const nextPage = page + 1
    api
      .debts(nextPage)
      .then((result) => {
        setClients((current) => [...current, ...result.items])
        setPage(nextPage)
        setTotal(result.pagination.total)
      })
      .catch((cause) => setError(errorMessage(cause)))
  }

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} tone="error" />}
      <PageHeading description="Clientes ordenados por saldo adeudado" title="Deudas pendientes" />

      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-[13px] text-muted">{total} clientes con saldo</span>
      </div>

      <div className={`${debtRowGrid} hidden border-b border-rule px-3 py-2 text-xs text-muted lg:grid`}>
        <span>Cliente</span>
        <span>Contacto</span>
        <span className="text-right">Saldo</span>
        <span />
      </div>

      {clients.length > 0 && (
        <ul className="divide-y divide-rule">
          {clients.map((client) => (
            <li key={client.id}>
              <button
                className={`${debtRowGrid} w-full px-3 py-3.5 text-left transition-colors hover:bg-raised`}
                onClick={() => onOpenClient(client.id)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-3 max-lg:col-start-1 max-lg:row-start-1">
                  <span className="grid size-8 flex-none place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
                    {client.name[0]}
                    {client.surname[0]}
                  </span>
                  <span className="min-w-0">
                    <strong className="block truncate text-sm font-medium text-text">
                      {client.name} {client.surname}
                    </strong>
                    <span className="hidden truncate text-[13px] text-muted lg:block">
                      {client.email || 'Sin email'}
                    </span>
                  </span>
                </span>
                <span className="text-[13px] text-muted max-lg:col-start-1 max-lg:row-start-2 max-lg:pl-11">
                  {client.phone}
                </span>
                <span className="text-right text-sm font-medium tabular-nums text-text max-lg:col-start-2 max-lg:row-start-1 max-lg:self-start">
                  {formatMoney(Number(client.debtTotal || 0))}
                </span>
                <ChevronRight
                  className="text-faint max-lg:col-start-3 max-lg:row-span-2 max-lg:row-start-1 max-lg:self-center max-lg:justify-self-end"
                  size={17}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {clients.length === 0 && (
        <EmptyState
          description="Las deudas ingresadas en cada atención aparecerán acá."
          icon={CircleDollarSign}
          title="No hay saldos pendientes"
        />
      )}

      {clients.length < total && (
        <div className="mt-2 border-t border-rule pt-3 text-center">
          <Button onClick={loadMore} variant="ghost">
            Cargar más clientes
          </Button>
        </div>
      )}
    </>
  )
}
