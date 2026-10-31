import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { api, type AdminUser } from '../../api'
import { errorMessage } from '../../shared/format'
import {
  Badge,
  Button,
  FormActions,
  FormField,
  Modal,
  PageHeading,
  Toast,
  formStyles,
  inputStyles,
} from '../../shared/ui'

const userRowGrid =
  'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_110px_100px_170px] lg:gap-4'

export function UsersPage({ currentUserId }: { currentUserId: number }) {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
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

  async function updateUser(formData: FormData) {
    if (!editingUser) return
    try {
      const password = String(formData.get('password'))
      await api.updateUser(editingUser.id, {
        name: String(formData.get('name')),
        email: String(formData.get('email')),
        role: String(formData.get('role')),
        ...(password ? { password } : {}),
      })
      setEditingUser(null)
      await refreshUsers()
    } catch (cause) {
      setError(errorMessage(cause))
    }
  }

  return (
    <>
      {error && <Toast message={error} onDismiss={() => setError('')} tone="error" />}
      <PageHeading
        action={
          <Button className="max-sm:w-full" onClick={() => setIsDialogOpen(true)} variant="primary">
            <Plus size={17} /> Nuevo usuario
          </Button>
        }
        description="Accesos al sistema"
        title="Usuarios"
      />

      <div className={`${userRowGrid} hidden border-b border-rule px-3 py-2 text-xs text-muted lg:grid`}>
        <span>Usuario</span>
        <span>Email</span>
        <span>Rol</span>
        <span>Estado</span>
        <span />
      </div>

      <ul className="divide-y divide-rule border-t border-rule lg:border-t-0">
        {users.map((user) => (
          <li key={user.id}>
            <div className={`${userRowGrid} px-3 py-3.5`}>
              <span className="flex min-w-0 items-center gap-3 max-lg:col-start-1 max-lg:row-start-1">
                <span className="grid size-8 flex-none place-items-center rounded-full bg-accent-soft text-[11px] font-semibold text-accent-ink">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <strong className="truncate text-sm font-medium text-text">{user.name}</strong>
              </span>
              <span className="truncate text-[13px] text-muted max-lg:col-start-1 max-lg:row-start-2 max-lg:pl-11">
                {user.email}
              </span>
              <span className="text-[13px] text-muted max-lg:hidden">
                {user.role === 'admin' ? 'Administrador' : 'Veterinario'}
              </span>
              <span className="max-lg:col-start-2 max-lg:row-start-1 max-lg:self-start">
                <Badge tone={user.active ? 'positive' : 'neutral'}>
                  {user.active ? 'Activo' : 'Desactivado'}
                </Badge>
              </span>
              <span className="flex flex-wrap gap-2 max-lg:col-start-2 max-lg:row-start-2 max-lg:justify-self-end">
                <Button onClick={() => setEditingUser(user)} variant="ghost">
                  Editar
                </Button>
                {user.active && user.id !== currentUserId && (
                  <Button onClick={() => void deactivateUser(user.id)} variant="danger">
                    Desactivar
                  </Button>
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-xl text-[13px] leading-6 text-muted">
        Los usuarios desactivados no pueden iniciar sesión y conservan sus datos.
      </p>

      {isDialogOpen && <UserDialog onClose={() => setIsDialogOpen(false)} onSave={createUser} />}
      {editingUser && (
        <UserDialog onClose={() => setEditingUser(null)} onSave={updateUser} user={editingUser} />
      )}
    </>
  )
}

function UserDialog({
  user,
  onClose,
  onSave,
}: {
  user?: AdminUser
  onClose: () => void
  onSave: (data: FormData) => Promise<void>
}) {
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSave(new FormData(event.currentTarget))
  }

  return (
    <Modal onClose={onClose} title={user ? 'Editar usuario' : 'Crear usuario'}>
      <form className={formStyles} onSubmit={submit}>
        <FormField label="Nombre">
          <input className={inputStyles} defaultValue={user?.name} name="name" required />
        </FormField>
        <FormField label="Email">
          <input className={inputStyles} defaultValue={user?.email} name="email" required type="email" />
        </FormField>
        <FormField label="Rol">
          <select className={inputStyles} defaultValue={user?.role ?? 'veterinarian'} name="role">
            <option value="veterinarian">Veterinario</option>
            <option value="admin">Administrador</option>
          </select>
        </FormField>
        <FormField
          hint={user ? 'Dejá vacío para conservar la contraseña actual.' : 'Mínimo 8 caracteres.'}
          label={user ? 'Restablecer contraseña' : 'Contraseña inicial'}
          optional={Boolean(user)}
        >
          <input
            className={inputStyles}
            minLength={8}
            name="password"
            required={!user}
            type="password"
          />
        </FormField>
        <FormActions>
          <Button onClick={onClose} type="button">
            Cancelar
          </Button>
          <Button type="submit" variant="primary">
            {user ? 'Guardar cambios' : 'Crear usuario'}
          </Button>
        </FormActions>
      </form>
    </Modal>
  )
}
