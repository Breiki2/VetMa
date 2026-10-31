import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../../api'
import type { SessionUser } from '../../shared/types'
import { errorMessage } from '../../shared/format'
import { ThemeToggle } from '../../shared/theme'
import { Button, FormField, inputStyles } from '../../shared/ui'

export function LoginPage({ onLogin }: { onLogin: (user: SessionUser) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError('')

    const form = new FormData(event.currentTarget)
    try {
      const user = await api.login(String(form.get('email')), String(form.get('password')))
      onLogin(user)
    } catch (cause) {
      setError(errorMessage(cause))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="relative grid min-h-screen place-items-center bg-ground px-4 py-10">
      <div className="absolute right-3 top-3 lg:right-5 lg:top-4">
        <ThemeToggle />
      </div>

      <section className="w-full max-w-[400px] rounded-sheet border border-border bg-surface px-6 py-8 lg:px-9 lg:py-10">
        <div className="mb-7 flex items-center gap-2.5">
          <span className="grid size-9 place-items-center rounded-[10px] bg-accent-soft text-[15px] font-semibold text-accent-ink">
            V
          </span>
          <div>
            <strong className="block text-[17px] font-semibold tracking-[-0.02em] text-text">vetma</strong>
            <span className="block text-xs text-muted">Gestión veterinaria</span>
          </div>
        </div>

        <h1 className="text-2xl font-semibold tracking-[-0.02em] text-text">Ingresá a tu cuenta</h1>
        <p className="mt-1 text-sm text-muted">Clientes, pacientes e historiales de tu consultorio.</p>

        <form className="mt-6 grid gap-4" onSubmit={submit}>
          <FormField label="Email">
            <input
              autoComplete="username"
              className={inputStyles}
              name="email"
              placeholder="tu@email.com"
              required
              type="email"
            />
          </FormField>
          <FormField label="Contraseña">
            <input
              autoComplete="current-password"
              className={inputStyles}
              name="password"
              placeholder="••••••••••"
              required
              type="password"
            />
          </FormField>
          {error && (
            <p className="rounded-control bg-danger-bg px-3 py-2 text-[13px] text-danger" role="alert">
              {error}
            </p>
          )}
          <Button className="mt-1 w-full" disabled={busy} type="submit" variant="primary">
            {busy ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>

        <small className="mt-6 block text-center text-xs text-muted">
          Acceso privado. Las cuentas las crea el administrador.
        </small>
      </section>
    </main>
  )
}
