import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Phone, MapPin, RefreshCw, Download, Pencil } from 'lucide-react'
import {
  useCliente, useHistorialCliente,
  usePagosPrestamo, useRegistrarAbono, useNuevoPrestamo, useEditarCliente,
} from '@/hooks'
import { Badge, Button, Modal, PagoGrid, Input, DateInput } from '@/components/ui'
import { fmt } from '@/utils/format'
import { estadoConfig } from '@/utils/estadoPago'
import type { Pago, PrestamoResumen } from '@/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const ESTADO_LABEL: Record<string, string> = {
  PAGADO:          'Pagado',
  PAGADO_SIN_CORTE:'Pagado',
  ATRASADO:        'Atrasado',
  PROXIMO:         'Próximo',
  PENDIENTE:       'Pendiente',
}

const ESTADO_COLOR: Record<string, [number, number, number]> = {
  PAGADO:          [34,  197, 94],
  PAGADO_SIN_CORTE:[34,  197, 94],
  ATRASADO:        [239, 68,  68],
  PROXIMO:         [59,  130, 246],
  PENDIENTE:       [100, 116, 139],
}

function generarPDF(prestamo: PrestamoResumen, nombreCliente: string) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W = doc.internal.pageSize.getWidth()

  doc.setFillColor(22, 163, 74)
  doc.rect(0, 0, W, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Empeña Confiable', 14, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Estado de crédito', 14, 18)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 23)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(prestamo.numero, W - 14, 15, { align: 'right' })

  let y = 36
  doc.setTextColor(30, 41, 59)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text(nombreCliente, 14, y)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(100, 116, 139)
  doc.text(`Inicio del crédito: ${fmt.date(prestamo.fechaInicio)}`, 14, y + 6)
  doc.text(`Primer pago: ${fmt.date(prestamo.fechaPrimerPago)}`, 14, y + 11)

  y += 20
  const boxes = [
    { label: 'Monto del crédito', value: fmt.money(prestamo.monto),              color: [30, 41, 59]   as [number,number,number] },
    { label: 'Pago semanal',      value: fmt.money(prestamo.pagoSemanal),         color: [22, 163, 74]  as [number,number,number] },
    { label: 'Total abonado',     value: fmt.money(prestamo.totalAbonado ?? 0),   color: [30, 41, 59]   as [number,number,number] },
    { label: 'Saldo pendiente',   value: fmt.money(prestamo.saldoPendiente ?? 0), color: [234, 88, 12]  as [number,number,number] },
  ]
  const bw = (W - 28 - 9) / 4
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

  y += 25
  const cubiertos = prestamo.pagosCubiertos ?? 0
  const progreso  = Math.round((cubiertos / 14) * 100)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(100, 116, 139)
  doc.text('Progreso del crédito', 14, y)
  doc.text(`${cubiertos}/14 pagos · ${progreso}%`, W - 14, y, { align: 'right' })
  y += 3
  doc.setFillColor(226, 232, 240)
  doc.roundedRect(14, y, W - 28, 4, 2, 2, 'F')
  if (progreso > 0) {
    doc.setFillColor(34, 197, 94)
    doc.roundedRect(14, y, ((W - 28) * progreso) / 100, 4, 2, 2, 'F')
  }

  y += 12
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text('CORRIDA DE 14 PAGOS', 14, y)

  const atras = prestamo.pagosAtrasados ?? 0
  const rows = Array.from({ length: 14 }, (_, n) => {
    let estado = 'PENDIENTE'
    if (n < cubiertos)               estado = 'PAGADO'
    else if (n < cubiertos + atras)  estado = 'ATRASADO'
    else if (n === cubiertos + atras) estado = 'PROXIMO'

    const fechaPago = new Date(prestamo.fechaPrimerPago + 'T12:00:00')
    fechaPago.setDate(fechaPago.getDate() + n * 7)
    const fecha = fechaPago.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })
    return [`#${n + 1}`, fecha, fmt.money(prestamo.pagoSemanal), ESTADO_LABEL[estado], estado]
  })

  autoTable(doc, {
    startY: y + 4,
    head: [['Pago', 'Fecha', 'Importe', 'Estado']],
    body: rows.map(r => r.slice(0, 4)),
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, halign: 'center' },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
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

  const pageH = doc.internal.pageSize.getHeight()
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(7)
  doc.setTextColor(148, 163, 184)
  doc.text('Este documento es informativo y no constituye un comprobante fiscal.', W / 2, pageH - 8, { align: 'center' })
  doc.text('Empeña Confiable © ' + new Date().getFullYear(), W / 2, pageH - 4, { align: 'center' })

  doc.save(`estado-credito-${prestamo.numero}.pdf`)
}

