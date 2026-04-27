import { useState, useMemo } from 'react'
import { Scissors, CalendarDays, Users, CreditCard, ChevronUp, ChevronDown, ChevronsUpDown, Download } from 'lucide-react'
import { useCortes, useRealizarCorte, useTotalSemanal } from '@/hooks'
import { Button, Modal } from '@/components/ui'
import { fmt } from '@/utils/format'
import { useAuth } from '@/context/AuthContext'
import { cortesApi } from '@/api'
import type { Corte, CorteAbonoItem } from '@/types'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

function generarPDFCorte(corte: Corte, abonos: CorteAbonoItem[]) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const W   = doc.internal.pageSize.getWidth()

  // ── Encabezado verde ──────────────────────────────────────────
  doc.setFillColor(22, 163, 74)
  doc.rect(0, 0, W, 30, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.text('Empeña Confiable', 14, 11)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.text('Reporte de corte semanal', 14, 18)
  doc.text(`Generado: ${new Date().toLocaleDateString('es-MX')}`, 14, 23)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(`Corte ${fmt.date(corte.fechaCorte)}`, W - 14, 18, { align: 'right' })

  // ── Cajas resumen ─────────────────────────────────────────────
  let y = 38
  const boxes = [
    { label: 'Total del corte',  value: fmt.money(corte.totalSemanal),   color: [22, 163, 74]  as [number,number,number] },
    { label: 'Abonos',           value: String(corte.numAbonos),          color: [30, 41,  59]  as [number,number,number] },
    { label: 'Clientes',         value: String(corte.numClientes ?? '—'), color: [30, 41,  59]  as [number,number,number] },
    { label: 'Préstamos',        value: String(corte.numPrestamos ?? '—'),color: [30, 41,  59]  as [number,number,number] },
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

  // Descripción
  if (corte.descripcion) {
    y += 23
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.setTextColor(100, 116, 139)
    doc.text(`Descripción: ${corte.descripcion}`, 14, y)
  }

  // ── Tabla de abonos ───────────────────────────────────────────
  y += 10
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.setTextColor(30, 41, 59)
  doc.text('DETALLE DE ABONOS', 14, y)

  const rows = abonos.map((a, idx) => [
    String(idx + 1),
    a.clienteNumero,
    a.clienteNombre,
    a.clienteTelefono ?? '—',
    a.prestamoNumero,
    `${a.numeroPago}/14`,
    fmt.money(a.montoAbono),
    new Date(a.fechaAbono).toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
  ])

  autoTable(doc, {
    startY: y + 4,
    head: [['#', 'No.', 'Cliente', 'Teléfono', 'Préstamo', 'Pago', 'Monto', 'Fecha abono']],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [22, 163, 74], textColor: [255, 255, 255],
      fontStyle: 'bold', fontSize: 7, halign: 'center',
    },
    bodyStyles: { fontSize: 7, textColor: [30, 41, 59] },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8  },
      1: { halign: 'center', cellWidth: 16 },
      2: { cellWidth: 40 },
      3: { cellWidth: 24 },
      4: { halign: 'center', cellWidth: 18 },
      5: { halign: 'center', cellWidth: 12 },
      6: { halign: 'right',  cellWidth: 22, fontStyle: 'bold' },
      7: { halign: 'center', cellWidth: 30 },
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    foot: [[
      { content: 'TOTAL DEL CORTE', colSpan: 6, styles: { halign: 'right' as const } },
      { content: fmt.money(corte.totalSemanal),  styles: { halign: 'right' as const, fontStyle: 'bold' as const } },
      { content: '' },
    ]],
    footStyles: {
      fillColor: [22, 163, 74], textColor: [255, 255, 255], fontSize: 9,
    },
    showFoot: 'lastPage',
    margin: { left: 14, right: 14 },
    didDrawPage: (_data) => {
      const pageH = doc.internal.pageSize.getHeight()
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(148, 163, 184)
      doc.text('Empeña Confiable © ' + new Date().getFullYear(), W / 2, pageH - 4, { align: 'center' })
    },
  })

  doc.save(`corte-${fmt.date(corte.fechaCorte).replace(/ /g, '-')}.pdf`)
}

