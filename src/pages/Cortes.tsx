import { useState, useMemo } from 'react'
import { Scissors, CalendarDays, Users, CreditCard, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react'
import { useCortes, useRealizarCorte, useTotalSemanal } from '@/hooks'
import { Button, Modal } from '@/components/ui'
import { fmt } from '@/utils/format'
import { useAuth } from '@/context/AuthContext'
import type { Corte } from '@/types'

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
      <div className="grid grid-cols-3 gap-4">
        <div className="ec-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Cortes realizados</p>
          <p className="text-2xl font-display font-bold">{cortes.length}</p>
        </div>
        <div className="ec-card p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-2">Total histórico cortado</p>
          <p className="text-2xl font-display font-bold text-green-400">{fmt.money(totalHistorico)}</p>
        </div>
        <div className="ec-card p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-1">Pendiente de corte</p>
            <p className="text-2xl font-display font-bold text-orange-400">
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
        <div className="ec-card overflow-hidden">
          {isLoading ? (
            <div className="p-10 text-center text-slate-500 text-sm">Cargando…</div>
          ) : cortes.length === 0 ? (
            <div className="p-10 text-center">
              <Scissors size={24} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 text-sm">No hay cortes realizados aún</p>
              <p className="text-slate-600 text-xs mt-1">El primer corte aparecerá aquí</p>
            </div>
          ) : (
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
