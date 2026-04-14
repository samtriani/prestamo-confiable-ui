import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, UserPlus, ChevronRight } from 'lucide-react'
import { useClientes } from '@/hooks'
import { Button } from '@/components/ui'
import { fmt } from '@/utils/format'
import type { Cliente } from '@/types'

export default function Clientes() {
  const navigate            = useNavigate()
  const { data = [], isLoading } = useClientes()
  const [query, setQuery]   = useState('')

  const filtered = data.filter((c: Cliente) =>
    c.nombre.toLowerCase().includes(query.toLowerCase()) ||
    c.numero.toLowerCase().includes(query.toLowerCase()) ||
    (c.telefono ?? '').includes(query)
  )

  return (
    <div className="space-y-5 animate-fade-up">

      {/* Toolbar */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            className="ec-input pl-9"
            placeholder="Buscar por nombre, número o teléfono…"
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
        <Button variant="primary" size="md" onClick={() => navigate('/alta')}>
          <UserPlus size={14} />
          Nuevo cliente
        </Button>
      </div>

      {/* Resultados */}
      <div className="ec-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Cargando clientes…</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-slate-400 text-sm font-medium">Sin resultados</p>
            <p className="text-slate-600 text-xs mt-1">
              {query ? `No se encontró "${query}"` : 'No hay clientes registrados aún'}
            </p>
          </div>
        ) : (
          <table className="ec-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Cliente</th>
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
        )}
      </div>

      {/* Footer count */}
      {filtered.length > 0 && (
        <p className="text-xs text-slate-600 text-right">
          {filtered.length} cliente{filtered.length !== 1 ? 's' : ''}
          {query && ` · filtrado de ${data.length}`}
        </p>
      )}
    </div>
  )
}
