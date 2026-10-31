import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Dog,
  Plus,
  Search,
  Stethoscope,
  Syringe,
  UserRound,
} from 'lucide-react'
import type { Attention, Client, ClientAttention, ClientDetails, Patient } from '../../api'
import { api } from '../../api'
import { attentionTypeLabel, formatMoney } from '../../shared/format'
import { Button, EmptyState, PageHeading, Panel, PanelHeading } from '../../shared/ui'

export function ClientListView({
  clients,
  query,
  onQueryChange,
  onSelect,
  onAdd,
  total,
  hasMore,
  onLoadMore,
  searchKind,
  onSearchKindChange,
  patientResults,
  onSelectPatientResult,
}: {
  clients: Client[]
  query: string
  onQueryChange: (query: string) => void
  onSelect: (id: number) => void
  onAdd: () => void
  total: number
  hasMore: boolean
  onLoadMore: () => void
  searchKind: 'clients' | 'patients'
  onSearchKindChange: (kind: 'clients' | 'patients') => void
  patientResults: (Patient & { clientId: number; clientName: string })[]
  onSelectPatientResult: (clientId: number, patientId: number) => void
}) {
  return (
    <>
      <PageHeading
        action={<Button onClick={onAdd} variant="primary"><Plus size={17} /> Nuevo cliente</Button>}
        description="Gestioná tus clientes y sus pacientes"
        eyebrow="TU CONSULTORIO"
        title="Clientes"
      />
      <div className="mb-4 flex items-center gap-4">
        <div className="flex gap-3 text-xs" role="tablist" aria-label="Buscar en">
          {(['clients', 'patients'] as const).map((kind) => <button aria-selected={searchKind === kind} className={`border-b-2 pb-2 ${searchKind === kind ? 'border-brand-700 font-semibold text-slate-800' : 'border-transparent text-slate-500'}`} key={kind} onClick={() => onSearchKindChange(kind)} role="tab" type="button">{kind === 'clients' ? 'Clientes' : 'Pacientes'}</button>)}
        </div>
        <label className="flex h-[41px] w-full max-w-[440px] flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400">
          <Search size={18} />
          <input
            className="w-full text-xs text-slate-700 outline-none placeholder:text-slate-400"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchKind === 'clients' ? 'Buscar por nombre, teléfono o email…' : 'Buscar pacientes por nombre o cliente…'}
            value={query}
          />
          <kbd className="whitespace-nowrap rounded border border-slate-200 px-1.5 py-0.5 text-[10px]">⌘ K</kbd>
        </label>
        <span className="text-[11px] text-muted">{total} {searchKind === 'clients' ? 'clientes' : 'pacientes'}</span>
      </div>
      <Panel className="overflow-hidden">
        {searchKind === 'patients' ? <div className="divide-y divide-slate-100">
          {patientResults.map((patient) => <button className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50" key={patient.id} onClick={() => onSelectPatientResult(patient.clientId, patient.id)} type="button"><span><strong className="block text-xs text-slate-700">{patient.name}</strong><span className="mt-1 block text-[10px] text-slate-500">{patient.species === 'dog' ? 'Perro' : 'Gato'} · {patient.clientName}</span></span><ChevronRight className="text-slate-400" size={17} /></button>)}
          {patientResults.length === 0 && <EmptyState description="Probá con otro nombre de paciente o cliente." icon={Dog} title="No encontramos pacientes" />}
        </div> : <div className="overflow-auto">
        <div className="overflow-auto">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead className="bg-slate-50 text-[9px] font-bold tracking-widest text-slate-500">
              <tr>
                <th className="h-10 px-4">CLIENTE</th>
                <th className="px-4">CONTACTO</th>
                <th className="px-4">DEUDA PENDIENTE</th>
                <th className="w-9 px-4" />
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr
                  className="h-16 cursor-pointer border-t border-slate-100 text-xs text-slate-600 hover:bg-slate-50"
                  key={client.id}
                  onClick={() => onSelect(client.id)}
                >
                  <td className="px-4">
                    <div className="flex items-center gap-3">
                      <div className="grid size-9 place-items-center rounded-full bg-emerald-50 text-[11px] font-bold text-brand-700">
                        {client.name[0]}{client.surname[0]}
                      </div>
                      <div>
                        <strong className="block text-slate-700">{client.name} {client.surname}</strong>
                        <span className="mt-1 block text-[10px] text-muted">{client.email || 'Email no informado'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4">{client.phone}</td>
                  <td className="px-4">
                    <strong className={Number(client.debtTotal) > 0 ? 'text-debt' : ''}>
                      {formatMoney(Number(client.debtTotal || 0))}
                    </strong>
                  </td>
                  <td className="px-4 text-slate-400"><ChevronRight size={17} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {clients.length === 0 && (
          <EmptyState
            action={query ? undefined : 'Crear primer cliente'}
            description={query ? 'Probá con otro nombre, email o teléfono.' : 'Cuando agregues un cliente, va a aparecer acá.'}
            icon={UserRound}
            onAction={onAdd}
            title={query ? 'No encontramos clientes' : 'Tu lista de clientes está vacía'}
          />
        )}
        </div>}
        {hasMore && <div className="border-t border-slate-100 p-3 text-center"><Button onClick={onLoadMore}>Cargar más {searchKind === 'clients' ? 'clientes' : 'pacientes'}</Button></div>}
      </Panel>
    </>
  )
}

export function ClientDetailView({
  client,
  onBack,
  onAddPatient,
  onSelectPatient,
  onToggleRemindersOptOut,
  onLoadMorePatients,
  onEditClient,
  onArchiveClient,
  onEditPatient,
}: {
  client: ClientDetails
  onBack: () => void
  onAddPatient: () => void
  onSelectPatient: (patient: Patient) => void
  onToggleRemindersOptOut: () => void
  onLoadMorePatients: () => void
  onEditClient: () => void
  onArchiveClient: () => void
  onEditPatient: (patient: Patient) => void
}) {
  return (
    <>
      <ClientAttentionHistory items={client.attentions} />
      <BackButton onClick={onBack}>Volver a clientes</BackButton>
      <PageHeading
        action={<div className="flex flex-wrap gap-2"><Button onClick={onEditClient}>Editar cliente</Button><Button onClick={onArchiveClient}>Archivar</Button><Button onClick={onAddPatient} variant="primary"><Plus size={17} /> Agregar paciente</Button></div>}
        description={`${client.phone} · ${client.email || 'Sin email registrado'}`}
        eyebrow="FICHA DEL CLIENTE"
        title={`${client.name} ${client.surname}`}
      />
      <div className="mb-[18px] grid grid-cols-3 gap-3 max-[650px]:gap-2">
        <StatCard label="Pacientes" value={String(client.patientsPagination.total)} />
        <StatCard label="Deuda pendiente" value={formatMoney(Number(client.debtTotal || 0))} />
        <div className="min-h-[85px] rounded-xl border border-line bg-white px-4 py-3.5 shadow-sm max-[650px]:px-2">
          <span className="block text-[10px] text-muted">Email</span>
          <strong className="mt-1.5 block break-all text-[13px] text-slate-700 max-[650px]:text-[11px]">
            {client.email || 'No informado'}
          </strong>
          {!client.email && <em className="mt-1 block text-[9px] not-italic text-orange-700">Necesario para recordatorios</em>}
        </div>
      </div>

      <Panel>
        <PanelHeading
          action={<Button onClick={onAddPatient}><Plus size={16} /> Nuevo paciente</Button>}
          description="Animales asociados a este cliente"
          title="Pacientes"
        />
        {client.patients.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 p-4 max-[650px]:grid-cols-1">
            {client.patients.map((patient) => (
              <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-white p-3" key={patient.id}>
                <button className="flex min-w-0 flex-1 items-center gap-3 text-left text-slate-500" onClick={() => onSelectPatient(patient)} type="button">
                  <span className="grid size-[38px] shrink-0 place-items-center rounded-xl bg-emerald-50 text-brand-700"><Dog size={21} /></span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-xs text-slate-700">{patient.name}</strong>
                    <span className="mt-1 block text-[10px] text-muted">{patient.species === 'dog' ? 'Perro' : 'Gato'} · {patient.breed || 'Raza no indicada'}</span>
                  </span>
                  <ChevronRight size={18} />
                </button>
                <Button onClick={() => onEditPatient(patient)}>Editar</Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            action="Agregar paciente"
            description="Vinculá un animal a la ficha de este cliente."
            icon={Dog}
            onAction={onAddPatient}
            title="Agregá el primer paciente"
          />
        )}
        {client.patients.length < client.patientsPagination.total && <div className="border-t border-slate-100 p-3 text-center"><Button onClick={onLoadMorePatients}>Cargar más pacientes</Button></div>}
      </Panel>

      <Panel className="p-[17px_18px]">
        <h2 className="mb-4 font-display text-sm font-bold text-slate-700">Datos de contacto</h2>
        <div className="grid grid-cols-3 gap-3 max-[650px]:grid-cols-2">
          <ContactValue label="Teléfono" value={client.phone} />
          <ContactValue label="Email" value={client.email || '—'} />
          <ContactValue label="Dirección" value={client.address || '—'} />
        </div>
      </Panel>

      <Panel className="mt-4 flex flex-wrap items-center justify-between gap-3 p-[17px_18px]">
        <div>
          <h2 className="font-display text-sm font-bold text-slate-700">Recordatorios por email</h2>
          <p className="mt-1 text-[11px] text-muted">La preferencia se mantiene aunque cambie la dirección de correo.</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-slate-700">
          <input checked={Boolean(client.remindersOptOut)} className="accent-brand-700" onChange={onToggleRemindersOptOut} type="checkbox" />
          No recibir recordatorios
        </label>
      </Panel>
    </>
  )
}

export function PatientDetailView({
  patient,
  attentions,
  onBack,
  onRecordAttention,
  onEditAttention,
  onDeleteAttention,
  onDeleteAttachment,
  onToggleDeceased,
  onArchivePatient,
}: {
  patient: Patient
  attentions: Attention[]
  onBack: () => void
  onRecordAttention: () => void
  onEditAttention?: (attention: Attention) => void
  onDeleteAttention?: (attentionId: number) => void
  onDeleteAttachment: (attentionId: number, attachmentId: number) => void
  onToggleDeceased: () => void
  onArchivePatient: () => void
}) {
  const vaccineCount = attentions.reduce((count, attention) => count + (attention.vaccineApplications?.length || 0), 0)
  const debtTotal = attentions.reduce((sum, attention) => sum + Number(attention.debtAmount), 0)

  return (
    <>
      <BackButton onClick={onBack}>Volver a ficha de cliente</BackButton>
      <PageHeading
        action={<div className="flex flex-wrap gap-2"><a className="inline-flex h-9 items-center rounded-md border border-slate-200 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50" href={api.patientHistoryPdfUrl(patient.id)}>Exportar PDF</a><Button onClick={onToggleDeceased}>{patient.deceased ? 'Corregir estado' : 'Marcar fallecido'}</Button><Button onClick={onArchivePatient}>Archivar paciente</Button><Button onClick={onRecordAttention} variant="primary"><Plus size={17} /> Registrar atención</Button></div>}
        description={`${patient.species === 'dog' ? 'Perro' : 'Gato'}${patient.breed ? ` · ${patient.breed}` : ''} · ${patient.approximateAge || 'Edad sin indicar'}`}
        eyebrow="HISTORIAL CLÍNICO"
        title={patient.name}
      />
      {patient.deceased && <p className="-mt-3 mb-4 text-xs text-slate-500">Paciente marcado como fallecido; sus recordatorios están suspendidos.</p>}
      <div className="mb-[18px] grid grid-cols-3 gap-3 max-[650px]:gap-2">
        <StatCard label="Atenciones" value={String(attentions.length)} />
        <StatCard label="Deuda acumulada" value={formatMoney(debtTotal)} />
        <StatCard label="Vacunas registradas" value={String(vaccineCount)} />
      </div>
      <Panel>
        <PanelHeading description="Registro clínico y seguimiento del paciente" title="Historial de atenciones" />
        {attentions.length ? (
          <AttentionTimeline
            attentions={attentions}
            onDeleteAttachment={onDeleteAttachment}
            onDeleteAttention={onDeleteAttention}
            onEditAttention={onEditAttention}
          />
        ) : (
          <EmptyState
            action="Registrar atención"
            description="Registrá la primera consulta para iniciar el historial."
            icon={Stethoscope}
            onAction={onRecordAttention}
            title="Todavía no hay atenciones"
          />
        )}
      </Panel>
    </>
  )
}

export function BackButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button className="mb-[18px] flex items-center gap-1 bg-transparent p-0 text-[11px] text-slate-500 hover:text-brand-800" onClick={onClick} type="button">
      <ChevronLeft size={16} /> {children}
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-h-[85px] rounded-xl border border-line bg-white px-4 py-3.5 shadow-sm max-[650px]:px-2">
      <span className="block text-[10px] text-muted max-[650px]:text-[9px]">{label}</span>
      <strong className="mt-1.5 block font-display text-xl font-bold text-brand-800 max-[650px]:text-[15px]">{value}</strong>
    </div>
  )
}

function ContactValue({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="mb-1 block text-[10px] text-muted">{label}</span>
      <strong className="text-[11px] text-slate-700">{value}</strong>
    </div>
  )
}

function ClientAttentionHistory({ items }: { items: ClientAttention[] }) {
  return (
    <Panel>
      <PanelHeading description="Actividad clínica de sus pacientes" title="Historial de atenciones" />
      {items.length ? (
        <div className="px-5 py-1">
          {items.map((item) => (
            <article className="flex gap-3 border-b border-slate-100 py-4 last:border-0" key={item.id}>
              <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-brand-700"><Activity size={17} /></span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between gap-2">
                  <div>
                    <strong className="block text-xs text-slate-700">{item.patientName} · {item.types.map(attentionTypeLabel).join(' + ')}</strong>
                    <span className="mt-1 block text-[10px] text-muted">{formatDate(item.dateTime)}</span>
                  </div>
                  <span className="h-fit whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                    {Number(item.debtAmount) > 0 ? `Debe ${formatMoney(Number(item.debtAmount))}` : 'Al día'}
                  </span>
                </div>
                {item.reason && <p className="mt-2 text-[11px] text-slate-500">{item.reason}</p>}
                <div className="mt-2 flex gap-5 border-t border-slate-100 pt-2 text-[10px] text-muted">
                  <span>Cobrado <strong className="ml-1 text-slate-600">{formatMoney(Number(item.chargedAmount))}</strong></span>
                  <span>Adeudado <strong className="ml-1 text-slate-600">{formatMoney(Number(item.debtAmount))}</strong></span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="p-5 text-center text-xs text-muted">Todavía no hay atenciones registradas.</p>
      )}
    </Panel>
  )
}

function AttentionTimeline({
  attentions,
  onEditAttention,
  onDeleteAttention,
  onDeleteAttachment,
}: {
  attentions: Attention[]
  onEditAttention?: (attention: Attention) => void
  onDeleteAttention?: (attentionId: number) => void
  onDeleteAttachment: (attentionId: number, attachmentId: number) => void
}) {
  return (
    <div className="px-5 py-1">
      {attentions.map((attention) => (
        <article className="flex gap-3 border-b border-slate-100 py-4 last:border-0" key={attention.id}>
          <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-brand-700"><Activity size={17} /></span>
          <div className="min-w-0 flex-1">
            <div className="flex justify-between gap-2">
              <div>
                <strong className="block text-xs text-slate-700">{attention.types.map(attentionTypeLabel).join(' + ')}</strong>
                <span className="mt-1 block text-[10px] text-muted">{formatDate(attention.dateTime)}</span>
              </div>
              <span className="h-fit whitespace-nowrap rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
                {Number(attention.debtAmount) > 0 ? `Debe ${formatMoney(Number(attention.debtAmount))}` : 'Al día'}
              </span>
            </div>
            {attention.reason && <p className="mt-2 text-[11px] text-slate-500"><strong>Motivo:</strong> {attention.reason}</p>}
            {attention.observations && <p className="mt-2 text-[11px] leading-relaxed text-slate-500">{attention.observations}</p>}
            {attention.ultrasoundReport && <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-slate-600"><strong>Informe de ecografía:</strong> {attention.ultrasoundReport}</p>}
            {attention.attachments?.map((attachment) => (
              <div className="mt-2 flex items-center gap-2 text-[11px]" key={attachment.id}>
                <a className="text-brand-700 underline" href={api.attachmentUrl(attention.id, attachment.id)} rel="noreferrer" target="_blank">{attachment.name} · {Math.ceil(attachment.size / 1024)} KB</a>
                <button className="text-red-700 underline" onClick={() => onDeleteAttachment(attention.id, attachment.id)} type="button">Eliminar</button>
              </div>
            ))}
            {attention.vaccineApplications?.map((application) => (
              <span className="mr-1.5 mt-1 inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-[10px] text-brand-700" key={application.vaccineId}>
                <Syringe size={14} />{application.vaccineName}
              </span>
            ))}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10px] text-muted">
              <div className="flex gap-5">
                <span>Cobrado <strong className="ml-1 text-slate-600">{formatMoney(Number(attention.chargedAmount))}</strong></span>
                <span>Adeudado <strong className="ml-1 text-slate-600">{formatMoney(Number(attention.debtAmount))}</strong></span>
              </div>
              <div className="flex gap-2">
                {onEditAttention && <Button onClick={() => onEditAttention(attention)}>Editar</Button>}
                {onDeleteAttention && <Button onClick={() => onDeleteAttention(attention.id)}>Eliminar</Button>}
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}
