import { useQuery } from '@tanstack/react-query'
import { authApi } from '@/api/auth'
import { useAuth } from '@/context/AuthContext'
import { fmt } from '@/utils/format'
import { estadoConfig } from '@/utils/estadoPago'
import { DollarSign, LogOut, CheckCircle2, AlertCircle, Clock, Download } from 'lucide-react'
import type { PrestamoResumen } from '@/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function MiCredito() {
  const { user, logout } = useAuth()

  const { data: prestamo, isLoading, isError } = useQuery({
    queryKey: ['mi-credito'],
    queryFn:  authApi.miCredito,
    retry: false,
  })

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col">

      {/* Header */}
      <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-white/5 bg-navy-950/80 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-green-600/20 flex items-center justify-center">
            <DollarSign size={14} className="text-green-400" />
          </div>
          <span className="font-display font-bold text-sm text-slate-200">Empeña Confiable</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">{user?.nombre}</span>
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Contenido */}
      <main className="flex-1 flex items-start justify-center p-6">
        <div className="w-full max-w-2xl space-y-5 animate-fade-up">

          <div>
            <h1 className="font-display font-bold text-xl text-slate-100">Mi crédito</h1>
            <p className="text-sm text-slate-500 mt-0.5">Consulta el estado de tu préstamo activo</p>
          </div>

          {isLoading && (
            <div className="ec-card p-10 text-center text-slate-500 text-sm">Cargando…</div>
          )}

          {isError && (
            <div className="ec-card p-10 text-center space-y-2">
              <CheckCircle2 size={32} className="text-green-400 mx-auto" />
              <p className="text-slate-300 font-medium">Sin préstamo activo</p>
              <p className="text-slate-500 text-sm">No tienes ningún crédito vigente en este momento.</p>
            </div>
          )}

          {prestamo && <CreditoCard prestamo={prestamo} nombreCliente={user?.nombre ?? ''} />}
        </div>
      </main>
    </div>
  )
}

const ESTADO_LABEL: Record<string, string> = {
  PAGADO: 'Pagado',
  PAGADO_SIN_CORTE: 'Pagado',
  ATRASADO: 'Atrasado',
  PROXIMO: 'Próximo',
  PENDIENTE: 'Pendiente',
}

// Colores RGB para el PDF
const ESTADO_COLOR: Record<string, [number, number, number]> = {
  PAGADO:          [34, 197, 94],   // green-500
  PAGADO_SIN_CORTE:[34, 197, 94],
  ATRASADO:        [239, 68,  68],  // red-500
  PROXIMO:         [59,  130, 246], // blue-500
  PENDIENTE:       [100, 116, 139], // slate-500
}

