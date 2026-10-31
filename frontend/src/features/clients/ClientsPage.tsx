import { useEffect, useState } from 'react'
import type { Attention, Client, ClientDetails, Patient, Vaccine } from '../../api'
import { api } from '../../api'
import { errorMessage } from '../../shared/format'
import { Toast } from '../../shared/ui'
import { AttentionDialog, ClientDialog, PatientDialog } from './ClientDialogs'
import {
  ClientDetailView,
  ClientListView,
  PatientDetailView,
} from './ClientViews'

type Dialog = 'client' | 'patient' | 'attention' | null

export function ClientsPage({
  initialClientId,
  onBackFromClient,
  onInitialClientOpened,
  onBreadcrumbChange,
  onClientCountChange,
}: {
  initialClientId: number | null
  onBackFromClient?: () => void
  onInitialClientOpened: () => void
  onBreadcrumbChange: (items: string[]) => void
  onClientCountChange: (count: number) => void
}) {
  const [query, setQuery] = useState('')
  const [searchKind, setSearchKind] = useState<'clients' | 'patients'>('clients')
  const [clients, setClients] = useState<Client[]>([])
  const [patientResults, setPatientResults] = useState<(Patient & { clientId: number; clientName: string })[]>([])
  const [clientTotal, setClientTotal] = useState(0)
  const [clientPage, setClientPage] = useState(1)
  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(null)
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [attentions, setAttentions] = useState<Attention[]>([])
  const [vaccines, setVaccines] = useState<Vaccine[]>([])
  const [dialog, setDialog] = useState<Dialog>(null)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null)
  const [editingAttention, setEditingAttention] = useState<Attention | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    const load = searchKind === 'clients' ? api.clients(query, 1) : api.searchPatients(query, 1)
    load
      .then((result) => {
        if (!active) return
        if (searchKind === 'clients') setClients(result.items as Client[])
        else setPatientResults(result.items as (Patient & { clientId: number; clientName: string })[])
        setClientTotal(result.pagination.total)
        setClientPage(1)
        if (searchKind === 'clients') onClientCountChange(result.pagination.total)
      })
      .catch((cause) => active && setError(errorMessage(cause)))
    return () => { active = false }
  }, [query, searchKind, onClientCountChange])

  useEffect(() => {
    if (initialClientId === null) return
    void openClient(initialClientId).finally(onInitialClientOpened)
  }, [initialClientId])

  useEffect(() => {
    onBreadcrumbChange(
      selectedClient
        ? [
            `${selectedClient.name} ${selectedClient.surname}`,
            ...(selectedPatient ? [selectedPatient.name] : []),
          ]
        : [],
    )
  }, [selectedClient, selectedPatient, onBreadcrumbChange])

  useEffect(() => {
    if (!selectedPatient) {
      setVaccines([])
      return
    }
    api.vaccines(selectedPatient.species).then(setVaccines).catch(() => setVaccines([]))
  }, [selectedPatient])

  async function openClient(id: number) {
    try {
      setSelectedClient(await api.client(id, 1))
      setSelectedPatient(null)
      setAttentions([])
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function loadMorePatients() {
    if (!selectedClient) return
    try {
      const nextPage = selectedClient.patientsPagination.page + 1
      const next = await api.client(selectedClient.id, nextPage)
      setSelectedClient({ ...selectedClient, patients: [...selectedClient.patients, ...next.patients], patientsPagination: next.patientsPagination })
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function openPatient(patient: Patient) {
    setSelectedPatient(patient)
    try {
      setAttentions(await api.attentions(patient.id))
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function saveClient(data: FormData) {
    try {
      const client = await api.saveClient({
        name: String(data.get('name')),
        surname: String(data.get('surname')),
        phone: String(data.get('phone')),
        email: String(data.get('email')) || null,
        address: String(data.get('address')) || null,
        notes: String(data.get('notes')) || null,
      }, editingClient?.id)
      setDialog(null)
      setEditingClient(null)
      await refreshClients()
      if (selectedClient?.id === client.id) setSelectedClient({ ...selectedClient, ...client })
      else await openClient(client.id)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function savePatient(data: FormData) {
    if (!selectedClient) return
    try {
      const payload = {
        name: String(data.get('name')),
        species: String(data.get('species')) as Patient['species'],
        sex: String(data.get('sex')) as Patient['sex'],
        castrated: data.get('castrated') === 'yes',
        breed: String(data.get('breed')) || null,
        birthDate: String(data.get('birthDate')) || null,
        approximateAge: String(data.get('age')) || null,
      }
      const patient = editingPatient
        ? await api.updatePatient(editingPatient.id, payload)
        : await api.savePatient(selectedClient.id, payload)
      setDialog(null)
      setEditingPatient(null)
      const updatedClient = await api.client(selectedClient.id)
      setSelectedClient(updatedClient)
      if (selectedPatient?.id === patient.id) setSelectedPatient(patient)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function saveAttention(data: FormData) {
    if (!selectedPatient || !selectedClient) return
    const types = data.getAll('types').map(String)
    const dateTime = new Date(String(data.get('dateTime'))).toISOString()

    let vaccineApplications: { vaccineId: number; appliedAt: string; batchNumber?: string; observations?: string }[] = []
    if (types.includes('vacuna')) {
      try {
        const parsed = JSON.parse(String(data.get('vaccineApplicationsJson') || '[]')) as {
          vaccineId: string
          appliedAt: string
          batchNumber: string
          observations: string
        }[]
        vaccineApplications = parsed
          .filter((a) => a.vaccineId)
          .map((a) => ({
            vaccineId: Number(a.vaccineId),
            appliedAt: a.appliedAt ? new Date(a.appliedAt).toISOString() : dateTime,
            ...(a.batchNumber ? { batchNumber: a.batchNumber } : {}),
            ...(a.observations ? { observations: a.observations } : {}),
          }))
      } catch {
        vaccineApplications = []
      }
    }

    const reason = data.get('reason')
    const observations = data.get('observations')
    const ultrasoundReport = data.get('ultrasoundReport')

    try {
      const attentionPayload = {
        dateTime,
        types,
        reason: reason === null ? '' : String(reason),
        observations: observations === null ? '' : String(observations),
        ultrasoundReport: ultrasoundReport === null ? null : String(ultrasoundReport) || null,
        chargedAmount: String(data.get('chargedAmount') || '0'),
        debtAmount: String(data.get('debtAmount') || '0'),
        vaccineApplications,
      }
      const attention = editingAttention
        ? await api.updateAttention(editingAttention.id, attentionPayload)
        : await api.saveAttention(selectedPatient.id, attentionPayload)

      const files = data.getAll('attachments').filter((item): item is File => item instanceof File && item.size > 0)
      if (files.length) await api.uploadAttentionFiles(attention.id, files)
      setDialog(null)
      setEditingAttention(null)
      setSelectedClient(await api.client(selectedClient.id))
      setAttentions(await api.attentions(selectedPatient.id))
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function deleteAttention(id: number) {
    if (!selectedPatient || !selectedClient) return
    try {
      await api.deleteAttention(id)
      setSelectedClient(await api.client(selectedClient.id))
      setAttentions(await api.attentions(selectedPatient.id))
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function toggleRemindersOptOut() {
    if (!selectedClient) return
    try {
      const updated = await api.saveClient({ remindersOptOut: !selectedClient.remindersOptOut }, selectedClient.id)
      setSelectedClient({ ...selectedClient, ...updated })
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function togglePatientDeceased() {
    if (!selectedPatient || !selectedClient) return
    try {
      const updated = await api.updatePatient(selectedPatient.id, { deceased: !selectedPatient.deceased })
      setSelectedPatient(updated)
      setSelectedClient({ ...selectedClient, patients: selectedClient.patients.map((patient) => patient.id === updated.id ? updated : patient) })
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function archiveClient() {
    if (!selectedClient) return
    try {
      await api.archiveClient(selectedClient.id)
      setSelectedClient(null)
      setSelectedPatient(null)
      await refreshClients()
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function archivePatient() {
    if (!selectedPatient || !selectedClient) return
    try {
      await api.archivePatient(selectedPatient.id)
      setSelectedPatient(null)
      setAttentions([])
      setSelectedClient(await api.client(selectedClient.id))
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function refreshClients() {
    try {
      const result = await api.clients(query, 1)
      setClients(result.items)
      setClientTotal(result.pagination.total)
      setClientPage(1)
      onClientCountChange(result.pagination.total)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function loadMoreClients() {
    try {
      const nextPage = clientPage + 1
      if (searchKind === 'clients') {
        const result = await api.clients(query, nextPage)
        setClients((current) => [...current, ...result.items])
      } else {
        const result = await api.searchPatients(query, nextPage)
        setPatientResults((current) => [...current, ...result.items])
      }
      setClientPage(nextPage)
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function openPatientSearchResult(clientId: number, patientId: number) {
    try {
      const client = await api.client(clientId)
      const patient = client.patients.find((item) => item.id === patientId)
      if (!patient) return
      setSelectedClient(client)
      await openPatient(patient)
    } catch (cause) { setError(errorMessage(cause)) }
  }

  const closeDialog = () => {
    setDialog(null)
    setEditingClient(null)
    setEditingPatient(null)
    setEditingAttention(null)
  }

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} tone="error" />}
      {selectedClient && selectedPatient ? (
        <PatientDetailView
          attentions={attentions}
          onDeleteAttachment={(attentionId, attachmentId) => void (async () => {
            try {
              await api.deleteAttachment(attentionId, attachmentId)
              if (selectedPatient) setAttentions(await api.attentions(selectedPatient.id))
            } catch (cause) { setError(errorMessage(cause)) }
          })()}
          onDeleteAttention={(attentionId) => void deleteAttention(attentionId)}
          onEditAttention={(attention) => {
            setEditingAttention(attention)
            setDialog('attention')
          }}
          onToggleDeceased={() => void togglePatientDeceased()}
          onArchivePatient={() => void archivePatient()}
          onBack={() => setSelectedPatient(null)}
          onRecordAttention={() => {
            setEditingAttention(null)
            setDialog('attention')
          }}
          patient={selectedPatient}
        />
      ) : selectedClient ? (
        <ClientDetailView
          client={selectedClient}
          onAddPatient={() => setDialog('patient')}
          onBack={() => {
            if (onBackFromClient) onBackFromClient()
            else setSelectedClient(null)
          }}
          onSelectPatient={(patient) => void openPatient(patient)}
          onToggleRemindersOptOut={() => void toggleRemindersOptOut()}
          onLoadMorePatients={() => void loadMorePatients()}
          onEditClient={() => { setEditingClient(selectedClient); setDialog('client') }}
          onArchiveClient={() => void archiveClient()}
          onEditPatient={(patient) => { setEditingPatient(patient); setDialog('patient') }}
        />
      ) : (
        <ClientListView
          clients={clients}
          total={clientTotal}
          hasMore={clients.length < clientTotal}
          onLoadMore={() => void loadMoreClients()}
          searchKind={searchKind}
          onSearchKindChange={setSearchKind}
          patientResults={patientResults}
          onSelectPatientResult={(clientId, patientId) => void openPatientSearchResult(clientId, patientId)}
          onAdd={() => setDialog('client')}
          onQueryChange={setQuery}
          onSelect={(id) => void openClient(id)}
          query={query}
        />
      )}

      {dialog === 'client' && <ClientDialog client={editingClient ?? undefined} onClose={closeDialog} onSave={saveClient} />}
      {dialog === 'patient' && <PatientDialog patient={editingPatient ?? undefined} onClose={closeDialog} onSave={savePatient} />}
      {dialog === 'attention' && selectedPatient && (
        <AttentionDialog
          attention={editingAttention}
          onClose={closeDialog}
          onSave={saveAttention}
          vaccines={vaccines}
        />
      )}
    </>
  )
}
