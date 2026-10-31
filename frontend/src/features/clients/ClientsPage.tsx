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
      })
      setDialog(null)
      await refreshClients()
      await openClient(client.id)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function savePatient(data: FormData) {
    if (!selectedClient) return
    try {
      await api.savePatient(selectedClient.id, {
        name: String(data.get('name')),
        species: String(data.get('species')) as Patient['species'],
        sex: String(data.get('sex')) as Patient['sex'],
        castrated: data.get('castrated') === 'yes',
        approximateAge: String(data.get('age')),
      })
      setDialog(null)
      await openClient(selectedClient.id)
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function saveAttention(data: FormData) {
    if (!selectedPatient || !selectedClient) return
    const types = data.getAll('types').map(String)
    const dateTime = new Date(String(data.get('dateTime'))).toISOString()
    const selectedVaccine = vaccines.find((vaccine) => vaccine.id === Number(data.get('vaccine')))
    const vaccineApplications = types.includes('vacuna') && selectedVaccine
      ? [{ vaccineId: selectedVaccine.id, vaccineName: selectedVaccine.name, appliedAt: dateTime }]
      : []

    try {
      const attention = await api.saveAttention(selectedPatient.id, {
        dateTime,
        types,
        reason: String(data.get('reason')),
        observations: String(data.get('observations')),
        ultrasoundReport: String(data.get('ultrasoundReport')) || null,
        chargedAmount: String(data.get('chargedAmount') || '0'),
        debtAmount: String(data.get('debtAmount') || '0'),
        vaccineApplications,
      })
      const files = data.getAll('attachments').filter((item): item is File => item instanceof File && item.size > 0)
      if (files.length) await api.uploadAttentionFiles(attention.id, files)
      setDialog(null)
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

  const closeDialog = () => setDialog(null)

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} />}
      {selectedClient && selectedPatient ? (
        <PatientDetailView
          attentions={attentions}
          onDeleteAttachment={(attentionId, attachmentId) => void (async () => {
            try {
              await api.deleteAttachment(attentionId, attachmentId)
              if (selectedPatient) setAttentions(await api.attentions(selectedPatient.id))
            } catch (cause) { setError(errorMessage(cause)) }
          })()}
          onToggleDeceased={() => void togglePatientDeceased()}
          onBack={() => setSelectedPatient(null)}
          onRecordAttention={() => setDialog('attention')}
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

      {dialog === 'client' && <ClientDialog onClose={closeDialog} onSave={saveClient} />}
      {dialog === 'patient' && <PatientDialog onClose={closeDialog} onSave={savePatient} />}
      {dialog === 'attention' && selectedPatient && (
        <AttentionDialog onClose={closeDialog} onSave={saveAttention} vaccines={vaccines} />
      )}
    </>
  )
}