function generarPDF(prestamo: PrestamoResumen, nombreCliente: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  // ── Cabecera verde ──────────────────────────────────────────────
  doc.setFillColor(22, 163, 74)   // green-600
  doc.rect(0, 0, W, 28, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Empeña Confiable', 14, 11)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Estado de crédito', 14, 18)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 23)

  // Número de préstamo alineado a la derecha
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(prestamo.numero, W - 14, 15, { align: 'right' })

  // ── Datos del cliente ───────────────────────────────────────────
  let y = 36
  doc.setTextColor(30, 41, 59)    // slate-800
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(nombreCliente, 14, y)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139) // slate-500
  doc.text(`Inicio del crédito: ${fmt.date(prestamo.fechaInicio)}`, 14, y + 6)
  doc.text(`Primer pago: ${fmt.date(prestamo.fechaPrimerPago)}`, 14, y + 11)

  // ── Recuadros de resumen ────────────────────────────────────────
  y += 20
  const boxes = [
    { label: 'Monto del crédito',  value: fmt.money(prestamo.monto),               color: [30, 41, 59] as [number,number,number] },
    { label: 'Pago semanal',       value: fmt.money(prestamo.pagoSemanal),          color: [22, 163, 74] as [number,number,number] },
    { label: 'Total abonado',      value: fmt.money(prestamo.totalAbonado ?? 0),    color: [30, 41, 59] as [number,number,number] },
    { label: 'Saldo pendiente',    value: fmt.money(prestamo.saldoPendiente ?? 0),  color: [234, 88,  12] as [number,number,number] },
  ]
  const bw = (W - 28 - 9) / 4  // 4 cajas, 3 gaps de 3mm, margen 14mm
  boxes.forEach((b, i) => {
    const bx = 14 + i * (bw + 3)
    doc.setFillColor(248, 250, 252)
    doc.roundedRect(bx, y, bw, 18, 2, 2, 'F')
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7)
    doc.text(b.label, bx + bw / 2, y + 6, { align: 'center' })
    doc.setTextColor(...b.color)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.text(b.value, bx + bw / 2, y + 13, { align: 'center' })
  })

  // ── Barra de progreso ───────────────────────────────────────────
  y += 25
  const cubiertos = prestamo.pagosCubiertos ?? 0
  const progreso  = Math.round((cubiertos / 14) * 100)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text(`Progreso del crédito`, 14, y)
  doc.text(`${cubiertos}/14 pagos · ${progreso}%`, W - 14, y, { align: 'right' })

  y += 3
  doc.setFillColor(226, 232, 240)
  doc.roundedRect(14, y, W - 28, 4, 2, 2, 'F')
  if (progreso > 0) {
    doc.setFillColor(34, 197, 94)
    doc.roundedRect(14, y, ((W - 28) * progreso) / 100, 4, 2, 2, 'F')
  }

  // ── Tabla de pagos ──────────────────────────────────────────────
  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text('CORRIDA DE 14 PAGOS', 14, y)

  const atras = prestamo.pagosAtrasados ?? 0
  const rows = Array.from({ length: 14 }, (_, n) => {
    let estado = 'PENDIENTE'
    if (n < cubiertos)              estado = 'PAGADO'
    else if (n < cubiertos + atras) estado = 'ATRASADO'
    else if (n === cubiertos + atras) estado = 'PROXIMO'

    const fechaPago = new Date(prestamo.fechaPrimerPago + 'T12:00:00')
    fechaPago.setDate(fechaPago.getDate() + n * 7)
    const fecha = fechaPago.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

    return [
      `#${n + 1}`,
      fecha,
      fmt.money(prestamo.pagoSemanal),
      ESTADO_LABEL[estado],
      estado,
    ]
  })

  autoTable(doc, {
    startY: y + 4,
    head: [['Pago', 'Fecha', 'Importe', 'Estado']],
    body: rows.map(r => r.slice(0, 4)),
    theme: 'grid',
    headStyles: {
      fillColor: [22, 163, 74],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 16 },
      1: { halign: 'center', cellWidth: 36 },
      2: { halign: 'right',  cellWidth: 36 },
      3: { halign: 'center' },
    },
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const estado = rows[data.row.index][4]
        const [r, g, b] = ESTADO_COLOR[estado] ?? [100, 116, 139]
        data.cell.styles.textColor = [r, g, b]
        data.cell.styles.fontStyle = 'bold'
      }
    },
    margin: { left: 14, right: 14 },
    alternateRowStyles: { fillColor: [248, 250, 252] },
  })

  // ── Pie de página ───────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Este documento es informativo y no constituye un comprobante fiscal.', W / 2, pageH - 8, { align: 'center' })
  doc.text('Empeña Confiable © ' + new Date().getFullYear(), W / 2, pageH - 4, { align: 'center' })

  doc.save(`estado-credito-${prestamo.numero}.pdf`)
}

