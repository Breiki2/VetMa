import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import { ClientsPage } from './features/clients/ClientsPage'
import { DebtsPage } from './features/debts/DebtsPage'
import { LoginPage } from './features/auth/LoginPage'
import { RemindersPage } from './features/reminders/RemindersPage'
import { SettingsPage } from './features/settings/SettingsPage'
import { UsersPage } from './features/users/UsersPage'
import { VaccinesPage } from './features/vaccines/VaccinesPage'
import { AppShell } from './layout/AppShell'
import type { SessionUser, WorkspaceSection } from './shared/types'

const APP_PREFIX = '/app'
const sectionPaths: Record<WorkspaceSection, string> = {
  Clientes: `${APP_PREFIX}/clients`,
  Deudas: `${APP_PREFIX}/debts`,
  Recordatorios: `${APP_PREFIX}/reminders`,
  Vacunas: `${APP_PREFIX}/vaccines`,
  Usuarios: `${APP_PREFIX}/users`,
  'Configuración': `${APP_PREFIX}/settings`,
}

function sectionFromPath(pathname: string): WorkspaceSection | null {
  return (Object.entries(sectionPaths).find(([, path]) => path === pathname)?.[0] as WorkspaceSection | undefined) ?? null
}

function navigate(path: string, replace = false) {
  if (window.location.pathname === path) return
  window.history[replace ? 'replaceState' : 'pushState']({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function App() {
  const [user, setUser] = useState<SessionUser | null>(null)
  const [route, setRoute] = useState(() => window.location.pathname)
  const [sessionReady, setSessionReady] = useState(false)
  const [section, setSection] = useState<WorkspaceSection>(() => sectionFromPath(window.location.pathname) ?? 'Clientes')
  const [breadcrumbs, setBreadcrumbs] = useState<string[]>([])
  const [clientCount, setClientCount] = useState(0)
  const [initialClientId, setInitialClientId] = useState<number | null>(null)
  const [returnSection, setReturnSection] = useState<WorkspaceSection | null>(null)

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', syncRoute)
    api.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setSessionReady(true))
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  useEffect(() => {
    if (!sessionReady) return

    if (!user) {
      if (route !== `${APP_PREFIX}/login`) navigate(`${APP_PREFIX}/login`, true)
      return
    }

    const requestedSection = sectionFromPath(route)
    if (!requestedSection || (requestedSection === 'Usuarios' && user.role !== 'admin')) {
      const fallback = sectionPaths.Clientes
      if (route !== fallback) navigate(fallback, true)
      setSection('Clientes')
      return
    }

    if (route !== `${APP_PREFIX}/login`) setSection(requestedSection)
    else navigate(sectionPaths.Clientes, true)
  }, [route, sessionReady, user])

  const changeSection = useCallback((nextSection: WorkspaceSection) => {
    setSection(nextSection)
    navigate(sectionPaths[nextSection])
    setBreadcrumbs([])
    setInitialClientId(null)
    setReturnSection(null)
  }, [])

  const openClient = useCallback((id: number) => {
    setReturnSection(section)
    setInitialClientId(id)
    setBreadcrumbs([])
    setSection('Clientes')
  }, [section])

  const returnToPreviousSection = useCallback(() => {
    if (!returnSection) return
    setSection(returnSection)
    setInitialClientId(null)
    setReturnSection(null)
    setBreadcrumbs([])
  }, [returnSection])

  const updateBreadcrumbs = useCallback((items: string[]) => {
    setBreadcrumbs(items)
  }, [])

  const updateClientCount = useCallback((count: number) => {
    setClientCount(count)
  }, [])

  function logout() {
    const logoutRequest = api.logout()
    setUser(null)
    setSection('Clientes')
    setBreadcrumbs([])
    navigate(`${APP_PREFIX}/login`, true)
    void logoutRequest.catch(() => undefined)
  }

  if (!sessionReady) {
    return <main className="grid min-h-screen place-items-center bg-canvas" aria-label="Cargando sesión">Cargando…</main>
  }

  if (!user) {
    return <LoginPage onLogin={setUser} />
  }

  return (
    <AppShell
      breadcrumbs={breadcrumbs}
      clientCount={clientCount}
      onLogout={() => void logout()}
      onSectionChange={changeSection}
      section={section}
      user={user}
    >
      {section === 'Clientes' && (
        <ClientsPage
          initialClientId={initialClientId}
          onBackFromClient={returnSection ? returnToPreviousSection : undefined}
          onBreadcrumbChange={updateBreadcrumbs}
          onClientCountChange={updateClientCount}
          onInitialClientOpened={() => setInitialClientId(null)}
        />
      )}
      {section === 'Deudas' && <DebtsPage onOpenClient={openClient} />}
      {section === 'Recordatorios' && <RemindersPage />}
      {section === 'Vacunas' && <VaccinesPage isAdmin={user.role === 'admin'} />}
      {section === 'Usuarios' && user.role === 'admin' && <UsersPage currentUserId={user.id} />}
      {section === 'Configuración' && <SettingsPage user={user} onUserUpdate={setUser} />}
    </AppShell>
  )
}
