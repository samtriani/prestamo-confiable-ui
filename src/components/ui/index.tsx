// ── Badge ─────────────────────────────────────────────────────────
import { getEstado } from '@/utils/estadoPago'
import type { EstadoPago } from '@/types'
import { cn } from '@/utils/cn'

export function Badge({ estado }: { estado: EstadoPago }) {
  const cfg = getEstado(estado)
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
      cfg.color, cfg.text, cfg.border
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  )
}

// ── Button ────────────────────────────────────────────────────────
import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?:    'sm' | 'md' | 'lg'
  loading?: boolean
}

const variantClass = {
  primary:   'bg-green-600 hover:bg-green-500 text-white border-transparent',
  secondary: 'bg-navy-700 hover:bg-navy-600 text-slate-200 border-white/10',
  ghost:     'bg-transparent hover:bg-navy-700 text-slate-400 hover:text-slate-200 border-transparent',
  danger:    'bg-red-500/15 hover:bg-red-500/25 text-red-400 border-red-500/30',
}

const sizeClass = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-4 py-2   text-sm rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm rounded-xl gap-2',
}

export function Button({
  variant = 'secondary', size = 'md', loading, children, className, disabled, ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium border transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClass[variant], sizeClass[size], className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  )
}

// ── Input ─────────────────────────────────────────────────────────
import { forwardRef, useState, useEffect, useRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { CalendarDays } from 'lucide-react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, className, ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={cn('ec-input', error && 'border-red-500/60 focus:border-red-500', className)}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
      </div>
    )
  }
)

// ── DateInput ─────────────────────────────────────────────────────
// Acepta y muestra en dd/mm/aaaa; almacena/emite en yyyy-mm-dd

function isoToDisplay(iso: string): string {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

function buildDisplay(digits: string): string {
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

function digitsToISO(digits: string): string {
  return `${digits.slice(4)}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`
}

interface DateInputProps {
  label?:    string
  error?:    string
  hint?:     string
  value?:    string          // yyyy-mm-dd
  onChange?: (iso: string) => void
  disabled?: boolean
  className?: string
}

export function DateInput({ label, error, hint, value = '', onChange, disabled, className }: DateInputProps) {
  const [display, setDisplay] = useState(() => isoToDisplay(value))
  const pickerRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setDisplay(isoToDisplay(value))
  }, [value])

  function handleTextChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 8)
    setDisplay(buildDisplay(digits))
    onChange?.(digits.length === 8 ? digitsToISO(digits) : '')
  }

  function handlePickerChange(e: React.ChangeEvent<HTMLInputElement>) {
    const iso = e.target.value  // yyyy-mm-dd
    setDisplay(isoToDisplay(iso))
    onChange?.(iso)
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="text"
          inputMode="numeric"
          className={cn('ec-input pr-9', error && 'border-red-500/60 focus:border-red-500', className)}
          placeholder="dd/mm/aaaa"
          value={display}
          onChange={handleTextChange}
          maxLength={10}
          disabled={disabled}
        />
        {/* Ícono que dispara el picker nativo */}
        <button
          type="button"
          tabIndex={-1}
          disabled={disabled}
          onClick={() => pickerRef.current?.showPicker()}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-30"
        >
          <CalendarDays size={14} />
        </button>
        {/* Date picker nativo invisible, solo para el calendario */}
        <input
          ref={pickerRef}
          type="date"
          value={value}
          onChange={handlePickerChange}
          disabled={disabled}
          tabIndex={-1}
          className="absolute inset-0 opacity-0 pointer-events-none"
        />
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-500">{hint}</p>}
    </div>
  )
}

// ── Select ────────────────────────────────────────────────────────
import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export function Select({ label, error, className, children, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
          {label}
        </label>
      )}
      <select
        className={cn(
          'ec-input appearance-none cursor-pointer',
          error && 'border-red-500/60',
          className
        )}
        {...props}
      >
        {children}
      </select>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────
interface StatCardProps {
  label:     string
  value:     string | number
  sub?:      string
  accent?:   'green' | 'red' | 'orange' | 'blue' | 'default'
  delay?:    number
}

const accentText = {
  green:   'text-green-400',
  red:     'text-red-400',
  orange:  'text-orange-400',
  blue:    'text-blue-400',
  default: 'text-slate-100',
}

export function StatCard({ label, value, sub, accent = 'default', delay = 0 }: StatCardProps) {
  return (
    <div
      className="ec-card p-5 animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">{label}</p>
      <p className={cn('text-2xl font-display font-bold', accentText[accent])}>{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
  )
}

// ── PagoGrid ──────────────────────────────────────────────────────
import { estadoConfig } from '@/utils/estadoPago'
import type { Pago } from '@/types'
import { fmt } from '@/utils/format'

interface PagoGridProps {
  pagos:      Pago[]
  size?:      'sm' | 'md'
  onPagoClick?: (pago: Pago) => void
}

export function PagoGrid({ pagos, size = 'md', onPagoClick }: PagoGridProps) {
  const dim = size === 'sm' ? 'w-7 h-7 text-[9px]' : 'w-9 h-9 text-[10px]'

  return (
    <div className="flex gap-1.5 flex-wrap">
      {pagos.map(pago => {
        const cfg = estadoConfig[pago.estado]
        const isPagable = ['PROXIMO', 'ATRASADO', 'PENDIENTE'].includes(pago.estado)
        return (
          <button
            key={pago.id}
            title={`Pago ${pago.numeroPago} · ${cfg.label} · ${fmt.date(pago.fechaProgramada)}${pago.totalAbonado ? ` · Abonado: ${fmt.money(pago.totalAbonado)}` : ''}`}
            onClick={() => isPagable && onPagoClick?.(pago)}
            className={cn(
              dim,
              'rounded-md flex items-center justify-center font-mono font-medium',
              'transition-all duration-150',
              isPagable && onPagoClick ? 'cursor-pointer hover:scale-110 hover:brightness-125' : 'cursor-default',
            )}
            style={{ backgroundColor: cfg.hex + '33', color: cfg.hex, border: `1px solid ${cfg.hex}55` }}
          >
            {pago.numeroPago}
          </button>
        )
      })}
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

interface ModalProps {
  open:      boolean
  onClose:   () => void
  title:     string
  children:  ReactNode
  size?:     'sm' | 'md' | 'lg'
}

const modalSize = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' }

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  if (!open) return null
  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      style={{ background: 'rgba(6,11,20,0.85)' }}
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          className={cn('w-full ec-card animate-fade-up', modalSize[size])}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="font-display font-bold text-base text-slate-100">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-navy-700 text-slate-400 hover:text-slate-200 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="p-6">{children}</div>
        </div>
      </div>
    </div>,
    document.body
  )
}
