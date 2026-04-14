import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, AlertTriangle, TrendingUp } from 'lucide-react'
import {
  useDashboard, usePrestamosActivos, useRealizarCorte,
  useTotalSemanal
} from '@/hooks'
import { StatCard, PagoGrid, Badge, Button, Modal } from '@/components/ui'
import { fmt } from '@/utils/format'
import { useAuth } from '@/context/AuthContext'
import type { PrestamoResumen } from '@/types'

export default function Dashboard() {
  const navigate                   = useNavigate()
  const { data: dash, isLoading }  = useDashboard()
  const { data: activos = [] }     = usePrestamosActivos()
  const { data: semanal }          = useTotalSemanal()
  const corte                      = useRealizarCorte()
  const { isAdmin }                = useAuth()
  const [corteOpen, setCorteOpen]  = useState(false)
  const [desc, setDesc]            = useState('')

  const porcentajeRecuperado = dash
    ? Math.round((dash.totalRecuperado / (dash.totalPrestadoHistorico || 1)) * 100)
    : 0

  function handleCorte() {
    corte.mutate({ descripcion: desc }, {
      onSuccess: () => { setCorteOpen(false); setDesc('') },
    })
  }

  return (
    <div className="space-y-6">

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total prestado"
          value={dash ? fmt.money(dash.totalPrestadoHistorico) : '—'}
          sub={`${dash?.prestamosActivos ?? 0} préstamos activos`}
          accent="default"
          delay={0}
        />
        <StatCard
          label="Total recuperado"
          value={dash ? fmt.money(dash.totalRecuperado) : '—'}
          sub={`${porcentajeRecuperado}% del total`}
          accent="green"
          delay={60}
        />
        <StatCard
          label="Acumulado semanal"
          value={semanal ? fmt.money(semanal.totalSemanal) : '—'}
          sub="pendiente de corte"
          accent="orange"
          delay={120}
        />
        <StatCard
          label="Pagos atrasados"
          value={dash?.pagosAtrasados ?? '—'}
          sub={`${dash?.totalClientes ?? 0} clientes totales`}
          accent={dash && dash.pagosAtrasados > 0 ? 'red' : 'default'}
          delay={180}
        />
      </div>

      {/* Barra de corte */}
      <div className="ec-card p-4 flex items-center justify-between gap-4 animate-fade-up stagger-4">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-600/15 flex items-center justify-center shrink-0">
            <TrendingUp size={18} className="text-green-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">
              {semanal && semanal.totalSemanal > 0
                ? `${fmt.money(semanal.totalSemanal)} listos para corte`
                : 'Sin abonos pendientes de corte'}
            </p>
            <p className="text-xs text-slate-500">
              {dash?.abonosPendientesCorte ?? 0} abono{dash?.abonosPendientesCorte !== 1 ? 's' : ''} naranja acumulado{dash?.abonosPendientesCorte !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCorteOpen(true)}
          disabled={!isAdmin || !semanal || semanal.totalSemanal === 0}
        >
          <Scissors size={14} />
          Realizar corte
        </Button>
      </div>

      {/* Tabla de clientes activos */}
      <div className="animate-fade-up stagger-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">
            Clientes activos — {activos.length}
          </h2>
          <button
            onClick={() => navigate('/clientes')}
            className="text-xs text-green-400 hover:text-green-300 transition-colors"
          >
            Ver todos →
          </button>
        </div>

        <div className="ec-card overflow-hidden">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Cargando...</div>
          ) : activos.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No hay préstamos activos</div>
          ) : (
            <table className="ec-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Préstamo</th>
                  <th>Pago semanal</th>
                  <th>Progreso</th>
                  <th>Saldo</th>
                  <th>Corrida</th>
                </tr>
              </thead>
              <tbody>
                {activos.map((p: PrestamoResumen, i) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/clientes/${p.clienteId}`)}
                    style={{ animationDelay: `${i * 30}ms` }}
                  >
                    <td>
                      <div>
                        <p className="font-medium text-slate-100 text-sm">{p.clienteNombre}</p>
                        <p className="text-xs text-slate-500 font-mono">{p.clienteNumero}</p>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-slate-400">{p.numero}</span>
                    </td>
                    <td>
                      <span className="font-mono text-green-400">{fmt.money(p.pagoSemanal)}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-500 rounded-full transition-all"
                            style={{ width: `${Math.round(((p.pagosCubiertos ?? 0) / 14) * 100)}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 font-mono tabular-nums">
                          {p.pagosCubiertos ?? 0}/14
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`font-mono text-sm ${(p.saldoPendiente ?? 0) > 0 ? 'text-slate-300' : 'text-green-400'}`}>
                        {fmt.money(p.saldoPendiente ?? 0)}
                      </span>
                    </td>
                    <td>
                      {/* Mini corrida placeholder - se carga en detalle */}
                      <div className="flex gap-1">
                        {Array.from({ length: 14 }, (_, i) => {
                          const covered  = p.pagosCubiertos ?? 0
                          const atrasado = p.pagosAtrasados ?? 0
                          let color = '#374151'
                          if (i < covered)             color = '#22c55e'
                          else if (i < covered + atrasado) color = '#ef4444'
                          else if (i === covered + atrasado) color = '#3b82f6'
                          return (
                            <span
                              key={i}
                              className="w-2.5 h-2.5 rounded-sm"
                              style={{ backgroundColor: color }}
                            />
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal corte */}
      <Modal open={corteOpen} onClose={() => setCorteOpen(false)} title="Realizar corte semanal" size="sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-600/10 border border-green-600/20">
            <p className="text-sm text-green-400 font-medium">
              Se cerrarán {dash?.abonosPendientesCorte ?? 0} abonos
            </p>
            <p className="text-2xl font-display font-bold text-green-400 mt-1">
              {semanal ? fmt.money(semanal.totalSemanal) : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Los pagos naranja pasarán a verde
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Descripción (opcional)
            </label>
            <input
              className="ec-input"
              placeholder="Ej. Corte semana del 7 al 12 Abr"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => setCorteOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={corte.isPending}
              onClick={handleCorte}
            >
              <Scissors size={14} />
              Confirmar corte
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
