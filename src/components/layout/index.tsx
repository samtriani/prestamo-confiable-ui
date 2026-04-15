import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard,
  Scissors, ChevronRight, ShieldCheck, Wallet, X,
} from 'lucide-react'
import { cn } from '@/utils/cn'
import { useTotalSemanal, useCobranza } from '@/hooks'
import { fmt } from '@/utils/format'
import { useAuth } from '@/context/AuthContext'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard'        },
  { to: '/clientes', icon: Users,           label: 'Clientes'         },
  { to: '/cobranza', icon: Wallet,          label: 'Cobranza'         },
  { to: '/control',  icon: CreditCard,      label: 'Control pagos'    },
  { to: '/cortes',   icon: Scissors,        label: 'Historial cortes' },
]

const NAV_ADMIN = [
  { to: '/usuarios', icon: ShieldCheck, label: 'Usuarios' },
]

interface SidebarProps {
  open: boolean
  onClose: () => void
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { data: semanal }  = useTotalSemanal()
  const { data: cobranza } = useCobranza()
  const { isAdmin }        = useAuth()
  const location = useLocation()

  const pendientes = cobranza?.length ?? 0
  const vencidos   = cobranza?.filter(i => i.estado === 'ATRASADO').length ?? 0

  return (
    <>
      {/* Backdrop (solo mobile) */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={cn(
        'fixed md:sticky top-0 left-0 z-50 md:z-auto',
        'w-64 md:w-56 shrink-0 flex flex-col bg-navy-950 border-r border-white/5 h-screen',
        'transition-transform duration-300 ease-in-out',
        // Mobile: slide in/out; Desktop: always visible
        open ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
      )}>
        {/* Logo + close button */}
        <div className="px-5 py-6 border-b border-white/5 flex items-start justify-between">
          <div>
            <p className="font-display font-bold text-base text-green-400 tracking-tight leading-none">
              Empeña
            </p>
            <p className="font-display font-bold text-base text-slate-300 tracking-tight leading-none">
              Confiable
            </p>
            <p className="text-[10px] text-slate-600 mt-1 font-mono">Sistema de Préstamos</p>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-navy-800 transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 flex flex-col gap-0.5 px-3 overflow-y-auto">
          {NAV.map(({ to, icon: Icon, label }) => {
            const active = to === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(to)
            const isCobranza = to === '/cobranza'
            return (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 group',
                  active
                    ? 'bg-green-600/15 text-green-400 font-medium'
                    : 'text-slate-500 hover:text-slate-200 hover:bg-navy-800'
                )}
              >
                <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                {label}
                {isCobranza && pendientes > 0 && !active && (
                  <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    vencidos > 0
                      ? 'bg-red-500/20 text-red-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {pendientes}
                  </span>
                )}
                {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
              </NavLink>
            )
          })}

          {/* Sección admin */}
          {isAdmin && (
            <>
              <div className="mx-3 my-2 border-t border-white/5" />
              {NAV_ADMIN.map(({ to, icon: Icon, label }) => {
                const active = location.pathname.startsWith(to)
                return (
                  <NavLink
                    key={to}
                    to={to}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150',
                      active
                        ? 'bg-green-600/15 text-green-400 font-medium'
                        : 'text-slate-500 hover:text-slate-200 hover:bg-navy-800'
                    )}
                  >
                    <Icon size={16} strokeWidth={active ? 2 : 1.5} />
                    {label}
                    {active && <ChevronRight size={12} className="ml-auto opacity-60" />}
                  </NavLink>
                )
              })}
            </>
          )}
        </nav>

        {/* Panel corte */}
        <div className="mx-3 mb-4 rounded-xl bg-navy-800 border border-white/5 p-4">
          <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold mb-1">
            Acumulado semanal
          </p>
          <p className="font-display font-bold text-xl text-green-400">
            {semanal ? fmt.money(semanal.totalSemanal) : '—'}
          </p>
          <p className="text-[10px] text-slate-600 mt-1">pendiente de corte</p>
        </div>
      </aside>
    </>
  )
}

// ── AppLayout ─────────────────────────────────────────────────────
import type { ReactNode } from 'react'
import { Topbar } from './Topbar'

export function AppLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenuClick={() => setSidebarOpen(o => !o)} />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
