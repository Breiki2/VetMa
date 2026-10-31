import { useState } from 'react'
import type { FormEvent } from 'react'
import { api } from '../../api'
import type { SessionUser } from '../../shared/types'
import { errorMessage } from '../../shared/format'
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
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(ellipse_at_80%_20%,#e0e9d8_0%,#f5f7f4_43%,#edf2ee_100%)] p-5">
      <section className="w-full max-w-[410px] rounded-2xl border border-slate-100 bg-white px-[38px] py-9 shadow-xl max-[650px]:px-6">
        <div className="mb-6 grid size-[37px] place-items-center rounded-xl bg-brand-200 font-display text-xl font-extrabold text-brand-950">
          V
        </div>
        <p className="mb-2 text-[10px] font-bold tracking-[1.3px] text-slate-500">GESTIÓN VETERINARIA</p>
        <h1 className="font-display text-2xl font-bold tracking-tight text-slate-800">Bienvenido a VetMa</h1>
        <p className="mb-6 mt-2 text-xs text-muted">Ingresá a tu espacio de trabajo</p>

        <form className="grid gap-4" onSubmit={submit}>
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
          {error && <p className="text-[11px] text-red-700" role="alert">{error}</p>}
          <Button className="mt-1 w-full" disabled={busy} type="submit" variant="primary">
            {busy ? 'Ingresando…' : 'Iniciar sesión'}
          </Button>
        </form>
        <small className="mt-6 block text-center text-[10px] text-slate-400">
          Acceso privado para veterinarios
        </small>
      </section>
    </main>
  )
}
