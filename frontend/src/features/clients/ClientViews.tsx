import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Dog,
  FileText,
  Plus,
  Search,
  Stethoscope,
  Syringe,
  UserRound,
} from 'lucide-react'
import type { Attention, Client, ClientAttention, ClientDetails, Patient } from '../../api'
import { api } from '../../api'
import { attentionTypeLabel, formatMoney } from '../../shared/format'
import {
  Badge,
  Button,
  EmptyState,
  Menu,
  MenuItem,
  PageHeading,
  Stat,
  StatStrip,
  Switch,
  inputStyles,
} from '../../shared/ui'

const clientRowGrid =
  'grid grid-cols-[minmax(0,1fr)_auto_16px] items-center gap-x-3 gap-y-1 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_120px_20px] lg:gap-4'

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
        action={
          <Button className="max-sm:w-full" onClick={onAdd} variant="primary">
            <Plus size={17} /> Nuevo cliente
          </Button>
        }
        description="Pacientes, historiales y saldos de tu consultorio"
        title="Clientes"
      />

      <div className="border-b border-border">
        <div aria-label="Buscar en" className="flex gap-5" role="tablist">
          {(['clients', 'patients'] as const).map((kind) => (
            <button
              aria-selected={searchKind === kind}
              className={`-mb-px border-b-2 px-0.5 pb-2 text-[13px] transition-colors ${
                searchKind === kind
                  ? 'border-accent-ink font-medium text-text'
                  : 'border-transparent text-muted hover:text-text'
              }`}
              key={kind}
              onClick={() => onSearchKindChange(kind)}
              role="tab"
              type="button"
            >
              {kind === 'clients' ? 'Clientes' : 'Pacientes'}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex h-10 w-full items-center gap-2 rounded-control border border-control bg-surface px-3 text-faint sm:max-w-[360px]">
          <Search size={17} />
          <input
            className="w-full bg-transparent text-sm text-text outline-none"
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchKind === 'clients' ? 'Buscar cliente' : 'Buscar paciente'}
            value={query}
          />
        </label>
        <span className="text-[13px] text-muted">
          {total} {searchKind === 'clients' ? 'clientes' : 'pacientes'}
        </span>
      </div>

      {searchKind === 'patients' ? (
        <div className="mt-3">
          {patientResults.length > 0 && (
            <ul className="divide-y divide-rule border-t border-rule">
              {patientResults.map((patient) => (
                <li key={patient.id}>
                  <button
                    className={`${clientRowGrid} w-full px-3 py-3.5 text-left transition-colors hover:bg-raised`}
                    onClick={() => onSelectPatientResult(patient.clientId, patient.id)}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="grid size-8 flex-none place-items-center rounded-full bg-raised text-muted">
                        <Dog size={16} strokeWidth={1.7} />
                      </span>
                      <span className="min-w-0">
                        <strong className="block truncate text-sm font-medium text-text">
                          {patient.name}
                        </strong>
                        <span className="block truncate text-[13px] text-muted">
                          {speciesLabel(patient.species)} · {patient.clientName}
                        </span>
                      </span>
                    </span>
                    <ChevronRight
                      className="text-faint max-lg:col-start-3 max-lg:row-span-2 max-lg:row-start-1 max-lg:self-center max-lg:justify-self-end lg:col-start-4"
                      size={17}
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {patientResults.length === 0 && (
            <EmptyState
              description="Probá con otro nombre de paciente o de cliente."
              icon={Dog}
              title="No encontramos pacientes"
            />
          )}
        </div>
      ) : (
        <div className="mt-3">
          <div className={`${clientRowGrid} hidden border-b border-rule px-3 py-2 text-xs text-muted lg:grid`}>
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
                    className={`${clientRowGrid} w-full px-3 py-3.5 text-left transition-colors hover:bg-raised`}
                    onClick={() => onSelect(client.id)}
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
                    <span
                      className={`text-right text-[13px] tabular-nums max-lg:col-start-2 max-lg:row-start-1 max-lg:self-start ${
                        Number(client.debtTotal) > 0 ? 'font-medium text-text' : 'text-muted'
                      }`}
                    >
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
              action={query ? undefined : 'Crear primer cliente'}
              description={
                query
                  ? 'Probá con otro nombre, email o teléfono.'
                  : 'Cuando agregues un cliente, va a aparecer acá.'
              }
              icon={UserRound}
              onAction={onAdd}
              title={query ? 'No encontramos clientes' : 'Todavía no hay clientes'}
            />
          )}
          {hasMore && (
            <div className="mt-2 border-t border-rule pt-3 text-center">
              <Button onClick={onLoadMore} variant="ghost">
                Cargar más {searchKind === 'clients' ? 'clientes' : 'pacientes'}
              </Button>
            </div>
          )}
        </div>
      )}
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
      <BackButton onClick={onBack}>Volver a clientes</BackButton>
      <PageHeading
        action={
          <>
            <Button className="max-sm:flex-1" onClick={onEditClient}>
              Editar cliente
            </Button>
            <Button className="max-sm:flex-1" onClick={onAddPatient} variant="primary">
              <Plus size={17} /> Agregar paciente
            </Button>
            <Menu label="Más acciones del cliente">
              <MenuItem danger onSelect={onArchiveClient}>
                Archivar cliente
              </MenuItem>
            </Menu>
          </>
        }
        description={`${client.phone} · ${client.email || 'Sin email registrado'}`}
        title={`${client.name} ${client.surname}`}
      />

      <StatStrip>
        <Stat label="Pacientes" value={String(client.patientsPagination.total)} />
        <Stat
          label="Deuda pendiente"
          tone={Number(client.debtTotal) > 0 ? 'danger' : 'default'}
          value={formatMoney(Number(client.debtTotal || 0))}
        />
        <Stat label="Atenciones" value={String(client.attentions.length)} />
      </StatStrip>

      <section className="mt-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-text">Pacientes</h2>
            <p className="mt-0.5 text-[13px] text-muted">Animales asociados a este cliente</p>
          </div>
          <Button onClick={onAddPatient}>
            <Plus size={16} /> Nuevo paciente
          </Button>
        </div>

        {client.patients.length > 0 ? (
          <ul className="mt-3 divide-y divide-rule border-t border-rule">
            {client.patients.map((patient) => (
              <li className="flex items-center gap-1" key={patient.id}>
                <button
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-control px-2 py-3 text-left transition-colors hover:bg-raised"
                  onClick={() => onSelectPatient(patient)}
                  type="button"
                >
                  <span className="grid size-8 flex-none place-items-center rounded-full bg-raised text-muted">
                    <Dog size={16} strokeWidth={1.7} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-medium text-text">
                      {patient.name}
                    </strong>
                    <span className="block truncate text-[13px] text-muted">
                      {speciesLabel(patient.species)} · {patient.breed || 'Raza no indicada'}
                      {patient.deceased ? ' · Fallecido' : ''}
                    </span>
                  </span>
                  <ChevronRight className="text-faint" size={17} />
                </button>
                <Button className="shrink-0" onClick={() => onEditPatient(patient)} variant="ghost">
                  Editar
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            action="Agregar paciente"
            description="Vinculá un animal a la ficha de este cliente."
            icon={Dog}
            onAction={onAddPatient}
            title="Agregá el primer paciente"
          />
        )}
        {client.patients.length < client.patientsPagination.total && (
          <div className="border-t border-rule pt-3 text-center">
            <Button onClick={onLoadMorePatients} variant="ghost">
              Cargar más pacientes
            </Button>
          </div>
        )}
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-[15px] font-semibold text-text">Datos de contacto</h2>
        <dl className="mt-3 grid gap-4 sm:grid-cols-3">
          <ContactValue label="Teléfono" value={client.phone} />
          <ContactValue
            label="Email"
            value={client.email || 'No informado'}
            warning={!client.email ? 'Necesario para enviar recordatorios' : undefined}
          />
          <ContactValue label="Dirección" value={client.address || 'No informada'} />
        </dl>
      </section>

      <section className="mt-8 flex flex-col gap-4 border-t border-border pt-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[15px] font-semibold text-text">Recordatorios por email</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            La preferencia se mantiene aunque cambie la dirección de correo.
          </p>
        </div>
        <Switch
          checked={Boolean(client.remindersOptOut)}
          label="No recibir recordatorios"
          onChange={onToggleRemindersOptOut}
        />
      </section>

      <section className="mt-8 border-t border-border pt-6">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-text">Historial del cliente</h2>
            <p className="mt-0.5 text-[13px] text-muted">Actividad clínica de sus pacientes</p>
          </div>
          <span className="text-[13px] text-muted">{client.attentions.length}</span>
        </div>
        {client.attentions.length ? (
          <ul className="mt-3 border-t border-rule">
            {client.attentions.map((item) => (
              <ClientHistoryRow item={item} key={item.id} />
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-[13px] text-muted">Todavía no hay atenciones registradas.</p>
        )}
      </section>
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
  const vaccineCount = attentions.reduce(
    (count, attention) => count + (attention.vaccineApplications?.length || 0),
    0,
  )
  const debtTotal = attentions.reduce((sum, attention) => sum + Number(attention.debtAmount), 0)
  const pdfUrl = api.patientHistoryPdfUrl(patient.id)

  return (
    <>
      <BackButton onClick={onBack}>Volver a la ficha del cliente</BackButton>
      <PageHeading
        action={
          <>
            <a
              className="hidden h-11 items-center justify-center rounded-control border border-control bg-surface px-4 text-sm font-medium text-text transition-colors hover:bg-raised lg:inline-flex lg:h-9 lg:px-3.5 lg:text-[13px]"
              href={pdfUrl}
            >
              Exportar PDF
            </a>
            <Button className="max-sm:flex-1" onClick={onRecordAttention} variant="primary">
              <Plus size={17} /> Registrar atención
            </Button>
            <Menu label="Más acciones del paciente">
              <MenuItem onSelect={() => window.open(pdfUrl, '_blank', 'noopener')}>
                Exportar PDF
              </MenuItem>
              <MenuItem onSelect={onToggleDeceased}>
                {patient.deceased ? 'Corregir estado' : 'Marcar fallecido'}
              </MenuItem>
              <MenuItem danger onSelect={onArchivePatient}>
                Archivar paciente
              </MenuItem>
            </Menu>
          </>
        }
        description={`${speciesLabel(patient.species)}${patient.breed ? ` · ${patient.breed}` : ''} · ${
          patient.approximateAge || 'Edad sin indicar'
        }`}
        title={patient.name}
      />

      {patient.deceased && (
        <p className="mb-4 rounded-control bg-warning-bg px-3 py-2 text-[13px] text-warning-ink">
          Paciente marcado como fallecido. Sus recordatorios están suspendidos.
        </p>
      )}

      <StatStrip>
        <Stat label="Atenciones" value={String(attentions.length)} />
        <Stat
          label="Deuda acumulada"
          tone={debtTotal > 0 ? 'danger' : 'default'}
          value={formatMoney(debtTotal)}
        />
        <Stat label="Vacunas registradas" value={String(vaccineCount)} />
      </StatStrip>

      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-text">Historial de atenciones</h2>
            <p className="mt-0.5 text-[13px] text-muted">Registro clínico y seguimiento del paciente</p>
          </div>
          <span className="text-[13px] text-muted">{attentions.length}</span>
        </div>

        {attentions.length ? (
          <div className="mt-2 border-t border-rule">
            {attentions.map((attention) => (
              <AttentionRow
                attention={attention}
                key={attention.id}
                onDeleteAttachment={onDeleteAttachment}
                onDeleteAttention={onDeleteAttention}
                onEditAttention={onEditAttention}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            action="Registrar atención"
            description="Registrá la primera consulta para iniciar el historial."
            icon={Stethoscope}
            onAction={onRecordAttention}
            title="Todavía no hay atenciones"
          />
        )}
      </section>
    </>
  )
}

export function BackButton({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      className="mb-4 inline-flex items-center gap-1 rounded-control py-1 text-[13px] text-muted transition-colors hover:text-text"
      onClick={onClick}
      type="button"
    >
      <ChevronLeft size={16} /> {children}
    </button>
  )
}

function AttentionRow({
  attention,
  onEditAttention,
  onDeleteAttention,
  onDeleteAttachment,
}: {
  attention: Attention
  onEditAttention?: (attention: Attention) => void
  onDeleteAttention?: (attentionId: number) => void
  onDeleteAttachment: (attentionId: number, attachmentId: number) => void
}) {
  const debt = Number(attention.debtAmount)
  return (
    <article className="border-b border-rule py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text">
            {attention.types.map(attentionTypeLabel).join(' + ')}
          </p>
          <p className="mt-0.5 text-[13px] text-muted">{formatDate(attention.dateTime)}</p>
        </div>
        <Badge tone={debt > 0 ? 'danger' : 'positive'}>
          {debt > 0 ? `Debe ${formatMoney(debt)}` : 'Al día'}
        </Badge>
      </div>

      {attention.reason && (
        <p className="mt-2 text-[13px] text-text">
          <span className="text-muted">Motivo: </span>
          {attention.reason}
        </p>
      )}
      {attention.observations && (
        <p className="mt-1 whitespace-pre-wrap text-[13px] text-muted">{attention.observations}</p>
      )}
      {attention.ultrasoundReport && (
        <p className="mt-2 whitespace-pre-wrap text-[13px] text-text">
          <span className="text-muted">Informe de ecografía: </span>
          {attention.ultrasoundReport}
        </p>
      )}

      {attention.attachments && attention.attachments.length > 0 && (
        <div className="mt-3 grid gap-2">
          {attention.attachments.map((attachment) => {
            const url = api.attachmentUrl(attention.id, attachment.id)
            const isImage = attachment.mimeType?.startsWith('image/')
            return (
              <div key={attachment.id}>
                {isImage && (
                  <a href={url} rel="noreferrer" target="_blank">
                    <img
                      alt={attachment.name}
                      className="max-h-44 rounded-control border border-border object-cover"
                      src={url}
                    />
                  </a>
                )}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
                  {attachment.mimeType === 'application/pdf' && (
                    <FileText className="shrink-0 text-muted" size={14} />
                  )}
                  <a
                    className="text-accent underline-offset-2 hover:underline"
                    href={url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {attachment.name}
                  </a>
                  <span className="text-muted">{Math.ceil(attachment.size / 1024)} KB</span>
                  <button
                    className="text-[13px] text-danger hover:underline"
                    onClick={() => onDeleteAttachment(attention.id, attachment.id)}
                    type="button"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {attention.vaccineApplications && attention.vaccineApplications.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {attention.vaccineApplications.map((application) => (
            <span
              className="inline-flex h-6 items-center gap-1 rounded-full bg-accent-soft px-2 text-xs text-accent-ink"
              key={application.vaccineId}
            >
              <Syringe size={12} /> {application.vaccineName}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          <span>
            Cobrado{' '}
            <strong className="font-medium tabular-nums text-text">
              {formatMoney(Number(attention.chargedAmount))}
            </strong>
          </span>
          <span>
            Adeudado{' '}
            <strong className="font-medium tabular-nums text-text">{formatMoney(debt)}</strong>
          </span>
        </div>
        <div className="flex gap-1">
          {onEditAttention && (
            <Button onClick={() => onEditAttention(attention)} variant="ghost">
              Editar
            </Button>
          )}
          {onDeleteAttention && (
            <Button onClick={() => onDeleteAttention(attention.id)} variant="danger">
              Eliminar
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function ClientHistoryRow({ item }: { item: ClientAttention }) {
  const debt = Number(item.debtAmount)
  return (
    <li className="border-b border-rule py-3 last:border-b-0">
      <div className="flex items-start gap-2.5">
        <Activity className="mt-0.5 shrink-0 text-faint" size={16} strokeWidth={1.7} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <p className="min-w-0 text-[13px] text-text">
              <strong className="font-medium">{item.patientName}</strong>
              <span className="text-muted"> · {item.types.map(attentionTypeLabel).join(' + ')}</span>
            </p>
            <span className={`text-[13px] tabular-nums ${debt > 0 ? 'text-danger' : 'text-muted'}`}>
              {debt > 0 ? formatMoney(debt) : 'Al día'}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-muted">{formatDate(item.dateTime)}</p>
          {item.reason && <p className="mt-1 text-[13px] text-muted">{item.reason}</p>}
        </div>
      </div>
    </li>
  )
}

function ContactValue({
  label,
  value,
  warning,
}: {
  label: string
  value: string
  warning?: string
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-text">{value}</dd>
      {warning && <p className="mt-1 text-xs text-warning-ink">{warning}</p>}
    </div>
  )
}

function speciesLabel(species: string) {
  return species === 'dog' ? 'Perro' : 'Gato'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}
