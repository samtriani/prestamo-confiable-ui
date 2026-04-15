import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Filter, Search } from 'lucide-react'
import { usePrestamosActivos } from '@/hooks'
import { estadoConfig } from '@/utils/estadoPago'
import { fmt } from '@/utils/format'
import type { PrestamoResumen, EstadoPago } from '@/types'

type Filtro = 'TODOS' | 'ATRASADO' | 'PROXIMO' | 'PAGADO_SIN_CORTE'

export default function ControlPagos() {
  const navigate               = useNavigate()
  const { data = [], isLoading } = usePrestamosActivos()
  const [filtro, setFiltro]    = useState<Filtro>('TODOS')
  const [query, setQuery]      = useState('')

  const byQuery = data.filter((p: PrestamoResumen) =>
    p.clienteNombre?.toLowerCase().includes(query.toLowerCase()) ||
    p.clienteNumero?.toLowerCase().includes(query.toLowerCase()) ||
    (p.clienteTelefono ?? '').includes(query)
  )

  const filtered = byQuery.filter((p: PrestamoResumen) => {
    if (filtro === 'TODOS')             return true
    if (filtro === 'ATRASADO')          return (p.pagosAtrasados ?? 0) > 0
    if (filtro === 'PROXIMO')           return (p.pagosAtrasados ?? 0) === 0
    if (filtro === 'PAGADO_SIN_CORTE')  return (p.semanalSinCorte ?? 0) > 0
    return true
  })

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'TODOS',           label: `Todos (${byQuery.length})` },
    { key: 'ATRASADO',        label: `Atrasados (${byQuery.filter((p: PrestamoResumen) => (p.pagosAtrasados ?? 0) > 0).length})` },
    { key: 'PROXIMO',         label: `Al corriente (${byQuery.filter((p: PrestamoResumen) => (p.pagosAtrasados ?? 0) === 0).length})` },
    { key: 'PAGADO_SIN_CORTE',label: `Con abonos (${byQuery.filter((p: PrestamoResumen) => (p.semanalSinCorte ?? 0) > 0).length})` },
  ]

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Leyenda de colores */}
      <div className="flex items-center gap-6 ec-card px-5 py-3">
        <Filter size={13} className="text-slate-500 shrink-0" />
        {(['PAGADO', 'ATRASADO', 'PAGADO_SIN_CORTE', 'PROXIMO', 'PENDIENTE'] as EstadoPago[]).map(e => {
          const cfg = estadoConfig[e]
          return (
            <div key={e} className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-3 h-3 rounded" style={{ backgroundColor: cfg.hex }} />
              {cfg.label}
            </div>
          )
        })}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          className="ec-input pl-8 w-full"
          placeholder="Buscar por nombre, número o teléfono..."
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      {/* Filtros */}
      <div className="flex gap-2">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filtro === f.key
                ? 'bg-green-600/20 text-green-400 border-green-600/40'
                : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Tabla de control */}
      <div className="ec-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">
            {query ? `No se encontró "${query}"` : 'Sin resultados para este filtro'}
          </div>
        ) : (
          <table className="ec-table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Préstamo</th>
                <th>Pago sem.</th>
                <th>Progreso</th>
                <th>Sin corte</th>
                <th>Saldo</th>
                <th>Corrida de 14 pagos</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p: PrestamoResumen, i) => {
                const hasAtrasado = (p.pagosAtrasados ?? 0) > 0
                return (
                  <tr
                    key={p.id}
                    className="cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${i * 20}ms` }}
                    onClick={() => navigate(`/clientes/${p.clienteId}`)}
                  >
                    <td>
                      <div>
                        <p className="font-medium text-slate-100 text-sm">{p.clienteNombre}</p>
                        <p className="text-xs font-mono text-slate-500">{p.clienteNumero}</p>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-400">{p.numero}</span>
                    </td>
                    <td>
                      <span className="font-mono text-green-400 font-medium">{fmt.money(p.pagoSemanal)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round(((p.pagosCubiertos ?? 0) / 14) * 100)}%`,
                              backgroundColor: hasAtrasado ? '#ef4444' : '#22c55e',
                            }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-mono tabular-nums whitespace-nowrap">
                          {p.pagosCubiertos ?? 0}/14
                        </span>
                      </div>
                    </td>
                    <td>
                      {(p.semanalSinCorte ?? 0) > 0 ? (
                        <span className="font-mono text-orange-400 text-sm font-medium">
                          {fmt.money(p.semanalSinCorte!)}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <span className="font-mono text-sm text-slate-300">
                        {fmt.money(p.saldoPendiente ?? 0)}
                      </span>
                    </td>
                    <td>
                      {/* Mini corrida visual */}
                      <div className="flex gap-1">
                        {Array.from({ length: 14 }, (_, idx) => {
                          const cubiertos  = p.pagosCubiertos ?? 0
                          const atrasados  = p.pagosAtrasados ?? 0
                          const sinCorte   = Math.round((p.semanalSinCorte ?? 0) / p.pagoSemanal)

                          let hex = estadoConfig.PENDIENTE.hex
                          if (idx < cubiertos - sinCorte)          hex = estadoConfig.PAGADO.hex
                          else if (idx < cubiertos)                hex = estadoConfig.PAGADO_SIN_CORTE.hex
                          else if (idx < cubiertos + atrasados)    hex = estadoConfig.ATRASADO.hex
                          else if (idx === cubiertos + atrasados)  hex = estadoConfig.PROXIMO.hex

                          return (
                            <span
                              key={idx}
                              className="w-3 h-3 rounded-sm shrink-0"
                              style={{ backgroundColor: hex }}
                              title={`Pago ${idx + 1}`}
                            />
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
