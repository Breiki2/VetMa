const base = import.meta.env.VITE_API_URL ?? ''
let csrfToken = ''

export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)

  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json')
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    if (!csrfToken) {
      const response = await fetch(`${base}/api/csrf-token`, { credentials: 'include' })
      if (!response.ok) throw new Error('No se pudo iniciar una sesión segura.')
      csrfToken = (await response.json()).csrfToken
    }
    headers.set('X-CSRF-Token', csrfToken)
  }

  const response = await fetch(`${base}${path}`, {
    ...options,
    method,
    headers,
    credentials: 'include',
  })
  if (path === '/api/logout' && response.redirected) {
    csrfToken = ''
    return undefined as T
  }
  if (response.status === 204) {
    if (path === '/api/logout') csrfToken = ''
    return undefined as T
  }

  const payload = await response.json()
  if (!response.ok) {
    const message = payload.details
      ? Object.values(payload.details).join(' ')
      : payload.error === 'invalid_credentials'
        ? 'Email o contraseña incorrectos.'
        : payload.error === 'current_password_invalid'
          ? 'La contraseña actual no es correcta.'
        : 'Ocurrió un error. Revisá los datos e intentá otra vez.'
    throw new Error(message)
  }

  if (path === '/api/login') csrfToken = ''
  return payload as T
}

