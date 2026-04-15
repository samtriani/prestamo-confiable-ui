import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scissors, TrendingUp, Download } from 'lucide-react'
import {
  useDashboard, usePrestamosActivos, useRealizarCorte,
  useTotalSemanal
} from '@/hooks'
import { StatCard, Button, Modal } from '@/components/ui'
import { fmt } from '@/utils/format'
import { useAuth } from '@/context/AuthContext'
import type { DashboardData, PrestamoResumen } from '@/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function generarPDFDashboard(
  dash: DashboardData,
  totalSemanal: number,
  activos: PrestamoResumen[],
) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()
  const fecha = new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── Cabecera ────────────────────────────────────────────────────
  doc.setFillColor(22, 163, 74)
  doc.rect(0, 0, W, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Empeña Confiable', 14, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Reporte del Dashboard', 14, 18)
  doc.text(`Generado: ${fecha}`, 14, 23)

  // ── KPIs ────────────────────────────────────────────────────────
  let y = 36
  const porcentaje = Math.round((dash.totalRecuperado / (dash.totalPrestadoHistorico || 1)) * 100)

  const boxes = [
    { label: 'Total prestado',    value: fmt.money(dash.totalPrestadoHistorico), color: [30, 41, 59]   as [number,number,number] },
    { label: 'Total recuperado',  value: fmt.money(dash.totalRecuperado),         color: [22, 163, 74]  as [number,number,number] },
    { label: 'Acumulado semanal', value: fmt.money(totalSemanal),                 color: [234, 88, 12]  as [number,number,number] },
    { label: 'Pagos atrasados',   value: String(dash.pagosAtrasados),             color: dash.pagosAtrasados > 0 ? [239, 68, 68] as [number,number,number] : [30, 41, 59] as [number,number,number] },
  ]

  const bw = (W - 28 - 9) / 4
  boxes.forEach((b, i) => {
    const bx = 14 + i * (bw + 3)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(bx, y, bw, 20, 2, 2, 'F')
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(b.label, bx + bw / 2, y + 6, { align: 'center' })
    doc.setTextColor(...b.color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(b.value, bx + bw / 2, y + 14, { align: 'center' })
  })

  // ── Barra de recuperación ────────────────────────────────────────
  y += 28
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Porcentaje recuperado', 14, y)
  doc.text(`${dash.prestamosActivos} préstamos activos · ${dash.totalClientes} clientes`, W - 14, y, { align: 'right' })

  y += 3
  doc.setFillColor(226, 232, 240)
  doc.roundedRect(14, y, W - 28, 4, 2, 2, 'F')
  if (porcentaje > 0) {
    doc.setFillColor(34, 197, 94)
    doc.roundedRect(14, y, ((W - 28) * Math.min(porcentaje, 100)) / 100, 4, 2, 2, 'F')
  }
  doc.setFontSize(7)
  doc.setTextColor(100, 116, 139)
  doc.text(`${porcentaje}%`, W / 2, y + 3, { align: 'center' })

  // ── Tabla clientes activos ───────────────────────────────────────
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text(`CLIENTES ACTIVOS (${activos.length})`, 14, y)

  const rows = activos.map((p, idx) => [
    String(idx + 1),
    p.clienteNombre ?? '—',
    p.numero,
    fmt.money(p.monto),
    fmt.money(p.pagoSemanal),
    `${p.pagosCubiertos ?? 0}/14`,
    fmt.money(p.saldoPendiente ?? 0),
  ])

  autoTable(doc, {
    startY: y + 4,
    head: [['#', 'Cliente', 'Préstamo', 'Monto', 'Pago sem.', 'Avance', 'Saldo']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5,
      halign: 'center',
    },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { cellWidth: 46 },
      2: { halign: 'center', cellWidth: 22 },
      3: { halign: 'right',  cellWidth: 26 },
      4: { halign: 'right',  cellWidth: 22 },
      5: { halign: 'center', cellWidth: 18 },
      6: { halign: 'right' },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  })

  // ── Pie de página ────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Documento interno — Empeña Confiable', W / 2, pageH - 8, { align: 'center' })
  doc.text(`© ${new Date().getFullYear()} · Generado el ${fecha}`, W / 2, pageH - 4, { align: 'center' })

  doc.save(`dashboard-${new Date().toISOString().slice(0, 10)}.pdf`)
}

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
      <div className="ec-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 animate-fade-up stagger-4">
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
          <div className="flex items-center gap-3">
            {dash && (
              <button
                onClick={() => generarPDFDashboard(dash, semanal?.totalSemanal ?? 0, activos)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-600/15 text-green-400 border border-green-600/25 hover:bg-green-600/25 transition-colors"
              >
                <Download size={12} />
                <span className="hidden sm:inline">Descargar reporte</span>
              </button>
            )}
            <button
              onClick={() => navigate('/clientes')}
              className="text-xs text-green-400 hover:text-green-300 transition-colors"
            >
              Ver todos →
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="ec-card p-8 text-center text-slate-500 text-sm">Cargando...</div>
        ) : activos.length === 0 ? (
          <div className="ec-card p-8 text-center text-slate-500 text-sm">No hay préstamos activos</div>
        ) : (
          <>
            {/* ── MOBILE: cards ─────────────────────────────────── */}
            <div className="md:hidden space-y-2">
              {activos.map((p: PrestamoResumen, i) => (
                <div
                  key={p.id}
                  className="ec-card p-4 cursor-pointer active:bg-navy-700 transition-colors animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                  onClick={() => navigate(`/clientes/${p.clienteId}`)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="min-w-0">
                      <p className="font-medium text-slate-100 text-sm truncate">{p.clienteNombre}</p>
                      <p className="text-xs font-mono text-slate-500">{p.clienteNumero} · {p.numero}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-sm text-slate-300">{fmt.money(p.saldoPendiente ?? 0)}</p>
                      <p className="text-[10px] text-slate-500">saldo</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-green-400">{fmt.money(p.pagoSemanal)}/sem</span>
                    <div className="flex items-center gap-1.5 flex-1">
                      <div className="flex-1 h-1.5 bg-navy-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${Math.round(((p.pagosCubiertos ?? 0) / 14) * 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 tabular-nums shrink-0">
                        {p.pagosCubiertos ?? 0}/14
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* ── DESKTOP: tabla ────────────────────────────────── */}
            <div className="hidden md:block ec-card overflow-hidden">
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
                        <div className="flex gap-1">
                          {Array.from({ length: 14 }, (_, i) => {
                            const cubiertos  = p.pagosCubiertos ?? 0
                            const sinCorte   = p.pagosSinCorte  ?? 0
                            const pagados    = cubiertos - sinCorte
                            const atrasados  = p.pagosAtrasados ?? 0
                            let color = '#374151'
                            if (i < pagados)                    color = '#22c55e'
                            else if (i < cubiertos)             color = '#f97316'
                            else if (i < cubiertos + atrasados) color = '#ef4444'
                            else if (i === cubiertos + atrasados) color = '#3b82f6'
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
            </div>
          </>
        )}
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
