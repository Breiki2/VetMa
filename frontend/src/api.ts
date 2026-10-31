const base = import.meta.env.VITE_API_URL ?? ''
let csrf = ''
export async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const method = (options.method ?? 'GET').toUpperCase()
  const headers = new Headers(options.headers)
  if (options.body) headers.set('Content-Type', 'application/json')
  if (!['GET','HEAD','OPTIONS'].includes(method)) {
    if (!csrf) {
      const response = await fetch(`${base}/api/csrf-token`, {credentials:'include'})
      if (!response.ok) throw new Error('No se pudo iniciar una sesión segura.')
      csrf = (await response.json()).csrfToken
    }
    headers.set('X-CSRF-Token', csrf)
  }
  const response = await fetch(`${base}${path}`, {...options, method, headers, credentials:'include'})
  if (response.status === 204) return undefined as T
  const payload = await response.json()
  if (!response.ok) throw new Error(payload.details ? Object.values(payload.details).join(' ') : payload.error === 'invalid_credentials' ? 'Email o contraseña incorrectos.' : 'Ocurrió un error. Revisá los datos e intentá otra vez.')
  return payload as T
}
export const api = {
  me: () => request<{id:number;name:string;email:string;role:string}>('/api/me'),
  login: (email:string,password:string) => request<{id:number;name:string;email:string;role:string}>('/api/login',{method:'POST',body:JSON.stringify({email,password})}),
  logout: () => request('/api/logout',{method:'POST'}),
  clients: (q='') => request<{items:Client[];pagination:{total:number}}>('/api/clients?q='+encodeURIComponent(q)),
  debts: () => request<Client[]>('/api/clients/debts'),
  client: (id:number) => request<Client & {patients:Patient[];debtTotal:string;attentions:{id:number;patientId:number;patientName:string;dateTime:string;types:string[];chargedAmount:string;debtAmount:string;reason?:string;observations?:string}[]}>(`/api/clients/${id}`),
  saveClient: (data:Partial<Client>,id?:number) => request<Client>(`/api/clients${id?`/${id}`:''}`,{method:id?'PATCH':'POST',body:JSON.stringify(data)}),
  savePatient: (clientId:number,data:Partial<Patient>) => request<Patient>(`/api/clients/${clientId}/patients`,{method:'POST',body:JSON.stringify(data)}),
  updatePatient: (id:number,data:Partial<Patient>) => request<Patient>(`/api/patients/${id}`,{method:'PATCH',body:JSON.stringify(data)}),
  vaccines: (species:string) => request<Vaccine[]>(`/api/vaccines?species=${species}`),
  attentions: (id:number) => request<Attention[]>(`/api/patients/${id}/attentions`),
  saveAttention: (id:number,data:Partial<Attention>) => request<Attention>(`/api/patients/${id}/attentions`,{method:'POST',body:JSON.stringify(data)}),
  users: () => request<AdminUser[]>('/api/admin/users'),
  createUser: (data:{name:string;email:string;role:string;password:string}) => request<AdminUser>('/api/admin/users',{method:'POST',body:JSON.stringify(data)}),
  deactivateUser: (id:number) => request<void>(`/api/admin/users/${id}`,{method:'DELETE'}),
}
export type AdminUser={id:number;name:string;email:string;role:string;active:boolean}
export type Client={id:number;name:string;surname:string;phone:string;email?:string|null;address?:string|null;notes?:string|null;debtTotal?:string;emailMissing?:boolean}
export type Patient={id:number;name:string;species:'dog'|'cat';breed?:string;sex:'female'|'male'|'unknown';birthDate?:string;approximateAge?:string;castrated:boolean;attentions?:Attention[]}
export type Vaccine={id:number;name:string;species:string;active:boolean}
export type Attention={id:number;dateTime:string;types:string[];reason?:string;observations?:string;chargedAmount:string;debtAmount:string;vaccineApplications?:{vaccineId:number;vaccineName?:string;appliedAt:string;batchNumber?:string;observations?:string}[]}
