import {
  Bell,
  CalendarClock,
  ChevronRight,
  CircleDollarSign,
  LogOut,
  Settings2,
  Syringe,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import type { SessionUser, WorkspaceSection } from '../shared/types'
import { IconButton } from '../shared/ui'

const navigation: { section: WorkspaceSection; icon: typeof UserRound }[] = [
  { section: 'Clientes', icon: UserRound },
  { section: 'Deudas', icon: CircleDollarSign },
  { section: 'Recordatorios', icon: CalendarClock },
  { section: 'Vacunas', icon: Syringe },
  { section: 'Usuarios', icon: UserRound },
  { section: 'Configuración', icon: Settings2 },
]

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
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col bg-brand-950 px-[17px] pb-4 pt-[27px] text-emerald-50 max-[900px]:w-[210px] max-[650px]:inset-x-0 max-[650px]:bottom-0 max-[650px]:top-auto max-[650px]:h-[58px] max-[650px]:w-auto max-[650px]:p-1.5">
        <div className="flex items-center gap-3 px-2 pb-10 max-[650px]:hidden">
          <div className="grid size-[37px] place-items-center rounded-xl bg-brand-200 font-display text-xl font-extrabold text-brand-950">
            V
          </div>
          <div>
            <strong className="block font-display text-[22px] font-extrabold tracking-tight text-white">
              vetma
            </strong>
            <small className="mt-px block text-[10px] text-emerald-100/60">gestión veterinaria</small>
          </div>
        </div>

        <p className="mb-2.5 px-3 text-[10px] font-bold tracking-widest text-emerald-100/60 max-[650px]:hidden">
          ESPACIO DE TRABAJO
        </p>
        <nav className="grid gap-1 max-[650px]:flex max-[650px]:h-12 max-[650px]:justify-around">
          {visibleNavigation.map(({ section: item, icon: Icon }) => (
            <button
              key={item}
              className={`flex h-[43px] items-center gap-3 rounded-lg px-3 text-left text-xs font-medium transition-colors max-[650px]:h-[45px] max-[650px]:justify-center max-[650px]:px-3 ${
                section === item
                  ? 'bg-brand-800 text-white shadow-[inset_3px_0_0_#c8dfaa]'
                  : 'text-emerald-50/80 hover:bg-brand-800 hover:text-white'
              }`}
              onClick={() => onSectionChange(item)}
              type="button"
            >
              <Icon size={18} />
              <span className="max-[650px]:sr-only">{item}</span>
              {item === 'Clientes' && (
                <span className="ml-auto rounded-full bg-brand-800 px-2 py-0.5 text-[11px] max-[650px]:hidden">
                  {clientCount}
                </span>
              )}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex items-center gap-2 border-t border-emerald-50/15 px-2.5 pt-4 text-[11px] text-emerald-50/70 max-[650px]:hidden">
          <span className="size-[7px] rounded-full bg-lime-300" />
          Sistema operativo
        </div>
      </aside>

      <main className="ml-[248px] min-h-screen max-[900px]:ml-[210px] max-[650px]:ml-0 max-[650px]:pb-[58px]">
        <header className="sticky top-0 z-20 flex h-[65px] items-center justify-between border-b border-slate-100 bg-white px-[38px] max-[900px]:px-6 max-[650px]:h-14 max-[650px]:px-4">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>VetMa</span>
            <ChevronRight size={15} />
            <strong className="font-semibold text-slate-700">{breadcrumbs[0] ?? section}</strong>
            {breadcrumbs.slice(1).map((crumb) => (
              <span className="contents" key={crumb}>
                <ChevronRight size={15} />
                <strong className="font-semibold text-slate-700">{crumb}</strong>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-6 max-[650px]:gap-2">
            <div className="relative">
              <IconButton label="Notificaciones">
                <Bell size={19} />
              </IconButton>
              <span className="absolute right-[7px] top-1.5 size-1.5 rounded-full border border-white bg-orange-400" />
            </div>
            <div className="flex items-center gap-2 border-l border-slate-100 pl-5 text-xs font-semibold max-[650px]:pl-2.5">
              <div className="grid size-[31px] place-items-center rounded-full bg-emerald-50 text-[11px] font-bold text-brand-700">
                {user.name.slice(0, 1).toUpperCase()}
              </div>
              <span className="max-[650px]:hidden">{user.name}</span>
              <IconButton label="Cerrar sesión" onClick={onLogout}>
                <LogOut size={16} />
              </IconButton>
            </div>
          </div>
        </header>

        <section className="mx-auto max-w-[1220px] px-10 pb-[70px] pt-[37px] max-[900px]:px-6 max-[650px]:px-[15px] max-[650px]:pb-11 max-[650px]:pt-6">
          {children}
        </section>
      </main>
    </div>
  )
}