export const api = {
  me: () => request<{ id: number; name: string; email: string; role: string }>('/api/me'),
  login: (email: string, password: string) =>
    request<{ id: number; name: string; email: string; role: string }>('/api/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  logout: () => request('/api/logout', { method: 'POST' }),
  clients: (query = '', page = 1) =>
    request<{ items: Client[]; pagination: { total: number; page: number; limit: number } }>(
      `/api/clients?q=${encodeURIComponent(query)}&page=${page}`,
    ),
  debts: (page = 1) => request<{ items: Client[]; pagination: { total: number; page: number; limit: number } }>(`/api/clients/debts?page=${page}`),
  client: (id: number, page = 1) => request<ClientDetails>(`/api/clients/${id}?page=${page}`),
  saveClient: (data: Partial<Client>, id?: number) =>
    request<Client>(`/api/clients${id ? `/${id}` : ''}`, {
      method: id ? 'PATCH' : 'POST',
      body: JSON.stringify(data),
    }),
  archiveClient: (id: number) => request<void>(`/api/clients/${id}`, { method: 'DELETE' }),
  savePatient: (clientId: number, data: Partial<Patient>) =>
    request<Patient>(`/api/clients/${clientId}/patients`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updatePatient: (id: number, data: Partial<Patient>) =>
    request<Patient>(`/api/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  archivePatient: (id: number) => request<void>(`/api/patients/${id}`, { method: 'DELETE' }),
  vaccines: (species: string) => request<Vaccine[]>(`/api/vaccines?species=${species}`),
  attentions: (patientId: number) => request<Attention[]>(`/api/patients/${patientId}/attentions`),
  saveAttention: (patientId: number, data: Partial<Attention>) =>
    request<Attention>(`/api/patients/${patientId}/attentions`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  uploadAttentionFiles: async (attentionId: number, files: FileList | File[]) => {
    const headers = new Headers()
    if (!csrfToken) {
      const response = await fetch(`${base}/api/csrf-token`, { credentials: 'include' })
      if (!response.ok) throw new Error('No se pudo iniciar una sesión segura.')
      csrfToken = (await response.json()).csrfToken
    }
    headers.set('X-CSRF-Token', csrfToken)
    const body = new FormData()
    Array.from(files).forEach((file) => body.append('files[]', file))
    const response = await fetch(`${base}/api/attentions/${attentionId}/attachments`, { method: 'POST', body, headers, credentials: 'include' })
    const payload = await response.json()
    if (!response.ok) throw new Error(payload.error === 'too_many_files' ? 'La atención admite hasta 10 archivos.' : 'No se pudieron adjuntar los archivos.')
    return payload.items as AttentionAttachment[]
  },
  deleteAttachment: (attentionId: number, attachmentId: number) => request<void>(`/api/attentions/${attentionId}/attachments/${attachmentId}`, { method: 'DELETE' }),
  attachmentUrl: (attentionId: number, attachmentId: number) => `${base}/api/attentions/${attentionId}/attachments/${attachmentId}`,
  patientHistoryPdfUrl: (patientId: number) => `${base}/api/patients/${patientId}/history.pdf`,
  reminders: (status?: string, page = 1) => request<{ items: VaccineReminder[]; pagination: { total: number; page: number; limit: number } }>(`/api/reminders?${status ? `status=${encodeURIComponent(status)}&` : ''}page=${page}`),
  searchPatients: (query: string, page = 1) => request<{ items: (Patient & { clientId: number; clientName: string })[]; pagination: { total: number } }>(`/api/patients?q=${encodeURIComponent(query)}&page=${page}`),
  generateMissingReminders: () => request<{ generated: number }>('/api/reminders/generate-missing', { method: 'POST', body: JSON.stringify({}) }),
  cancelReminder: (id: number) => request<VaccineReminder>(`/api/reminders/${id}/cancel`, { method: 'POST', body: JSON.stringify({}) }),
  users: () => request<AdminUser[]>('/api/admin/users'),
  createUser: (data: { name: string; email: string; role: string; password: string }) =>
    request<AdminUser>('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: number, data: { name?: string; email?: string; role?: string; active?: boolean; password?: string }) => request<AdminUser>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deactivateUser: (id: number) => request<void>(`/api/admin/users/${id}`, { method: 'DELETE' }),
  updateProfile: (data: { name: string; email: string }) => request<SessionProfile>('/api/me', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data: { currentPassword: string; newPassword: string }) => request<{ ok: true }>('/api/me/password', { method: 'PATCH', body: JSON.stringify(data) }),
}

type SessionProfile = { id: number; name: string; email: string; role: string }

export type AdminUser = {
  id: number
  name: string
  email: string
  role: string
  active: boolean
}

export type Client = {
  id: number
  name: string
  surname: string
  phone: string
  email?: string | null
  address?: string | null
  notes?: string | null
  debtTotal?: string
  emailMissing?: boolean
  remindersOptOut?: boolean
}

export type ClientDetails = Client & {
  patients: Patient[]
  patientsPagination: { page: number; limit: number; total: number }
  debtTotal: string
  attentions: ClientAttention[]
}

export type ClientAttention = {
  id: number
  patientId: number
  patientName: string
  dateTime: string
  types: string[]
  chargedAmount: string
  debtAmount: string
  reason?: string
  observations?: string
}

export type Patient = {
  id: number
  name: string
  species: 'dog' | 'cat'
  breed?: string | null
  sex: 'female' | 'male' | 'unknown'
  birthDate?: string | null
  approximateAge?: string | null
  castrated: boolean
  deceased?: boolean
  attentions?: Attention[]
}

export type Vaccine = {
  id: number
  name: string
  species: string
  active: boolean
}

export type Attention = {
  id: number
  dateTime: string
  types: string[]
  reason?: string
  observations?: string
  ultrasoundReport?: string | null
  attachments?: AttentionAttachment[]
  chargedAmount: string
  debtAmount: string
  vaccineApplications?: {
    vaccineId: number
    vaccineName?: string
    appliedAt: string
    batchNumber?: string
    observations?: string
  }[]
}

export type AttentionAttachment = { id: number; name: string; mimeType: string; size: number }

export type VaccineReminder = {
  id: number
  scheduledAt: string
  status: 'pending' | 'sent' | 'error' | 'cancelled'
  attempts: number
  lastError?: string | null
  sentAt?: string | null
  clientName: string
  patientName: string
  vaccineName: string
  appliedAt: string
  clientEmail?: string | null
  veterinarianName: string
  veterinarianEmail: string
}
