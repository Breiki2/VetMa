import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { api, type AdminUser } from '../../api'
import { errorMessage } from '../../shared/format'
import { Button, FormActions, FormField, formStyles, inputStyles, Modal, PageHeading, Panel, Toast } from '../../shared/ui'

export function UsersPage({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [error, setError] = useState('')

  async function refreshUsers() {
    try {
      setUsers(await api.users())
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  useEffect(() => {
    void refreshUsers()
  }, [])

  async function createUser(formData: FormData) {
    try {
      await api.createUser({
        name: String(formData.get('name')),
        email: String(formData.get('email')),
        role: String(formData.get('role')),
        password: String(formData.get('password')),
      })
      setIsDialogOpen(false)
      await refreshUsers()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  async function deactivateUser(id: number) {
    try {
      await api.deactivateUser(id)
      await refreshUsers()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} />}
      <PageHeading
        action={<Button onClick={() => setIsDialogOpen(true)} variant="primary"><Plus size={17} /> Nuevo usuario</Button>}
        description="Administrá los accesos al sistema"
        eyebrow="ADMINISTRACIÓN"
        title="Usuarios"
      />
      <Panel className="overflow-hidden">
        <div className="overflow-auto">
          <table className="w-full min-w-[650px] border-collapse text-left">
            <thead className="bg-slate-50 text-[9px] font-bold tracking-widest text-slate-500">
              <tr><th className="h-10 px-4">USUARIO</th><th className="px-4">EMAIL</th><th className="px-4">ROL</th><th className="px-4">ESTADO</th><th className="px-4" /></tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr className="h-16 border-t border-slate-100 text-xs text-slate-600" key={user.id}>
                  <td className="px-4"><strong className="text-slate-700">{user.name}</strong></td>
                  <td className="px-4">{user.email}</td>
                  <td className="px-4">{user.role === 'admin' ? 'Administrador' : 'Veterinario'}</td>
                  <td className="px-4">{user.active ? 'Activo' : 'Desactivado'}</td>
                  <td className="px-4 text-right">
                    {user.active && user.id !== currentUserId && (
                      <Button onClick={() => void deactivateUser(user.id)}>Desactivar</Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      {isDialogOpen && <UserDialog onClose={() => setIsDialogOpen(false)} onSave={createUser} />}
    </>
  )
}

function UserDialog({ onClose, onSave }: { onClose: () => void; onSave: (data: FormData) => Promise<void> }) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal eyebrow="ADMINISTRACIÓN" onClose={onClose} title="Crear usuario">
      <form className={formStyles} onSubmit={submit}>
        <FormField label="Nombre"><input className={inputStyles} name="name" required /></FormField>
        <FormField label="Email"><input className={inputStyles} name="email" required type="email" /></FormField>
        <FormField label="Rol">
          <select className={inputStyles} name="role"><option value="veterinarian">Veterinario</option><option value="admin">Administrador</option></select>
        </FormField>
        <FormField label="Contraseña inicial">
          <input className={inputStyles} minLength={8} name="password" required type="password" />
          <span className="text-[10px] font-normal text-slate-400">Mínimo 8 caracteres</span>
        </FormField>
        <FormActions>
          <Button onClick={onClose} type="button">Cancelar</Button>
          <Button type="submit" variant="primary">Crear usuario</Button>
        </FormActions>
      </form>
    </Modal>
  )
}
