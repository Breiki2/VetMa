export type SessionUser = {
  id: number
  name: string
  email: string
  role: string
}

export type WorkspaceSection = 'Clientes' | 'Deudas' | 'Recordatorios' | 'Vacunas' | 'Usuarios' | 'Configuración'
