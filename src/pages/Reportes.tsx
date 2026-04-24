import { useMemo } from 'react'
import { TrendingUp, TrendingDown, BarChart2, RefreshCw } from 'lucide-react'
import {
  BarChart, Bar,
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { useReporte } from '@/hooks'
import { StatCard } from '@/components/ui'
import { fmt } from '@/utils/format'
import type { MesDato } from '@/types'

// ── Paleta coherente con el diseño navy/green ─────────────────────
const C = {
  green:  '#22c55e',
  blue:   '#3b82f6',
  orange: '#f97316',
  red:    '#ef4444',
  slate:  '#64748b',
}

const DONUT_COLORS = [C.green, C.red, C.slate]

// ── Helpers ───────────────────────────────────────────────────────
function labelMes(mes: string) {
  const [y, m] = mes.split('-')
  const nombres = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                       'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  return `${nombres[+m]} ${y.slice(2)}`
}

function tooltipMoney(value: number) {
  return fmt.money(value)
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-navy-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs shadow-xl">
      <p className="text-slate-400 mb-1.5 font-medium">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-mono">
          {p.name}: {typeof p.value === 'number' ? tooltipMoney(p.value) : p.value}
        </p>
      ))}
    </div>
  )
}

export default function Reportes() {
  const { data, isLoading, refetch, isFetching } = useReporte()

  // ── Series acumuladas (para gráfica de línea) ─────────────────
  const serieAcumulada = useMemo(() => {
    if (!data) return []

    const abonoMap = new Map<string, number>(
      data.abonosPorMes.map((d: MesDato) => [d.mes, d.monto])
    )
    const meses = [...new Set([
      ...data.prestamosPorMes.map((d: MesDato) => d.mes),
      ...data.abonosPorMes.map((d: MesDato) => d.mes),
    ])].sort()

    let acumPrestado   = 0
    let acumRecuperado = 0
    return meses.map(mes => {
      const prestRow = data.prestamosPorMes.find((d: MesDato) => d.mes === mes)
      acumPrestado   += prestRow?.monto ?? 0
      acumRecuperado += abonoMap.get(mes) ?? 0
      return {
        mes: labelMes(mes),
        prestado:   acumPrestado,
        recuperado: acumRecuperado,
      }
    })
  }, [data])

  // ── Datos barras mensuales ────────────────────────────────────
  const barData = useMemo(() =>
    (data?.prestamosPorMes ?? []).map((d: MesDato) => ({
      mes:     labelMes(d.mes),
      prestado: d.monto,
      prestamos: d.cantidad,
    })),
  [data])

  // ── Datos dona (cartera) ──────────────────────────────────────
  const donutData = useMemo(() => {
    if (!data) return []
    const liquidados = data.totalClientes - data.prestamosActivos
    return [
      { name: 'Al corriente', value: data.prestamosAlCorriente },
      { name: 'Atrasados',    value: data.prestamosAtrasados },
      { name: 'Liquidados',   value: liquidados > 0 ? liquidados : 0 },
    ].filter(d => d.value > 0)
  }, [data])

  if (isLoading) {
    return (
      <div className="space-y-5 animate-fade-up">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ec-card p-5 h-24 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ec-card p-5 h-64 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const gananciaPositiva = data.gananciaNeta >= 0
  const proyPositiva     = data.proyeccionGanancia >= 0

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-xl text-slate-100">Reportes</h1>
          <p className="text-xs text-slate-500 mt-0.5">Resumen financiero y análisis de cartera</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium bg-navy-800 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
          Actualizar
        </button>
      </div>

      {/* ── Cards financieras ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Total prestado"
          value={fmt.money(data.totalPrestado)}
          sub={`${data.prestamosActivos} activos · ${data.totalClientes} clientes`}
          accent="default"
          delay={0}
        />
        <StatCard
          label="Total recuperado"
          value={fmt.money(data.totalRecuperado)}
          sub={`${fmt.percent(data.totalRecuperado, data.totalPrestado)} del capital`}
          accent="green"
          delay={50}
        />
        <StatCard
          label="Ganancia neta"
          value={fmt.money(Math.abs(data.gananciaNeta))}
          sub={gananciaPositiva ? 'Ganando' : 'En negativo'}
          accent={gananciaPositiva ? 'green' : 'red'}
          delay={100}
        />
        <StatCard
          label="Pendiente cartera"
          value={fmt.money(data.pendienteSiLiquidan)}
          sub="Si todos los activos liquidan"
          accent="orange"
          delay={150}
        />
        <StatCard
          label="Ganancia proyectada"
          value={fmt.money(Math.abs(data.proyeccionGanancia))}
          sub={proyPositiva ? 'Al liquidar toda la cartera' : 'Requiere recuperar más'}
          accent={proyPositiva ? 'blue' : 'red'}
          delay={200}
        />
      </div>

      {/* ── Resumen de cartera ─────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="ec-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-green-600/15 border border-green-600/25 flex items-center justify-center shrink-0">
            <TrendingUp size={16} className="text-green-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Al corriente</p>
            <p className="font-display font-bold text-xl text-green-400">{data.prestamosAlCorriente}</p>
          </div>
        </div>
        <div className="ec-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-red-500/15 border border-red-500/25 flex items-center justify-center shrink-0">
            <TrendingDown size={16} className="text-red-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Atrasados</p>
            <p className="font-display font-bold text-xl text-red-400">{data.prestamosAtrasados}</p>
          </div>
        </div>
        <div className="ec-card p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-navy-700 border border-white/10 flex items-center justify-center shrink-0">
            <BarChart2 size={16} className="text-slate-400" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">Tasa de mora</p>
            <p className="font-display font-bold text-xl text-slate-200">
              {data.prestamosActivos > 0
                ? `${Math.round((data.prestamosAtrasados / data.prestamosActivos) * 100)}%`
                : '—'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Gráficas ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Barras: capital prestado por mes */}
        <div className="ec-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Capital prestado por mes
          </p>
          {barData.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-10">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={40} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="prestado" name="Prestado" fill={C.green} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Línea: acumulado prestado vs recuperado */}
        <div className="ec-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Prestado vs recuperado acumulado
          </p>
          {serieAcumulada.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-10">Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={serieAcumulada} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                  tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} width={40} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                <Line type="monotone" dataKey="prestado"   name="Prestado"   stroke={C.orange} strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="recuperado" name="Recuperado"  stroke={C.green}  strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Dona: distribución de cartera */}
        <div className="ec-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Distribución de cartera
          </p>
          {donutData.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-10">Sin datos</p>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {donutData.map((_, i) => (
                      <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0]
                      return (
                        <div className="bg-navy-900 border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
                          <p style={{ color: d.payload.fill }}>{d.name}: <span className="font-bold">{d.value}</span></p>
                        </div>
                      )
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-3 flex-1">
                {donutData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[i] }} />
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400">{d.name}</p>
                      <p className="font-bold text-slate-100 text-sm">{d.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tabla: top deudores */}
        <div className="ec-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Top deudores — mayor saldo pendiente
          </p>
          {data.topSaldos.length === 0 ? (
            <p className="text-slate-600 text-sm text-center py-10">Sin préstamos activos</p>
          ) : (
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left">
                    <th className="pb-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold pr-3">#</th>
                    <th className="pb-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold pr-3">Cliente</th>
                    <th className="pb-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold text-right pr-3">Abonado</th>
                    <th className="pb-2 text-[10px] uppercase tracking-widest text-slate-500 font-semibold text-right">Pendiente</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topSaldos.map((d, i) => (
                    <tr key={d.clienteNumero} className="border-t border-white/5">
                      <td className="py-2 pr-3">
                        <span className="font-mono text-slate-600">{i + 1}</span>
                      </td>
                      <td className="py-2 pr-3">
                        <p className="font-medium text-slate-200 truncate max-w-[130px]">{d.clienteNombre}</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-mono text-slate-500">{d.clienteNumero}</span>
                          {d.pagosAtrasados > 0 && (
                            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400">
                              {d.pagosAtrasados} atr.
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2 pr-3 text-right font-mono text-green-400">
                        {fmt.money(d.totalAbonado)}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-orange-400">
                        {fmt.money(d.saldoPendiente)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
