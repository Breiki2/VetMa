import {
  CalendarClock,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  Settings2,
  Syringe,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { SessionUser, WorkspaceSection } from '../shared/types'
import { ThemeToggle } from '../shared/theme'
import { Menu, MenuItem } from '../shared/ui'

const navigation: { section: WorkspaceSection; icon: typeof UserRound }[] = [
  { section: 'Clientes', icon: UserRound },
  { section: 'Deudas', icon: CircleDollarSign },
  { section: 'Recordatorios', icon: CalendarClock },
  { section: 'Vacunas', icon: Syringe },
  { section: 'Usuarios', icon: UserRound },
  { section: 'Configuración', icon: Settings2 },
]

const mobileSecondary: WorkspaceSection[] = ['Usuarios', 'Configuración']

export function AppShell({
  user,
  section,
  breadcrumbs,
  clientCount,
  onSectionChange,
  onLogout,
  children,
}: {
  user: SessionUser
  section: WorkspaceSection
  breadcrumbs: string[]
  clientCount: number
  onSectionChange: (section: WorkspaceSection) => void
  onLogout: () => void
  children: ReactNode
}) {
  const visibleNavigation = navigation.filter(
    ({ section: item }) => item !== 'Usuarios' || user.role === 'admin',
  )

  return (
    <div className="min-h-screen bg-ground">
      <aside className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-border bg-ground px-1 pb-[env(safe-area-inset-bottom)] lg:inset-y-0 lg:right-auto lg:bottom-auto lg:left-0 lg:h-auto lg:w-[228px] lg:flex-col lg:border-t-0 lg:px-4 lg:pb-4 lg:pt-5">
        <div className="hidden items-center gap-2.5 px-1 lg:flex">
          <span className="grid size-8 place-items-center rounded-[9px] bg-accent-soft text-sm font-semibold text-accent-ink">
            V
          </span>
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-text">vetma</span>
        </div>

        <nav className="flex flex-1 items-stretch gap-0.5 lg:mt-7 lg:grid lg:flex-none lg:auto-rows-[40px] lg:gap-0.5">
          {visibleNavigation.map(({ section: item, icon: Icon }) => {
            const active = section === item
            return (
              <button
                key={item}
                aria-label={item}
                aria-current={active ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 rounded-none px-1 text-[11px] transition-colors lg:h-10 lg:flex-row lg:justify-start lg:gap-2.5 lg:rounded-control lg:px-2.5 lg:text-[13px] ${
                  mobileSecondary.includes(item) ? 'max-lg:hidden' : ''
                } ${
                  active
                    ? 'text-accent-ink lg:bg-accent-soft'
                    : 'text-muted hover:text-text lg:hover:bg-raised'
                }`}
                onClick={() => onSectionChange(item)}
                type="button"
              >
                <Icon size={20} strokeWidth={active ? 2 : 1.7} className="lg:size-[18px]" />
                <span className="max-w-full truncate">{item}</span>
                {item === 'Clientes' && clientCount > 0 && (
                  <span
                    aria-hidden="true"
                    className={`ml-auto hidden min-w-6 rounded-full px-1.5 py-0.5 text-center text-[11px] tabular-nums lg:block ${
                      active ? 'bg-surface text-accent-ink' : 'bg-raised text-muted'
                    }`}
                  >
                    {clientCount}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

      </aside>

      <div className="lg:pl-[228px]">
        <header className="sticky top-0 z-20 flex h-[52px] items-center justify-between gap-3 bg-ground px-4 lg:h-12 lg:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="grid size-7 place-items-center rounded-[8px] bg-accent-soft text-xs font-semibold text-accent-ink">
                V
              </span>
              <span className="text-[15px] font-semibold tracking-[-0.02em] text-text">vetma</span>
            </div>
            <div className="hidden min-w-0 items-center gap-1.5 text-[13px] text-muted lg:flex">
              <span>VetMa</span>
              <ChevronRight className="shrink-0 text-faint" size={14} />
              <span className="truncate font-medium text-text">{breadcrumbs[0] ?? section}</span>
              {breadcrumbs.slice(1).map((crumb) => (
                <span className="contents" key={crumb}>
                  <ChevronRight className="shrink-0 text-faint" size={14} />
                  <span className="truncate font-medium text-text">{crumb}</span>
                </span>
              ))}
            </div>
          </div>

          <Menu
            label={`Cuenta de ${user.name}`}
            trigger={
              <>
                <span className="grid size-8 place-items-center rounded-full bg-accent-soft text-xs font-semibold text-accent-ink">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
                <span className="hidden max-w-[160px] truncate text-[13px] font-medium text-text sm:block">
                  {user.name}
                </span>
                <ChevronDown className="hidden text-muted sm:block" size={15} />
              </>
            }
          >
            <div className="border-b border-rule px-2.5 pb-2 pt-1.5">
              <p className="truncate text-[13px] font-medium text-text">{user.name}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <div className="mt-1 grid">
              <ThemeToggle variant="menu" />
              <MenuItem onSelect={() => onSectionChange('Configuración')}>Configuración</MenuItem>
              {user.role === 'admin' && (
                <MenuItem onSelect={() => onSectionChange('Usuarios')}>Usuarios</MenuItem>
              )}
              <MenuItem danger onSelect={onLogout}>
                <LogOut size={15} /> Cerrar sesión
              </MenuItem>
            </div>
          </Menu>
        </header>

        <main className="pb-20 lg:pr-2 lg:pb-2">
          <div className="min-h-[calc(100dvh-52px)] bg-surface px-4 py-5 lg:min-h-[calc(100dvh-56px)] lg:rounded-sheet lg:border lg:border-border lg:px-8 lg:py-7">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
