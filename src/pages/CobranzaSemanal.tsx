import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertCircle, CheckCircle2, Clock, Phone,
  ChevronRight, Search, Banknote, X,
} from 'lucide-react'
import { useCobranza, useRegistrarAbonoCobranza } from '@/hooks'
import { fmt } from '@/utils/format'
import type { CobranzaItem } from '@/types'

export default function CobranzaSemanal() {
  const { data: items = [], isLoading } = useCobranza()
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal]       = useState<CobranzaItem | null>(null)

  const filtrados = useMemo(() => {
    const q = busqueda.toLowerCase()
    return q
      ? items.filter(i =>
          i.clienteNombre.toLowerCase().includes(q) ||
          i.clienteNumero.toLowerCase().includes(q) ||
          (i.clienteTelefono ?? '').includes(q)
        )
      : items
  }, [items, busqueda])

  const atrasados = filtrados.filter(i => i.estado === 'ATRASADO')
  const proximos  = filtrados.filter(i => i.estado === 'PROXIMO')

  const totalPorCobrar = items.reduce((s, i) => s + i.montoProgramado, 0)

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <div>
        <h1 className="font-display font-bold text-xl text-slate-100">Cobranza semanal</h1>
        <p className="text-sm text-slate-500 mt-0.5">Pagos pendientes y vencidos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard
          label="Por cobrar"
          value={fmt.money(totalPorCobrar)}
          sub={`${items.length} pago${items.length !== 1 ? 's' : ''}`}
          color="text-slate-200"
        />
        <StatCard
          label="Vencidos"
          value={String(atrasados.length)}
          sub={atrasados.length > 0 ? 'requieren atención' : 'al corriente'}
          color={atrasados.length > 0 ? 'text-red-400' : 'text-green-400'}
          icon={atrasados.length > 0
            ? <AlertCircle size={16} className="text-red-400" />
            : <CheckCircle2 size={16} className="text-green-400" />}
        />
        <StatCard
          label="Por cobrar hoy"
          value={String(proximos.length)}
          sub={`${fmt.money(proximos.reduce((s, i) => s + i.montoProgramado, 0))}`}
          color="text-blue-400"
          icon={<Clock size={16} className="text-blue-400" />}
        />
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
        <input
          className="ec-input pl-9 w-full"
          placeholder="Buscar por nombre, número o teléfono…"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
        />
      </div>

      {isLoading && (
        <div className="ec-card p-10 text-center text-slate-500 text-sm">Cargando…</div>
      )}

      {!isLoading && items.length === 0 && (
        <div className="ec-card p-10 text-center space-y-2">
          <CheckCircle2 size={32} className="text-green-400 mx-auto" />
          <p className="text-slate-300 font-medium">Todo al corriente</p>
          <p className="text-slate-500 text-sm">No hay pagos pendientes ni vencidos.</p>
        </div>
      )}

      {/* Sección vencidos */}
      {atrasados.length > 0 && (
        <Section
          titulo="Vencidos"
          items={atrasados}
          color="red"
          onPagar={setModal}
        />
      )}

      {/* Sección próximos */}
      {proximos.length > 0 && (
        <Section
          titulo="Por cobrar"
          items={proximos}
          color="blue"
          onPagar={setModal}
        />
      )}

      {/* Modal registro de pago */}
      {modal && (
        <ModalPago item={modal} onClose={() => setModal(null)} />
      )}
    </div>
  )
}

// ── Sección agrupada ───────────────────────────────────────────────
function Section({
  titulo, items, color, onPagar,
}: {
  titulo: string
  items: CobranzaItem[]
  color: 'red' | 'blue'
  onPagar: (item: CobranzaItem) => void
}) {
  const colorMap = {
    red:  { badge: 'bg-red-500/15 text-red-400 border-red-500/20', dot: 'bg-red-400' },
    blue: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/20', dot: 'bg-blue-400' },
  }
  const c = colorMap[color]

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${c.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
          {titulo} · {items.length}
        </span>
      </div>

      <div className="ec-card overflow-hidden divide-y divide-white/5">
        {items.map(item => (
          <ItemRow key={item.pagoId} item={item} color={color} onPagar={onPagar} />
        ))}
      </div>
    </div>
  )
}