export default function DetalleCliente() {
  const { id }     = useParams<{ id: string }>()
  const navigate   = useNavigate()

  const { data: cliente }                       = useCliente(id!)
  const { data: historial = [] }                = useHistorialCliente(id!)

  // Préstamo activo (primero de la lista si activo = true)
  const prestamoActivo = historial.find((p: PrestamoResumen) => p.activo)

  // Modal abono
  const [abonoModal, setAbonoModal] = useState(false)
  const [pagoSeleccionado, setPagoSeleccionado] = useState<Pago | null>(null)
  const [montoAbono, setMontoAbono] = useState('')
  const registrar = useRegistrarAbono(prestamoActivo?.id ?? '')

  function abrirAbono(pago: Pago) {
    setPagoSeleccionado(pago)
    setMontoAbono(String(pago.saldoPendiente ?? pago.montoProgramado))
    setAbonoModal(true)
  }

  function confirmarAbono() {
    if (!pagoSeleccionado) return
    registrar.mutate(
      { pagoId: pagoSeleccionado.id, montoAbono: Number(montoAbono) },
      { onSuccess: () => { setAbonoModal(false); setPagoSeleccionado(null) } }
    )
  }

  // Modal editar cliente
  const [editModal, setEditModal] = useState(false)
  const [editForm, setEditForm] = useState({ telefono: '', domicilio: '' })
  const editar = useEditarCliente()

  function abrirEditar() {
    if (!cliente) return
    setEditForm({
      telefono:  cliente.telefono  ?? '',
      domicilio: cliente.domicilio ?? '',
    })
    setEditModal(true)
  }

  function confirmarEditar() {
    if (!cliente) return
    editar.mutate(
      { id: cliente.id, data: { telefono: editForm.telefono, domicilio: editForm.domicilio } },
      { onSuccess: () => setEditModal(false) }
    )
  }

  // Modal nuevo préstamo
  const [nuevoModal, setNuevoModal] = useState(false)
  const [nuevoForm, setNuevoForm] = useState({
    monto: '', fechaInicio: new Date().toISOString().split('T')[0],
    fechaPrimerPago: '', domicilio: '', telefono: '', nombre: '',
  })
  const nuevoPrestamo = useNuevoPrestamo(id!)
  const pagoSemanalNuevo = nuevoForm.monto ? Math.round(Number(nuevoForm.monto) * 0.10) : 0

  function confirmarNuevo() {
    if (!cliente) return
    nuevoPrestamo.mutate(
      {
        nombre:          cliente.nombre,
        telefono:        nuevoForm.telefono || cliente.telefono || '',
        domicilio:       nuevoForm.domicilio || cliente.domicilio || '',
        monto:           Number(nuevoForm.monto),
        fechaInicio:     nuevoForm.fechaInicio,
        fechaPrimerPago: nuevoForm.fechaPrimerPago,
      },
      { onSuccess: () => setNuevoModal(false) }
    )
  }

  if (!cliente) return null

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => navigate('/clientes')}
          className="p-2 rounded-xl hover:bg-navy-800 text-slate-400 hover:text-slate-200 transition-colors mt-0.5 shrink-0"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-navy-700 border border-white/10 flex items-center justify-center shrink-0">
              <span className="font-display font-bold text-sm text-slate-300">
                {fmt.initials(cliente.nombre)}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-display font-bold text-lg leading-none truncate">{cliente.nombre}</h1>
                <button
                  onClick={abrirEditar}
                  className="p-1 rounded-lg hover:bg-navy-700 text-slate-500 hover:text-slate-300 transition-colors shrink-0"
                  title="Editar datos de contacto"
                >
                  <Pencil size={13} />
                </button>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">{cliente.numero}</p>
            </div>
          </div>
          {(cliente.telefono || cliente.domicilio) && (
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2 ml-14">
              {cliente.telefono && (
                <span className="flex items-center gap-1.5">
                  <Phone size={12} /> {cliente.telefono}
                </span>
              )}
              {cliente.domicilio && (
                <span className="flex items-center gap-1.5 truncate max-w-full">
                  <MapPin size={12} /> {cliente.domicilio}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Préstamo activo */}
      {prestamoActivo ? (
        <PrestamoActivo
          prestamo={prestamoActivo}
          nombreCliente={cliente.nombre}
          onAbonarPago={abrirAbono}
        />
      ) : (
        <div className="ec-card p-6 flex items-center justify-between">
          <div>
            <p className="font-medium text-slate-200">Sin préstamo activo</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Este cliente ha liquidado todos sus préstamos
            </p>
          </div>
          <Button variant="primary" onClick={() => setNuevoModal(true)}>
            <Plus size={14} />
            Nuevo préstamo
          </Button>
        </div>
      )}

      {/* Historial de préstamos */}
      {historial.filter((p: PrestamoResumen) => !p.activo).length > 0 && (
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
            Historial de préstamos liquidados
          </h2>
          <div className="space-y-2">
            {historial
              .filter((p: PrestamoResumen) => !p.activo)
              .map((p: PrestamoResumen) => (
                <div key={p.id} className="ec-card p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <span className="font-mono text-xs text-slate-500">{p.numero}</span>
                    <div>
                      <span className="font-mono text-sm text-slate-300">{fmt.money(p.monto)}</span>
                      <span className="text-xs text-slate-600 ml-2">{fmt.date(p.fechaInicio)}</span>
                    </div>
                    <Badge estado="PAGADO" />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500">Recuperado</p>
                    <p className="font-mono text-sm text-green-400">{fmt.money(p.totalAbonado ?? 0)}</p>
                  </div>
                </div>
              ))}
          </div>

          {/* Botón nuevo préstamo cuando ya tiene historial */}
          {!prestamoActivo && (
            <div className="mt-3 flex justify-end">
              <Button variant="primary" size="sm" onClick={() => setNuevoModal(true)}>
                <RefreshCw size={13} />
                Nuevo préstamo
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Modal registrar abono */}
      <Modal
        open={abonoModal}
        onClose={() => setAbonoModal(false)}
        title={`Registrar abono — Pago #${pagoSeleccionado?.numeroPago}`}
        size="sm"
      >
        {pagoSeleccionado && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded-lg bg-navy-700/50">
                <p className="text-xs text-slate-500">Monto programado</p>
                <p className="font-mono font-medium text-slate-200 mt-0.5">
                  {fmt.money(pagoSeleccionado.montoProgramado)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-navy-700/50">
                <p className="text-xs text-slate-500">Saldo pendiente</p>
                <p className="font-mono font-medium text-orange-400 mt-0.5">
                  {fmt.money(pagoSeleccionado.saldoPendiente ?? pagoSeleccionado.montoProgramado)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Monto a abonar ($)
              </label>
              <input
                type="number"
                min="1"
                max={pagoSeleccionado.saldoPendiente ?? pagoSeleccionado.montoProgramado}
                step="1"
                className="ec-input font-mono text-lg"
                value={montoAbono}
                onChange={e => setMontoAbono(e.target.value)}
              />
              <p className="text-xs text-slate-500">
                Puedes abonar un monto parcial — el pago quedará en naranja hasta completarse
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <Button variant="ghost" className="flex-1" onClick={() => setAbonoModal(false)}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                className="flex-1"
                loading={registrar.isPending}
                disabled={!montoAbono || Number(montoAbono) <= 0}
                onClick={confirmarAbono}
              >
                Confirmar abono
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal editar cliente */}
      <Modal open={editModal} onClose={() => setEditModal(false)} title="Editar datos de contacto" size="sm">
        <div className="space-y-4">
          <Input
            label="Teléfono"
            type="tel"
            placeholder="10 dígitos"
            value={editForm.telefono}
            onChange={e => setEditForm(f => ({ ...f, telefono: e.target.value }))}
          />
          <Input
            label="Domicilio"
            placeholder="Calle, número, colonia..."
            value={editForm.domicilio}
            onChange={e => setEditForm(f => ({ ...f, domicilio: e.target.value }))}
          />
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setEditModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={editar.isPending}
              onClick={confirmarEditar}
            >
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal nuevo préstamo */}
      <Modal open={nuevoModal} onClose={() => setNuevoModal(false)} title="Nuevo préstamo" size="md">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-navy-700/50 border border-white/5 text-sm">
            <p className="text-slate-400">Cliente: <span className="text-slate-200 font-medium">{cliente.nombre}</span></p>
            <p className="text-slate-500 text-xs mt-0.5">{cliente.numero}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Monto del préstamo ($)"
              type="number" min="100" step="100"
              value={nuevoForm.monto}
              onChange={e => setNuevoForm(f => ({ ...f, monto: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Pago semanal</label>
              <div className="ec-input font-mono text-green-400 opacity-70 cursor-default">
                {pagoSemanalNuevo > 0 ? fmt.money(pagoSemanalNuevo) : '—'}
              </div>
            </div>
            <DateInput
              label="Fecha de inicio"
              value={nuevoForm.fechaInicio}
              onChange={iso => setNuevoForm(f => ({ ...f, fechaInicio: iso }))}
            />
            <DateInput
              label="Primer sábado de pago"
              value={nuevoForm.fechaPrimerPago}
              onChange={iso => setNuevoForm(f => ({ ...f, fechaPrimerPago: iso }))}
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="ghost" className="flex-1" onClick={() => setNuevoModal(false)}>Cancelar</Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={nuevoPrestamo.isPending}
              disabled={!nuevoForm.monto || !nuevoForm.fechaPrimerPago}
              onClick={confirmarNuevo}
            >
              Generar préstamo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Sub-componente PrestamoActivo ──────────────────────────────────
function PrestamoActivo({
  prestamo, nombreCliente, onAbonarPago,
}: {
  prestamo:      PrestamoResumen
  nombreCliente: string
  onAbonarPago:  (pago: Pago) => void
}) {
  const { data: pagos = [], isLoading } = usePagosPrestamo(prestamo.id)
  const progreso = Math.round(((prestamo.pagosCubiertos ?? 0) / 14) * 100)

  return (
    <div className="ec-card overflow-hidden">
      {/* Header del préstamo */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center gap-3 mb-3">
          <Badge estado="PROXIMO" />
          <span className="font-mono text-sm text-slate-400">{prestamo.numero}</span>
          <span className="font-display font-bold text-xl text-slate-100">
            {fmt.money(prestamo.monto)}
          </span>
          <button
            onClick={() => generarPDF(prestamo, nombreCliente)}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/15 text-green-400 border border-green-600/25 hover:bg-green-600/25 transition-colors shrink-0"
          >
            <Download size={12} />
            PDF
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-navy-700/50">
            <p className="text-[10px] text-slate-500">Pago semanal</p>
            <p className="font-mono text-green-400 font-medium text-sm mt-0.5">{fmt.money(prestamo.pagoSemanal)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-700/50">
            <p className="text-[10px] text-slate-500">Total abonado</p>
            <p className="font-mono text-slate-200 font-medium text-sm mt-0.5">{fmt.money(prestamo.totalAbonado ?? 0)}</p>
          </div>
          <div className="p-2.5 rounded-lg bg-navy-700/50">
            <p className="text-[10px] text-slate-500">Saldo pendiente</p>
            <p className="font-mono text-orange-400 font-medium text-sm mt-0.5">{fmt.money(prestamo.saldoPendiente ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="px-5 py-3 border-b border-white/5 flex items-center gap-4">
        <div className="flex-1 h-2 bg-navy-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-700"
            style={{ width: `${progreso}%` }}
          />
        </div>
        <span className="text-xs font-mono text-slate-400 shrink-0">
          {prestamo.pagosCubiertos ?? 0}/14 pagos · {progreso}%
        </span>
      </div>

      {/* Corrida de pagos */}
      <div className="p-5">
        {/* Leyenda */}
        <div className="flex gap-4 mb-4 flex-wrap">
          {(['PAGADO', 'ATRASADO', 'PAGADO_SIN_CORTE', 'PROXIMO', 'PENDIENTE'] as const).map(e => {
            const cfg = estadoConfig[e]
            return (
              <div key={e} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: cfg.hex }} />
                {cfg.label}
              </div>
            )
          })}
        </div>

        {/* Grid de 14 cajitas */}
        {isLoading ? (
          <div className="flex gap-2">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-9 h-9 rounded-md bg-navy-700 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <PagoGrid pagos={pagos} size="md" onPagoClick={onAbonarPago} />

            {/* Detalle por pago */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-4">
              {pagos.map((pago: Pago) => {
                const cfg = estadoConfig[pago.estado]
                const isPagable = ['PROXIMO', 'ATRASADO', 'PENDIENTE'].includes(pago.estado)
                return (
                  <button
                    key={pago.id}
                    onClick={() => isPagable && onAbonarPago(pago)}
                    className={`p-2.5 rounded-xl border text-left transition-all duration-150 active:scale-95 ${
                      isPagable ? 'cursor-pointer hover:border-white/20' : 'cursor-default'
                    }`}
                    style={{
                      backgroundColor: cfg.hex + '11',
                      borderColor: cfg.hex + '33',
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-mono" style={{ color: cfg.hex }}>
                        #{pago.numeroPago}
                      </span>
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cfg.hex }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      {fmt.dateShort(pago.fechaProgramada)}
                    </p>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: cfg.hex }}>
                      {fmt.money(pago.montoProgramado)}
                    </p>
                    {pago.totalAbonado != null && pago.totalAbonado > 0 && (
                      <p className="text-[9px] text-slate-600 mt-0.5">
                        abo: {fmt.money(pago.totalAbonado)}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