type SortKey = 'createdAt' | 'totalSemanal' | 'numAbonos' | 'numClientes' | 'numPrestamos'
type SortDir = 'asc' | 'desc'

function SortIcon({ col, sortKey, dir }: { col: SortKey; sortKey: SortKey; dir: SortDir }) {
  if (col !== sortKey) return <ChevronsUpDown size={12} className="inline ml-1 opacity-30" />
  return dir === 'asc'
    ? <ChevronUp size={12} className="inline ml-1 text-green-400" />
    : <ChevronDown size={12} className="inline ml-1 text-green-400" />
}

export default function Cortes() {
  const { data: cortes = [], isLoading } = useCortes()
  const { data: semanal }                = useTotalSemanal()
  const realizarCorte                    = useRealizarCorte()
  const { isAdmin }                      = useAuth()
  const [modal, setModal]                = useState(false)
  const [desc, setDesc]                  = useState('')
  const [sortKey, setSortKey]            = useState<SortKey>('createdAt')
  const [sortDir, setSortDir]            = useState<SortDir>('desc')
  const [downloadingId, setDownloadingId] = useState<string | null>(null)

  async function descargarPDF(corte: Corte) {
    if (downloadingId) return
    setDownloadingId(corte.id)
    try {
      const abonos = await cortesApi.getAbonos(corte.id)
      generarPDFCorte(corte, abonos)
    } finally {
      setDownloadingId(null)
    }
  }

  function handleCorte() {
    realizarCorte.mutate(
      { descripcion: desc },
      { onSuccess: () => { setModal(false); setDesc('') } }
    )
  }

  function toggleSort(col: SortKey) {
    if (sortKey === col) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(col)
      setSortDir('desc')
    }
  }

  const sorted = useMemo(() => {
    return [...cortes].sort((a: Corte, b: Corte) => {
      let av: number | string, bv: number | string
      switch (sortKey) {
        case 'createdAt':    av = a.createdAt ?? ''; bv = b.createdAt ?? ''; break
        case 'totalSemanal': av = a.totalSemanal;    bv = b.totalSemanal;    break
        case 'numAbonos':    av = a.numAbonos;       bv = b.numAbonos;       break
        case 'numClientes':  av = a.numClientes ?? 0; bv = b.numClientes ?? 0; break
        case 'numPrestamos': av = a.numPrestamos ?? 0; bv = b.numPrestamos ?? 0; break
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [cortes, sortKey, sortDir])

  const totalHistorico = cortes.reduce((acc: number, c: Corte) => acc + c.totalSemanal, 0)

  const thClass = 'cursor-pointer select-none hover:text-slate-200 transition-colors whitespace-nowrap'

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Resumen y acción */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="ec-card p-4 sm:p-5">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1 sm:mb-2">Cortes realizados</p>
          <p className="text-2xl font-display font-bold">{cortes.length}</p>
        </div>
        <div className="ec-card p-4 sm:p-5">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1 sm:mb-2">Total histórico</p>
          <p className="text-xl sm:text-2xl font-display font-bold text-green-400">{fmt.money(totalHistorico)}</p>
        </div>
        <div className="col-span-2 sm:col-span-1 ec-card p-4 sm:p-5 flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Pendiente de corte</p>
            <p className="text-xl sm:text-2xl font-display font-bold text-orange-400">
              {semanal ? fmt.money(semanal.totalSemanal) : '—'}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModal(true)}
            disabled={!isAdmin || !semanal || semanal.totalSemanal === 0}
          >
            <Scissors size={13} />
            Corte
          </Button>
        </div>
      </div>

      {/* Historial */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">
          Historial de cortes
        </h2>
        {isLoading ? (
          <div className="ec-card p-10 text-center text-slate-500 text-sm">Cargando…</div>
        ) : cortes.length === 0 ? (
          <div className="ec-card p-10 text-center">
            <Scissors size={24} className="text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No hay cortes realizados aún</p>
            <p className="text-slate-600 text-xs mt-1">El primer corte aparecerá aquí</p>
          </div>
        ) : (
          <>
            {/* ── MOBILE: cards ─────────────────────────────────── */}
            <div className="md:hidden space-y-2">
              {sorted.map((c: Corte, i) => (
                <div
                  key={c.id}
                  className="ec-card p-4 animate-fade-in"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-slate-200 text-sm">{fmt.date(c.fechaCorte)}</p>
                      <p className="text-xs text-slate-500">{fmt.datetime(c.createdAt)}</p>
                    </div>
                    <span className="font-mono font-bold text-green-400 text-base">{fmt.money(c.totalSemanal)}</span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span><span className="text-slate-400 font-mono">{c.numAbonos}</span> abonos</span>
                    <span><span className="text-slate-400 font-mono">{c.numClientes ?? '—'}</span> clientes</span>
                    {c.descripcion && <span className="italic truncate">{c.descripcion}</span>}
                    <button
                      onClick={() => descargarPDF(c)}
                      disabled={downloadingId === c.id}
                      className="ml-auto flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium bg-green-600/15 text-green-400 border border-green-600/25 hover:bg-green-600/25 transition-colors disabled:opacity-50"
                    >
                      {downloadingId === c.id
                        ? <span className="w-2.5 h-2.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                        : <Download size={10} />
                      }
                      PDF
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* ── DESKTOP: tabla ────────────────────────────────── */}
            <div className="hidden md:block ec-card overflow-hidden">
              <table className="ec-table">
                <thead>
                  <tr>
                    <th className={thClass} onClick={() => toggleSort('createdAt')}>
                      <CalendarDays size={12} className="inline mr-1.5" />
                      Fecha
                      <SortIcon col="createdAt" sortKey={sortKey} dir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => toggleSort('totalSemanal')}>
                      Total del corte
                      <SortIcon col="totalSemanal" sortKey={sortKey} dir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => toggleSort('numAbonos')}>
                      <CreditCard size={12} className="inline mr-1.5" />
                      Abonos
                      <SortIcon col="numAbonos" sortKey={sortKey} dir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => toggleSort('numClientes')}>
                      <Users size={12} className="inline mr-1.5" />
                      Clientes
                      <SortIcon col="numClientes" sortKey={sortKey} dir={sortDir} />
                    </th>
                    <th className={thClass} onClick={() => toggleSort('numPrestamos')}>
                      Préstamos
                      <SortIcon col="numPrestamos" sortKey={sortKey} dir={sortDir} />
                    </th>
                    <th>Descripción</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c: Corte, i) => (
                    <tr key={c.id} className="animate-fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                      <td>
                        <div>
                          <p className="font-medium text-slate-200">{fmt.date(c.fechaCorte)}</p>
                          <p className="text-xs text-slate-500">{fmt.datetime(c.createdAt)}</p>
                        </div>
                      </td>
                      <td>
                        <span className="font-mono font-medium text-green-400 text-base">
                          {fmt.money(c.totalSemanal)}
                        </span>
                      </td>
                      <td>
                        <span className="font-mono text-slate-300">{c.numAbonos}</span>
                      </td>
                      <td>
                        <span className="font-mono text-slate-400">{c.numClientes ?? '—'}</span>
                      </td>
                      <td>
                        <span className="font-mono text-slate-400">{c.numPrestamos ?? '—'}</span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500 italic">
                          {c.descripcion ?? '—'}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => descargarPDF(c)}
                          disabled={downloadingId === c.id}
                          title="Descargar reporte PDF"
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-green-600/15 text-green-400 border border-green-600/25 hover:bg-green-600/25 transition-colors disabled:opacity-50"
                        >
                          {downloadingId === c.id
                            ? <span className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                            : <Download size={12} />
                          }
                          PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title="Realizar corte semanal" size="sm">
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-green-600/10 border border-green-600/20 text-center">
            <p className="text-xs text-slate-500 mb-1">Monto a cerrar</p>
            <p className="text-3xl font-display font-bold text-green-400">
              {semanal ? fmt.money(semanal.totalSemanal) : '—'}
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Los abonos naranja pasarán a verde · el acumulado se reinicia a $0
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Descripción (opcional)
            </label>
            <input
              className="ec-input"
              placeholder="Ej. Corte semana 7-12 Abr"
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => setModal(false)}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={realizarCorte.isPending}
              onClick={handleCorte}
            >
              <Scissors size={14} />
              Confirmar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
