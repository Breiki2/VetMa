import type { ButtonHTMLAttributes, HTMLAttributes, ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Plus, X } from 'lucide-react'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'icon'
}

const buttonStyles = {
  primary:
    'border border-brand-900 bg-brand-900 text-white shadow-sm hover:bg-brand-800 disabled:cursor-wait disabled:opacity-60',
  secondary: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
  icon: 'text-slate-500 hover:bg-slate-100',
}

export function Button({ variant = 'secondary', className = '', ...props }: ButtonProps) {
  const base =
    variant === 'icon'
      ? 'grid size-[34px] place-items-center rounded-lg transition-colors'
      : 'inline-flex h-[39px] items-center justify-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-colors'

  return <button className={`${base} ${buttonStyles[variant]} ${className}`} {...props} />
}

export function IconButton({
  label,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return (
    <Button
      variant="icon"
      aria-label={label}
      className={className}
      type="button"
      {...props}
    >
      {children}
    </Button>
  )
}

export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="mb-7 mt-1 flex items-end justify-between gap-4 max-[650px]:items-start">
      <div>
        <p className="mb-1.5 text-[10px] font-bold tracking-[1.3px] text-slate-500">{eyebrow}</p>
        <h1 className="font-display text-[29px] font-bold tracking-tight text-slate-800 max-[650px]:text-2xl">
          {title}
        </h1>
        {description && <p className="mt-1.5 text-xs text-muted">{description}</p>}
      </div>
      {action}
    </div>
  )
}

export function Panel({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <section
      className={`mb-4 rounded-xl border border-line bg-white shadow-sm ${className}`}
      {...props}
    >
      {children}
    </section>
  )
}

export function PanelHeading({ title, description, action }: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-100 px-[18px] py-4">
      <div>
        <h2 className="font-display text-sm font-bold text-slate-700">{title}</h2>
        {description && <p className="mt-1 text-[10px] text-muted">{description}</p>}
      </div>
      {action}
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
  icon: LucideIcon
  title: string
  description: string
  action?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center px-5 py-11 text-center">
      <div className="mb-3 grid size-[42px] place-items-center rounded-xl bg-emerald-50 text-brand-700">
        <Icon size={22} />
      </div>
      <strong className="font-display text-sm font-bold text-slate-700">{title}</strong>
      <p className="mb-4 mt-1.5 text-[11px] text-muted">{description}</p>
      {action && onAction && (
        <Button variant="secondary" onClick={onAction}>
          <Plus size={16} />
          {action}
        </Button>
      )}
    </div>
  )
}

export function Modal({
  eyebrow,
  title,
  onClose,
  children,
}: {
  eyebrow: string
  title: string
  onClose: () => void
  children: ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#14251f]/80 p-[18px]"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <section
        aria-labelledby="modal-title"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-[520px] overflow-auto rounded-xl bg-white p-6 shadow-2xl max-[650px]:p-[18px]"
        role="dialog"
      >
        <header className="mb-4 flex items-start justify-between border-b border-slate-100 pb-4">
          <div>
            <p className="mb-1.5 text-[10px] font-bold tracking-[1.3px] text-slate-500">{eyebrow}</p>
            <h2 id="modal-title" className="font-display text-xl font-bold text-slate-800">
              {title}
            </h2>
          </div>
          <IconButton label="Cerrar" onClick={onClose}>
            <X size={19} />
          </IconButton>
        </header>
        {children}
      </section>
    </div>
  )
}

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="fixed right-6 top-[77px] z-40 flex max-w-[380px] items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-[11px] text-red-900 shadow-lg"
      role="alert"
    >
      {message}
      <IconButton label="Cerrar mensaje" onClick={onDismiss}>
        <X size={16} />
      </IconButton>
    </div>
  )
}

export function FormField({
  label,
  optional = false,
  children,
}: {
  label: string
  optional?: boolean
  children: ReactNode
}) {
  return (
    <label className="grid gap-1.5 text-[11px] font-semibold text-slate-600">
      <span>
        {label}
        {optional && <span className="ml-1 font-normal text-slate-400">opcional</span>}
      </span>
      {children}
    </label>
  )
}

export const inputStyles =
  'h-[38px] w-full rounded-md border border-slate-200 bg-white px-2.5 text-xs text-slate-800 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-100'

export const formStyles = 'grid gap-3'

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="mt-1.5 flex justify-end gap-2">{children}</div>
}
