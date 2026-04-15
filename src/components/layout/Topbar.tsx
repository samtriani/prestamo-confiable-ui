import { useNavigate, useLocation } from 'react-router-dom'
import { Plus, Bell, LogOut, ShieldCheck, User, Menu } from 'lucide-react'
import { Button } from '@/components/ui'
import { useDashboard } from '@/hooks'
import { useAuth } from '@/context/AuthContext'

const PAGE_TITLES: Record<string, string> = {
  '/':          'Dashboard',
  '/clientes':  'Clientes',
  '/control':   'Control de pagos',
  '/cortes':    'Historial de cortes',
  '/alta':      'Alta de cliente',
  '/cobranza':  'Cobranza semanal',
  '/usuarios':  'Usuarios',
}

interface TopbarProps {
  onMenuClick: () => void
}

export function Topbar({ onMenuClick }: TopbarProps) {
  const navigate        = useNavigate()
  const location        = useLocation()
  const { data }        = useDashboard()
  const { user, logout, isAdmin } = useAuth()

  const title = Object.entries(PAGE_TITLES)
    .find(([path]) => path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path)
    )?.[1] ?? 'Empeña Confiable'

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-4 md:px-6 border-b border-white/5 bg-navy-950/60 backdrop-blur-sm sticky top-0 z-20">
      <div className="flex items-center gap-3">
        {/* Hamburger — solo mobile */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-navy-800 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={18} />
        </button>
        <h1 className="font-display font-bold text-base text-slate-100">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Alertas atrasados */}
        {data && data.pagosAtrasados > 0 && (
          <div className="flex items-center gap-1.5 px-2 md:px-2.5 py-1 rounded-lg bg-red-500/15 border border-red-500/30">
            <Bell size={12} className="text-red-400" />
            <span className="text-xs font-medium text-red-400 hidden sm:inline">
              {data.pagosAtrasados} atrasado{data.pagosAtrasados !== 1 ? 's' : ''}
            </span>
            <span className="text-xs font-medium text-red-400 sm:hidden">
              {data.pagosAtrasados}
            </span>
          </div>
        )}

        {/* Nuevo cliente — icono en mobile, texto en desktop */}
        <Button variant="primary" size="sm" onClick={() => navigate('/alta')}>
          <Plus size={14} />
          <span className="hidden sm:inline">Nuevo cliente</span>
        </Button>

        {/* Usuario */}
        <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-white/10">
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-400">
            {isAdmin
              ? <ShieldCheck size={13} className="text-green-400" />
              : <User size={13} className="text-slate-500" />
            }
            <span className="font-medium text-slate-300">{user?.nombre}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
              isAdmin
                ? 'bg-green-600/20 text-green-400'
                : 'bg-navy-700 text-slate-500'
            }`}>
              {user?.rol}
            </span>
          </div>
          {/* En mobile solo el ícono de usuario */}
          <div className="md:hidden">
            {isAdmin
              ? <ShieldCheck size={15} className="text-green-400" />
              : <User size={15} className="text-slate-500" />
            }
          </div>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </header>
  )
}
