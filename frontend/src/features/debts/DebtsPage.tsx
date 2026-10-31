import { useEffect, useState } from 'react'
import { ChevronRight, CircleDollarSign } from 'lucide-react'
import { api, type Client } from '../../api'
import { errorMessage, formatMoney } from '../../shared/format'
import { EmptyState, PageHeading, Panel, Toast } from '../../shared/ui'

export function DebtsPage({ onOpenClient }: { onOpenClient: (id: number) => void }) {
  const [clients, setClients] = useState<Client[]>([])
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    api.debts().then((result) => { setClients(result.items); setTotal(result.pagination.total) }).catch((cause) => setError(errorMessage(cause)))
  }, [])

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} />}
      <PageHeading
        description="Clientes ordenados por saldo adeudado"
        eyebrow="SEGUIMIENTO DE COBROS"
        title="Deudas pendientes"
      />
      <Panel className="overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead className="bg-slate-50 text-[9px] font-bold tracking-widest text-slate-500">
              <tr><th className="h-10 px-4">CLIENTE</th><th className="px-4">CONTACTO</th><th className="px-4">SALDO ADEUDADO</th><th className="w-9 px-4" /></tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  className="h-16 cursor-pointer border-t border-slate-100 text-xs text-slate-600 hover:bg-slate-50"
                  key={client.id}
                  onClick={() => onOpenClient(client.id)}
                >
                  <td className="px-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-9 place-items-center rounded-full bg-emerald-50 text-[11px] font-bold text-brand-700">
                        {client.name[0]}{client.surname[0]}
                      </span>
                      <strong className="text-slate-700">{client.name} {client.surname}</strong>
                    </div>
                  </td>
                  <td className="px-4">{client.phone}</td>
                  <td className="px-4"><strong className="text-debt">{formatMoney(Number(client.debtTotal || 0))}</strong></td>
                  <td className="px-4 text-slate-400"><ChevronRight size={17} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clients.length === 0 && (
          <EmptyState description="Las deudas ingresadas en cada atención aparecerán acá." icon={CircleDollarSign} title="No hay saldos pendientes" />
        )}
        {clients.length < total && <div className="border-t border-slate-100 p-3 text-center"><button className="text-xs font-semibold text-brand-700" onClick={() => {
          const nextPage = page + 1
          api.debts(nextPage).then((result) => { setClients((current) => [...current, ...result.items]); setPage(nextPage); setTotal(result.pagination.total) }).catch((cause) => setError(errorMessage(cause)))
        }} type="button">Cargar más clientes</button></div>}
      </Panel>
    </>
  )
}