// ── Fila de ítem ───────────────────────────────────────────────────
function ItemRow({
  item, color, onPagar,
}: {
  item: CobranzaItem
  color: 'red' | 'blue'
  onPagar: (item: CobranzaItem) => void
}) {
  const accentColor = color === 'red' ? 'text-red-400' : 'text-blue-400'

  return (
    <div className="flex items-center gap-4 px-4 py-3 hover:bg-navy-800/40 transition-colors">

      {/* Avatar */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
        color === 'red' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-400'
      }`}>
        {item.clienteNombre.charAt(0)}
      </div>

      {/* Info cliente */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Link
            to={`/clientes/${item.clienteId}`}
            className="text-sm font-medium text-slate-200 hover:text-green-400 transition-colors truncate"
          >
            {item.clienteNombre}
          </Link>
          <span className="text-xs text-slate-600 font-mono shrink-0">{item.clienteNumero}</span>
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs text-slate-500 font-mono">{item.prestamoNumero}</span>
          <span className="text-xs text-slate-600">·</span>
          <span className="text-xs text-slate-500">Pago #{item.numeroPago}</span>
          {item.clienteTelefono && (
            <>
              <span className="text-xs text-slate-600">·</span>
              <a
                href={`tel:${item.clienteTelefono}`}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Phone size={10} />
                {item.clienteTelefono}
              </a>
            </>
          )}
        </div>
      </div>

      {/* Fecha y días vencido */}
      <div className="text-right shrink-0">
        <p className="text-xs text-slate-400">{fmt.date(item.fechaProgramada)}</p>
        {item.diasVencido > 0 && (
          <p className={`text-[11px] font-medium ${accentColor}`}>
            {item.diasVencido}d vencido
          </p>
        )}
      </div>

      {/* Monto */}
      <div className="text-right shrink-0 w-20">
        <p className="text-sm font-mono font-bold text-slate-200">
          {fmt.money(item.montoProgramado)}
        </p>
      </div>

      {/* Botón */}
      <button
        onClick={() => onPagar(item)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/15 text-green-400 border border-green-600/25 hover:bg-green-600/25 transition-colors shrink-0"
      >
        <Banknote size={12} />
        Registrar
        <ChevronRight size={10} />
      </button>
    </div>
  )
}

// ── Modal de pago ──────────────────────────────────────────────────
function ModalPago({ item, onClose }: { item: CobranzaItem; onClose: () => void }) {
  const registrar = useRegistrarAbonoCobranza()
  const [monto, setMonto] = useState(String(item.montoProgramado))

  function handleSubmit() {
    const m = parseFloat(monto)
    if (!m || m <= 0) return
    registrar.mutate(
      { pagoId: item.pagoId, montoAbono: m },
      { onSuccess: onClose }
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-sm ec-card p-6 space-y-5 animate-fade-up">

          {/* Header modal */}
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-mono">{item.prestamoNumero} · Pago #{item.numeroPago}</p>
              <p className="font-display font-bold text-slate-100 mt-0.5">{item.clienteNombre}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-navy-700 transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Info pago */}
          <div className="rounded-xl bg-navy-800 border border-white/5 p-4 flex justify-between">
            <div>
              <p className="text-xs text-slate-500">Fecha programada</p>
              <p className="text-sm font-medium text-slate-300 mt-0.5">{fmt.date(item.fechaProgramada)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500">Importe</p>
              <p className="text-sm font-mono font-bold text-slate-200 mt-0.5">{fmt.money(item.montoProgramado)}</p>
            </div>
          </div>

          {/* Input monto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Monto a registrar
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
              <input
                type="number"
                min="1"
                step="0.01"
                className="ec-input pl-7"
                value={monto}
                onChange={e => setMonto(e.target.value)}
                onFocus={e => e.target.select()}
                autoFocus
              />
            </div>
            {parseFloat(monto) < item.montoProgramado && parseFloat(monto) > 0 && (
              <p className="text-[11px] text-amber-400">
                Pago parcial — quedarán {fmt.money(item.montoProgramado - parseFloat(monto))} pendientes
              </p>
            )}
          </div>

          {/* Acciones */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 hover:bg-navy-700 border border-white/10 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={registrar.isPending || !parseFloat(monto) || parseFloat(monto) <= 0}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-green-600 text-white hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Banknote size={14} />
              {registrar.isPending ? 'Guardando…' : 'Confirmar pago'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Stat Card ──────────────────────────────────────────────────────
function StatCard({
  label, value, sub, color, icon,
}: {
  label: string
  value: string
  sub: string
  color: string
  icon?: React.ReactNode
}) {
  return (
    <div className="ec-card px-5 py-4">
      <div className="flex items-center justify-between mb-1">
        <p className="text-xs text-slate-500">{label}</p>
        {icon}
      </div>
      <p className={`text-2xl font-display font-bold ${color}`}>{value}</p>
      <p className="text-xs text-slate-600 mt-0.5">{sub}</p>
    </div>
  )
}