function CreditoCard({ prestamo, nombreCliente }: { prestamo: PrestamoResumen; nombreCliente: string }) {
  const progreso = Math.round(((prestamo.pagosCubiertos ?? 0) / 14) * 100)
  const atrasados = prestamo.pagosAtrasados ?? 0

  return (
    <div className="space-y-4">

      {/* Alerta atrasados */}
      {atrasados > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-red-400">
              Tienes {atrasados} pago{atrasados !== 1 ? 's' : ''} vencido{atrasados !== 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">Por favor comunícate con tu asesor</p>
          </div>
        </div>
      )}

      {/* Card principal */}
      <div className="ec-card overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-slate-500 font-mono">{prestamo.numero}</p>
              <p className="text-3xl font-display font-bold text-slate-100 mt-1">
                {fmt.money(prestamo.monto)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Inicio: {fmt.date(prestamo.fechaInicio)}
              </p>
            </div>
            <div className="flex flex-col items-end gap-3">
              <div className="text-right">
                <p className="text-xs text-slate-500">Pago semanal</p>
                <p className="text-2xl font-display font-bold text-green-400 mt-0.5">
                  {fmt.money(prestamo.pagoSemanal)}
                </p>
              </div>
              <button
                onClick={() => generarPDF(prestamo, nombreCliente)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/15 text-green-400 border border-green-600/25 hover:bg-green-600/25 transition-colors"
              >
                <Download size={12} />
                Descargar PDF
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 divide-x divide-white/5 border-b border-white/5">
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Total abonado</p>
            <p className="font-mono font-bold text-slate-200">{fmt.money(prestamo.totalAbonado ?? 0)}</p>
          </div>
          <div className="px-5 py-4 text-center">
            <p className="text-xs text-slate-500 mb-1">Saldo pendiente</p>
            <p className="font-mono font-bold text-orange-400">{fmt.money(prestamo.saldoPendiente ?? 0)}</p>
          </div>
        </div>

        {/* Progreso */}
        <div className="px-6 py-4 border-b border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500">Progreso del crédito</span>
            <span className="text-xs font-mono text-slate-400">
              {prestamo.pagosCubiertos ?? 0}/14 pagos · {progreso}%
            </span>
          </div>
          <div className="h-2.5 bg-navy-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500 rounded-full transition-all duration-700"
              style={{ width: `${progreso}%` }}
            />
          </div>
        </div>

        {/* Corrida de pagos */}
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-4">
            Corrida de 14 pagos
          </p>

          {/* Leyenda */}
          <div className="flex flex-wrap gap-3 mb-4">
            {(['PAGADO', 'PROXIMO', 'ATRASADO', 'PENDIENTE'] as const).map(e => {
              const cfg = estadoConfig[e]
              return (
                <div key={e} className="flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: cfg.hex }} />
                  {cfg.label}
                </div>
              )
            })}
          </div>

          {/* Grid 7+7 */}
          <div className="space-y-2">
            {[0, 7].map(offset => (
              <div key={offset} className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }, (_, i) => {
                  const n         = offset + i
                  const cubiertos = prestamo.pagosCubiertos ?? 0
                  const atras     = prestamo.pagosAtrasados ?? 0

                  // PAGADO_SIN_CORTE se muestra igual que PAGADO para el cliente
                  let estado: 'PAGADO' | 'PROXIMO' | 'ATRASADO' | 'PENDIENTE' = 'PENDIENTE'
                  if (n < cubiertos)                estado = 'PAGADO'
                  else if (n < cubiertos + atras)   estado = 'ATRASADO'
                  else if (n === cubiertos + atras)  estado = 'PROXIMO'

                  // Fecha del pago: fechaPrimerPago + n semanas
                  const fechaPago = new Date(prestamo.fechaPrimerPago + 'T12:00:00')
                  fechaPago.setDate(fechaPago.getDate() + n * 7)
                  const labelFecha = fechaPago.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })

                  const cfg = estadoConfig[estado]
                  return (
                    <div
                      key={n}
                      className="rounded-xl p-2 border text-center"
                      style={{ backgroundColor: cfg.hex + '11', borderColor: cfg.hex + '33' }}
                    >
                      <p className="text-[10px] font-mono font-medium" style={{ color: cfg.hex }}>
                        #{n + 1}
                      </p>
                      <p className="text-[9px] text-slate-500 leading-tight mt-0.5 mb-1">{labelFecha}</p>
                      <span
                        className="w-2 h-2 rounded-full mx-auto block"
                        style={{ backgroundColor: cfg.hex }}
                      />
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-navy-900/50 border-t border-white/5 flex items-center gap-2">
          <Clock size={12} className="text-slate-600" />
          <p className="text-xs text-slate-600">
            Primer pago: {fmt.date(prestamo.fechaPrimerPago)} · Actualizado en tiempo real
          </p>
        </div>
      </div>
    </div>
  )
}
