import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import type { LucideIcon } from 'lucide-react'
import { MoreHorizontal, X } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'border border-primary bg-primary text-on-primary hover:opacity-90',
  secondary: 'border border-control bg-surface text-text hover:bg-raised',
  ghost: 'border border-transparent text-muted hover:bg-raised hover:text-text',
  danger: 'border border-transparent text-danger hover:bg-danger-bg',
}

export function Button({
  variant = 'secondary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  const base =
    'inline-flex h-11 items-center justify-center gap-2 rounded-control px-4 text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-60 lg:h-9 lg:px-3.5 lg:text-[13px]'
  return <button className={`${base} ${buttonVariants[variant]} ${className}`} {...props} />
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <button
      aria-label={label}
      className={`grid size-11 shrink-0 place-items-center rounded-control text-muted transition-colors hover:bg-raised hover:text-text lg:size-9 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  )
}

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 lg:mb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
      <div className="min-w-0">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.02em] text-text lg:text-2xl">
          {title}
        </h1>
        {description && <p className="mt-1 text-[13px] text-muted">{description}</p>}
      </div>
      {action && <div className="flex flex-wrap items-center gap-2 max-sm:w-full">{action}</div>}
    </div>
  )
}

export function Panel({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section className={`rounded-card border border-border bg-surface ${className}`} {...props}>
      {children}
    </section>
  )
}

export function PanelHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-4 py-3.5 lg:px-5">
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-text">{title}</h2>
        {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function StatStrip({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`grid divide-y divide-border overflow-hidden rounded-card border border-border bg-surface sm:grid-cols-3 sm:divide-x sm:divide-y-0 ${className}`}
    >
      {children}
    </div>
  )
}

export function Stat({
  label,
  value,
  note,
  tone = 'default',
}: {
  label: string
  value: string
  note?: string
  tone?: 'default' | 'danger'
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 sm:block sm:px-5 sm:py-4">
      <span className="text-[13px] text-muted">{label}</span>
      <span
        className={`block text-[17px] font-medium tabular-nums sm:mt-1 sm:text-[24px] sm:font-normal lg:text-[26px] ${
          tone === 'danger' ? 'text-danger' : 'text-text'
        }`}
      >
        {value}
      </span>
      {note && <span className="mt-1 hidden text-xs text-muted sm:block">{note}</span>}
    </div>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  onAction,
}: {
  icon?: LucideIcon
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center px-5 py-12 text-center">
      {Icon && <Icon className="mb-3 text-faint" size={26} strokeWidth={1.6} />}
      <strong className="text-sm font-semibold text-text">{title}</strong>
      <p className="mt-1 max-w-[360px] text-[13px] text-muted">{description}</p>
      {action && onAction && (
        <Button className="mt-4" onClick={onAction} variant="secondary">
          {action}
        </Button>
      )}
    </div>
  )
}

export function Badge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'neutral' | 'positive' | 'danger' | 'accent'
}) {
  const tones = {
    neutral: 'bg-raised text-muted',
    positive: 'bg-positive-bg text-positive',
    danger: 'bg-danger-bg text-danger',
    accent: 'bg-accent-soft text-accent-ink',
  }
  return (
    <span
      className={`inline-flex h-6 flex-none items-center whitespace-nowrap rounded-full px-2 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  )
}

export function Modal({
  title,
  description,
  onClose,
  children,
}: {
  title: string
  description?: string
  onClose: () => void
  children: ReactNode
}) {
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const timer = window.setTimeout(() => {
      const first = panelRef.current?.querySelector<HTMLElement>(
        'input:not([type="hidden"]):not([disabled]), select, textarea, button',
      )
      first?.focus()
    }, 40)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = [
        ...panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ].filter((item) => item.offsetParent !== null)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = overflow
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-[#0d1712]/55 lg:items-center lg:p-6"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <div
        aria-labelledby={titleId}
        aria-modal="true"
        className="flex h-[100dvh] w-full flex-col bg-surface lg:h-auto lg:max-h-[90vh] lg:max-w-[560px] lg:rounded-2xl lg:shadow-2xl"
        ref={panelRef}
        role="dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-rule px-4 py-3.5 lg:px-6 lg:py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-text" id={titleId}>
              {title}
            </h2>
            {description && <p className="mt-0.5 text-[13px] text-muted">{description}</p>}
          </div>
          <IconButton label="Cerrar" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 lg:px-6">{children}</div>
      </div>
    </div>
  )
}

export function Toast({
  message,
  tone = 'neutral',
  onDismiss,
}: {
  message: string
  tone?: 'neutral' | 'error' | 'success'
  onDismiss: () => void
}) {
  const tones = {
    neutral: 'border-border text-text',
    error: 'border-danger/30 text-danger',
    success: 'border-positive/30 text-positive',
  }
  return (
    <div
      className={`fixed left-1/2 top-3 z-[60] flex max-w-[min(92vw,420px)] -translate-x-1/2 items-center gap-2 rounded-card border bg-surface px-3 py-2 text-[13px] shadow-lg lg:left-auto lg:right-6 lg:top-[68px] lg:translate-x-0 ${tones[tone]}`}
      role="status"
    >
      <span className="min-w-0 flex-1">{message}</span>
      <IconButton label="Cerrar mensaje" onClick={onDismiss}>
        <X size={16} />
      </IconButton>
    </div>
  )
}

export function FormField({
  label,
  hint,
  hintId,
  optional = false,
  children,
}: {
  label: string
  hint?: string
  hintId?: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <div className="grid gap-1.5">
      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-text">
          {label}
          {optional && <span className="ml-1 font-normal text-muted">(opcional)</span>}
        </span>
        {children}
      </label>
      {hint && (
        <span className="text-xs text-muted" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  )
}

export const inputStyles =
  'h-10 w-full rounded-control border border-control bg-surface px-3 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-track'

export const textareaStyles =
  'min-h-20 w-full rounded-control border border-control bg-surface px-3 py-2 text-sm text-text outline-none transition-colors focus:border-accent focus:ring-2 focus:ring-accent-track'

export const formStyles = 'grid gap-4'

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="mt-1 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">{children}</div>
}

export function Switch({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: () => void
}) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-3 text-sm text-text">
      <input checked={checked} className="peer sr-only" onChange={onChange} type="checkbox" />
      <span className="relative h-5 w-9 shrink-0 rounded-full bg-control transition-colors after:absolute after:left-0.5 after:top-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-4 peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent" />
      <span>{label}</span>
    </label>
  )
}

