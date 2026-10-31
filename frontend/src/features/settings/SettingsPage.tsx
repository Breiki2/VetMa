import { useState, type FormEvent } from 'react'
import type { SessionUser } from '../../shared/types'
import { errorMessage } from '../../shared/format'
import { api } from '../../api'
import { Button, FormActions, FormField, formStyles, inputStyles, PageHeading, Panel, Toast } from '../../shared/ui'

export function SettingsPage({ user, onUserUpdate }: { user: SessionUser; onUserUpdate: (user: SessionUser) => void }) {
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function updateProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    try {
      const profile = await api.updateProfile({ name: String(data.get('name')), email: String(data.get('email')) })
      onUserUpdate(profile)
      setNotice('Datos de contacto actualizados.')
      setError('')
    } catch (cause) { setError(errorMessage(cause)) }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    try {
      await api.changePassword({ currentPassword: String(data.get('currentPassword')), newPassword: String(data.get('newPassword')) })
      form.reset()
      setNotice('Contraseña actualizada.')
      setError('')
    } catch (cause) { setError(errorMessage(cause)) }
  }

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} />}
      {notice && <Toast message={notice} onDismiss={() => setNotice('')} />}
      <PageHeading description={`Sesión iniciada como ${user.email} · ${user.role === 'admin' ? 'Administrador' : 'Veterinario'}`} eyebrow="CUENTA" title="Configuración" />
      <div className="grid max-w-[760px] gap-4">
        <Panel className="p-5">
          <h2 className="mb-4 font-display text-sm font-bold text-slate-700">Datos de contacto</h2>
          <form className={formStyles} onSubmit={(event) => void updateProfile(event)}>
            <FormField label="Nombre"><input className={inputStyles} defaultValue={user.name} name="name" required /></FormField>
            <FormField label="Email de contacto"><input className={inputStyles} defaultValue={user.email} name="email" required type="email" /></FormField>
            <FormActions><Button type="submit" variant="primary">Guardar datos</Button></FormActions>
          </form>
        </Panel>
        <Panel className="p-5">
          <h2 className="mb-4 font-display text-sm font-bold text-slate-700">Cambiar contraseña</h2>
          <form className={formStyles} onSubmit={(event) => void changePassword(event)}>
            <FormField label="Contraseña actual"><input autoComplete="current-password" className={inputStyles} name="currentPassword" required type="password" /></FormField>
            <FormField label="Nueva contraseña"><input autoComplete="new-password" className={inputStyles} minLength={12} name="newPassword" required type="password" /><span className="text-[10px] font-normal text-slate-400">Usá al menos 12 caracteres.</span></FormField>
            <FormActions><Button type="submit" variant="primary">Actualizar contraseña</Button></FormActions>
          </form>
        </Panel>
      </div>
    </>
  )
}
