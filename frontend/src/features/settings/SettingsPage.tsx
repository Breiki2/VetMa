import { useState, type FormEvent } from 'react'
import type { SessionUser } from '../../shared/types'
import { errorMessage } from '../../shared/format'
import { api } from '../../api'
import {
  Button,
  FormActions,
  FormField,
  PageHeading,
  Toast,
  formStyles,
  inputStyles,
} from '../../shared/ui'

export function SettingsPage({
  user,
  onUserUpdate,
}: {
  user: SessionUser
  onUserUpdate: (user: SessionUser) => void
}) {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      const profile = await api.updateProfile({
        name: String(data.get('name')),
        email: String(data.get('email')),
      })
      onUserUpdate(profile)
      setNotice('Datos de contacto actualizados.')
      setError('')
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    try {
      await api.changePassword({
        currentPassword: String(data.get('currentPassword')),
        newPassword: String(data.get('newPassword')),
      })
      form.reset()
      setNotice('Contraseña actualizada.')
      setError('')
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} tone="error" />}
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} tone="success" />}

      <PageHeading
        description={`${user.email} · ${user.role === 'admin' ? 'Administrador' : 'Veterinario'}`}
        title="Configuración"
      />

      <div className="max-w-[1040px]">
        <section className="border-t border-border py-7 first:border-t-0 first:pt-0 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-10">
          <div>
            <h2 className="text-[15px] font-semibold text-text">Datos de contacto</h2>
            <p className="mt-1 text-[13px] text-muted">
              El nombre y el email identifican tu cuenta en el sistema.
            </p>
          </div>
          <div className="mt-4 rounded-card bg-raised p-4 lg:mt-0 lg:p-5">
            <form className={formStyles} onSubmit={(event) => void updateProfile(event)}>
              <FormField label="Nombre">
                <input className={inputStyles} defaultValue={user.name} name="name" required />
              </FormField>
              <FormField label="Email de contacto">
                <input
                  className={inputStyles}
                  defaultValue={user.email}
                  name="email"
                  required
                  type="email"
                />
              </FormField>
              <FormActions>
                <Button type="submit" variant="primary">
                  Guardar datos
                </Button>
              </FormActions>
            </form>
          </div>
        </section>

        <section className="border-t border-border py-7 lg:grid lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.3fr)] lg:gap-10">
          <div>
            <h2 className="text-[15px] font-semibold text-text">Cambiar contraseña</h2>
            <p className="mt-1 text-[13px] text-muted">
              Usá una contraseña de al menos 12 caracteres que no uses en otro sitio.
            </p>
          </div>
          <div className="mt-4 rounded-card bg-raised p-4 lg:mt-0 lg:p-5">
            <form className={formStyles} onSubmit={(event) => void changePassword(event)}>
              <FormField label="Contraseña actual">
                <input
                  autoComplete="current-password"
                  className={inputStyles}
                  name="currentPassword"
                  required
                  type="password"
                />
              </FormField>
              <FormField hint="Usá al menos 12 caracteres." hintId="new-password-hint" label="Nueva contraseña">
                <input
                  aria-describedby="new-password-hint"
                  autoComplete="new-password"
                  className={inputStyles}
                  minLength={12}
                  name="newPassword"
                  required
                  type="password"
                />
              </FormField>
              <FormActions>
                <Button type="submit" variant="primary">
                  Actualizar contraseña
                </Button>
              </FormActions>
            </form>
          </div>
        </section>
      </div>
    </>
  )
}
