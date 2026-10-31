import type { SessionUser } from '../../shared/types'
import { PageHeading } from '../../shared/ui'

export function SettingsPage({ user }: { user: SessionUser }) {
  return (
    <PageHeading
      description={`Sesión iniciada como ${user.email} · ${user.role === 'admin' ? 'Administrador' : 'Veterinario'}`}
      eyebrow="CUENTA"
      title="Configuración"
    />
  )
}