const MenuContext = createContext<() => void>(() => {})

export function Menu({
  label,
  trigger,
  children,
  align = 'right',
  className = '',
}: {
  label: string
  trigger?: ReactNode
  children: ReactNode
  align?: 'left' | 'right'
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className={
          trigger
            ? 'flex h-11 items-center gap-2 rounded-control px-1.5 text-left transition-colors hover:bg-raised lg:h-9'
            : 'grid size-11 place-items-center rounded-control text-muted transition-colors hover:bg-raised hover:text-text lg:size-9'
        }
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {trigger ?? <MoreHorizontal size={18} />}
      </button>
      {open && (
        <MenuContext.Provider value={() => setOpen(false)}>
          <div
            className={`absolute z-40 mt-1 min-w-[190px] rounded-card border border-border bg-surface p-1 shadow-lg ${
              align === 'right' ? 'right-0' : 'left-0'
            }`}
            role="menu"
          >
            {children}
          </div>
        </MenuContext.Provider>
      )}
    </div>
  )
}

export function MenuItem({
  children,
  onSelect,
  danger = false,
}: {
  children: ReactNode
  onSelect: () => void
  danger?: boolean
}) {
  const close = useContext(MenuContext)
  return (
    <button
      className={`flex w-full items-center gap-2 rounded-[4px] px-2.5 py-2 text-left text-[13px] transition-colors ${
        danger ? 'text-danger hover:bg-danger-bg' : 'text-text hover:bg-raised'
      }`}
      onClick={() => {
        close()
        onSelect()
      }}
      role="menuitem"
      type="button"
    >
      {children}
    </button>
  )
}
