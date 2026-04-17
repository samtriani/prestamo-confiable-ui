import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, ChevronRight, CheckCircle2, AlertCircle, TrendingUp } from 'lucide-react'
import { useClientes, usePrestamosActivos } from '@/hooks'
import { Button } from '@/components/ui'
import { fmt } from '@/utils/format'
import type { Cliente, PrestamoResumen } from '@/types'

type Filtro = 'TODOS' | 'ACTIVO' | 'ATRASADO' | 'LIQUIDADO'

// Estado derivado por cliente
type EstadoCliente = 'ACTIVO' | 'ATRASADO' | 'LIQUIDADO'

function estadoBadge(estado: EstadoCliente) {
  switch (estado) {
    case 'ATRASADO':
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/20 shrink-0">
          <AlertCircle size={9} />
          Atrasado
        </span>
      )
    case 'ACTIVO':
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/20 shrink-0">
          <TrendingUp size={9} />
          Al corriente
        </span>
      )
    case 'LIQUIDADO':
      return (
        <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-600/15 text-green-400 border border-green-600/25 shrink-0">
          <CheckCircle2 size={9} />
          Liquidado
        </span>
      )
  }
}

export default function Clientes() {
  const navigate = useNavigate()
  const { data = [],      isLoading }  = useClientes()
  const { data: activos = [] }         = usePrestamosActivos()
  const [query, setQuery]  = useState('')
  const [filtro, setFiltro] = useState<Filtro>('TODOS')

  // Mapa clienteId → estado de su préstamo activo
  const estadoMap = useMemo(() => {
    const map = new Map<string, EstadoCliente>()
    ;(activos as PrestamoResumen[]).forEach(p => {
      if (!p.clienteId) return
      const id = p.clienteId.toString()
      const atrasado = (p.pagosAtrasados ?? 0) > 0
      // Si ya hay una entrada atrasada, no la sobreescribir
      if (!map.has(id) || atrasado) {
        map.set(id, atrasado ? 'ATRASADO' : 'ACTIVO')
      }
    })
    return map
  }, [activos])

  const getEstado = (c: Cliente): EstadoCliente =>
    estadoMap.get(c.id) ?? 'LIQUIDADO'

  // Aplicar búsqueda
  const byQuery = useMemo(() =>
    data.filter((c: Cliente) =>
      c.nombre.toLowerCase().includes(query.toLowerCase()) ||
      c.numero.toLowerCase().includes(query.toLowerCase()) ||
      (c.telefono ?? '').includes(query)
    ), [data, query])

  // Aplicar filtro de estado
  const filtered = useMemo(() =>
    filtro === 'TODOS'
      ? byQuery
      : byQuery.filter((c: Cliente) => getEstado(c) === filtro),
    [byQuery, filtro, estadoMap] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Conteos para las etiquetas de los filtros
  const counts = useMemo(() => ({
    todos:     byQuery.length,
    activo:    byQuery.filter((c: Cliente) => getEstado(c) === 'ACTIVO').length,
    atrasado:  byQuery.filter((c: Cliente) => getEstado(c) === 'ATRASADO').length,
    liquidado: byQuery.filter((c: Cliente) => getEstado(c) === 'LIQUIDADO').length,
  }), [byQuery, estadoMap]) // eslint-disable-line react-hooks/exhaustive-deps

  const FILTROS: { key: Filtro; label: string }[] = [
    { key: 'TODOS',    label: `Todos (${counts.todos})` },
    { key: 'ACTIVO',   label: `Al corriente (${counts.activo})` },
    { key: 'ATRASADO', label: `Atrasados (${counts.atrasado})` },
    { key: 'LIQUIDADO',label: `Liquidados (${counts.liquidado})` },
  ]

  const FILTRO_STYLE: Record<Filtro, string> = {
    TODOS:     'bg-green-600/20 text-green-400 border-green-600/40',
    ACTIVO:    'bg-blue-600/20 text-blue-400 border-blue-600/40',
    ATRASADO:  'bg-red-600/20 text-red-400 border-red-600/40',
    LIQUIDADO: 'bg-green-600/20 text-green-400 border-green-600/40',
  }

  return (
    <div className="space-y-4 animate-fade-up">

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="ec-input pl-9 w-full"
            placeholder="Buscar por nombre, número o teléfono…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/alta')}>
          <UserPlus size={14} />
          <span className="hidden sm:inline">Nuevo cliente</span>
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              filtro === f.key
                ? FILTRO_STYLE[f.key]
                : 'bg-transparent text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Resultados */}
      {isLoading ? (
        <div className="ec-card p-10 text-center text-slate-500 text-sm">Cargando clientes…</div>
      ) : filtered.length === 0 ? (
        <div className="ec-card p-10 text-center">
          <p className="text-slate-400 text-sm font-medium">Sin resultados</p>
          <p className="text-slate-600 text-xs mt-1">
            {query ? `No se encontró "${query}"` : 'No hay clientes en este filtro'}
          </p>
        </div>
      ) : (
        <>
          {/* ── MOBILE: cards ─────────────────────────────────── */}
          <div className="md:hidden space-y-2">
            {filtered.map((c: Cliente, i) => (
              <div
                key={c.id}
                className="ec-card p-4 flex items-center gap-3 cursor-pointer active:bg-navy-700 transition-colors animate-fade-in"
                style={{ animationDelay: `${i * 25}ms` }}
                onClick={() => navigate(`/clientes/${c.id}`)}
              >
                <div className="w-9 h-9 rounded-full bg-navy-700 border border-white/10 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-slate-300">{fmt.initials(c.nombre)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-100 text-sm truncate">{c.nombre}</p>
                  <p className="text-xs text-slate-500 font-mono">
                    {c.numero}{c.telefono ? ` · ${c.telefono}` : ''}
                  </p>
                </div>
                {estadoBadge(getEstado(c))}
                <ChevronRight size={14} className="text-slate-600 shrink-0" />
              </div>
            ))}
          </div>

          {/* ── DESKTOP: tabla ────────────────────────────────── */}
          <div className="hidden md:block ec-card overflow-hidden">
            <table className="ec-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th>Teléfono</th>
                  <th>Domicilio</th>
                  <th>Registrado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c: Cliente, i) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer animate-fade-in"
                    style={{ animationDelay: `${i * 25}ms` }}
                    onClick={() => navigate(`/clientes/${c.id}`)}
                  >
                    <td>
                      <span className="font-mono text-xs text-green-400 font-medium">{c.numero}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-navy-700 border border-white/10 flex items-center justify-center shrink-0">
                          <span className="text-xs font-semibold text-slate-300">
                            {fmt.initials(c.nombre)}
                          </span>
                        </div>
                        <span className="font-medium text-slate-100">{c.nombre}</span>
                      </div>
                    </td>
                    <td>{estadoBadge(getEstado(c))}</td>
                    <td>
                      <span className="font-mono text-xs text-slate-400">{c.telefono ?? '—'}</span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500 truncate max-w-[200px] block">
                        {c.domicilio ?? '—'}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs text-slate-500">{fmt.date(c.createdAt)}</span>
                    </td>
                    <td>
                      <ChevronRight size={14} className="text-slate-600" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-xs text-slate-600 text-right">
          {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          {filtro !== 'TODOS' && ` · filtro: ${FILTROS.find(f => f.key === filtro)?.label}`}
        </p>
      )}
    </div>
  )
}
