import { useState, useRef, useEffect } from 'react'
import { UserPlus, ShieldCheck, User, Power, Eye, EyeOff, CreditCard, Pencil, Search, X } from 'lucide-react'
import { useUsuarios, useCrearUsuario, useToggleUsuario, useEditarUsuario, useClientes } from '@/hooks'
import { Button, Modal } from '@/components/ui'
import { fmt } from '@/utils/format'
import type { Cliente, Rol, Usuario } from '@/types'

const ROL_LABELS: Record<Rol, string> = { ADMIN: 'Administrador', OPERADOR: 'Operador', CLIENTE: 'Cliente' }

const EMPTY_CREATE = { username: '', password: '', nombre: '', rol: 'OPERADOR' as Rol, clienteId: '' }
const EMPTY_EDIT   = { nombre: '', rol: 'OPERADOR' as Rol, clienteId: '', password: '' }

export default function Usuarios() {
  const { data: usuarios = [], isLoading } = useUsuarios()
  const { data: clientes = [] }            = useClientes()
  const crear  = useCrearUsuario()
  const editar = useEditarUsuario()
  const toggle = useToggleUsuario()

  // ── Modal crear ──────────────────────────────────────────────────
  const [createModal, setCreateModal] = useState(false)
  const [showPwdCreate, setShowPwdCreate] = useState(false)
  const [createForm, setCreateForm] = useState(EMPTY_CREATE)

  function handleCreate() {
    crear.mutate(
      { ...createForm, clienteId: createForm.clienteId || undefined },
      { onSuccess: () => { setCreateModal(false); setCreateForm(EMPTY_CREATE) } }
    )
  }

  // ── Modal editar ─────────────────────────────────────────────────
  const [editModal, setEditModal]     = useState(false)
  const [showPwdEdit, setShowPwdEdit] = useState(false)
  const [editTarget, setEditTarget]   = useState<Usuario | null>(null)
  const [editForm, setEditForm]       = useState(EMPTY_EDIT)

  function openEdit(u: Usuario) {
    setEditTarget(u)
    setEditForm({ nombre: u.nombre, rol: u.rol, clienteId: u.clienteId ?? '', password: '' })
    setShowPwdEdit(false)
    setEditModal(true)
  }

  function handleEdit() {
    if (!editTarget) return
    editar.mutate(
      {
        id: editTarget.id,
        data: {
          nombre:    editForm.nombre || undefined,
          rol:       editForm.rol,
          clienteId: editForm.clienteId || undefined,
          password:  editForm.password  || undefined,
        },
      },
      { onSuccess: () => { setEditModal(false); setEditTarget(null) } }
    )
  }

  const admins     = usuarios.filter((u: Usuario) => u.rol === 'ADMIN')
  const operadores = usuarios.filter((u: Usuario) => u.rol === 'OPERADOR')
  const clts       = usuarios.filter((u: Usuario) => u.rol === 'CLIENTE')

  return (
    <div className="space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-slate-500 mt-0.5">
            {admins.length} administrador{admins.length !== 1 ? 'es' : ''} ·{' '}
            {operadores.length} operador{operadores.length !== 1 ? 'es' : ''} ·{' '}
            {clts.length} cliente{clts.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="primary" size="md" onClick={() => setCreateModal(true)}>
          <UserPlus size={14} />
          Nuevo usuario
        </Button>
      </div>

      {/* Tabla */}
      <div className="ec-card overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-slate-500 text-sm">Cargando…</div>
        ) : usuarios.length === 0 ? (
          <div className="p-10 text-center text-slate-500 text-sm">No hay usuarios</div>
        ) : (
          <table className="ec-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u: Usuario) => (
                <tr key={u.id} className={!u.activo ? 'opacity-50' : ''}>
                  <td>
                    <div className="flex items-center gap-2">
                      {u.rol === 'ADMIN'
                        ? <ShieldCheck size={14} className="text-green-400 shrink-0" />
                        : u.rol === 'CLIENTE'
                          ? <CreditCard size={14} className="text-purple-400 shrink-0" />
                          : <User size={14} className="text-slate-500 shrink-0" />
                      }
                      <span className="font-mono text-sm text-slate-200">{u.username}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-slate-300">{u.nombre}</span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                      u.rol === 'ADMIN'
                        ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                        : u.rol === 'CLIENTE'
                          ? 'bg-purple-600/20 text-purple-400 border border-purple-600/30'
                          : 'bg-navy-700 text-slate-400 border border-white/10'
                    }`}>
                      {ROL_LABELS[u.rol]}
                    </span>
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                      u.activo
                        ? 'bg-green-600/10 text-green-400'
                        : 'bg-red-500/10 text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${u.activo ? 'bg-green-400' : 'bg-red-400'}`} />
                      {u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-500">{fmt.date(u.createdAt)}</span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEdit(u)}
                        title="Editar usuario"
                        className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => toggle.mutate(u.id)}
                        title={u.activo ? 'Desactivar' : 'Activar'}
                        className={`p-1.5 rounded-lg transition-colors ${
                          u.activo
                            ? 'text-slate-500 hover:text-red-400 hover:bg-red-500/10'
                            : 'text-slate-600 hover:text-green-400 hover:bg-green-500/10'
                        }`}
                      >
                        <Power size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear */}
      <Modal
        open={createModal}
        onClose={() => { setCreateModal(false); setCreateForm(EMPTY_CREATE) }}
        title="Nuevo usuario"
        size="sm"
      >
        <div className="space-y-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nombre completo</label>
            <input
              className="ec-input"
              placeholder="Nombre del usuario"
              value={createForm.nombre}
              onChange={e => setCreateForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Username</label>
            <input
              className="ec-input font-mono"
              placeholder="usuario123"
              autoComplete="off"
              value={createForm.username}
              onChange={e => setCreateForm(f => ({ ...f, username: e.target.value.toLowerCase().trim() }))}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Contraseña</label>
            <div className="relative">
              <input
                className="ec-input pr-10"
                type={showPwdCreate ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={createForm.password}
                onChange={e => setCreateForm(f => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPwdCreate(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwdCreate ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <RolSelector value={createForm.rol} onChange={rol => setCreateForm(f => ({ ...f, rol, clienteId: '' }))} />

          {createForm.rol === 'CLIENTE' && (
            <ClienteSelector
              clientes={clientes}
              value={createForm.clienteId}
              onChange={clienteId => setCreateForm(f => ({ ...f, clienteId }))}
            />
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => { setCreateModal(false); setCreateForm(EMPTY_CREATE) }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={crear.isPending}
              disabled={
                !createForm.username || !createForm.password || !createForm.nombre ||
                createForm.password.length < 6 ||
                (createForm.rol === 'CLIENTE' && !createForm.clienteId)
              }
              onClick={handleCreate}
            >
              <UserPlus size={14} />
              Crear usuario
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal editar */}
      <Modal
        open={editModal}
        onClose={() => { setEditModal(false); setEditTarget(null) }}
        title={`Editar · ${editTarget?.username ?? ''}`}
        size="sm"
      >
        <div className="space-y-4">

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Nombre completo</label>
            <input
              className="ec-input"
              placeholder="Nombre del usuario"
              value={editForm.nombre}
              onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>

          <RolSelector value={editForm.rol} onChange={rol => setEditForm(f => ({ ...f, rol, clienteId: '' }))} />

          {editForm.rol === 'CLIENTE' && (
            <ClienteSelector
              clientes={clientes}
              value={editForm.clienteId}
              onChange={clienteId => setEditForm(f => ({ ...f, clienteId }))}
            />
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
              Nueva contraseña
              <span className="ml-2 normal-case text-slate-600 font-normal">(dejar vacío para no cambiar)</span>
            </label>
            <div className="relative">
              <input
                className="ec-input pr-10"
                type={showPwdEdit ? 'text' : 'password'}
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={editForm.password}
                onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setShowPwdEdit(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPwdEdit ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="ghost" className="flex-1" onClick={() => { setEditModal(false); setEditTarget(null) }}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              className="flex-1"
              loading={editar.isPending}
              disabled={
                !editForm.nombre ||
                (editForm.password !== '' && editForm.password.length < 6) ||
                (editForm.rol === 'CLIENTE' && !editForm.clienteId)
              }
              onClick={handleEdit}
            >
              <Pencil size={14} />
              Guardar cambios
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ── Sub-componentes reutilizables ────────────────────────────────────

function RolSelector({ value, onChange }: { value: Rol; onChange: (r: Rol) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">Rol</label>
      <div className="grid grid-cols-3 gap-2">
        {(['OPERADOR', 'ADMIN', 'CLIENTE'] as Rol[]).map(rol => (
          <button
            key={rol}
            type="button"
            onClick={() => onChange(rol)}
            className={`flex flex-col items-center gap-1.5 px-2 py-2.5 rounded-xl border text-xs font-medium transition-all ${
              value === rol
                ? rol === 'ADMIN'
                  ? 'bg-green-600/20 border-green-600/50 text-green-400'
                  : rol === 'CLIENTE'
                    ? 'bg-purple-600/20 border-purple-600/50 text-purple-400'
                    : 'bg-blue-600/20 border-blue-600/50 text-blue-400'
                : 'bg-navy-700/50 border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            {rol === 'ADMIN'
              ? <ShieldCheck size={15} />
              : rol === 'CLIENTE'
                ? <CreditCard size={15} />
                : <User size={15} />
            }
            {ROL_LABELS[rol]}
          </button>
        ))}
      </div>
    </div>
  )
}

function ClienteSelector({ clientes, value, onChange }: {
  clientes: Cliente[]
  value: string
  onChange: (id: string) => void
}) {
  const selected   = clientes.find(c => c.id === value) ?? null
  const [query, setQuery]     = useState('')
  const [open, setOpen]       = useState(false)
  const containerRef           = useRef<HTMLDivElement>(null)

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = clientes.filter(c => {
    const q = query.toLowerCase()
    return c.nombre.toLowerCase().includes(q) || c.numero.toLowerCase().includes(q)
  })

  function select(c: Cliente) {
    onChange(c.id)
    setOpen(false)
    setQuery('')
  }

  function clear() {
    onChange('')
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        Cliente asociado
      </label>

      {/* Campo de búsqueda / seleccionado */}
      <div className="relative">
        {selected && !open ? (
          // Muestra el cliente seleccionado
          <div className="ec-input flex items-center justify-between gap-2">
            <span className="text-slate-200 text-sm truncate">
              <span className="font-mono text-slate-500 mr-1.5">{selected.numero}</span>
              {selected.nombre}
            </span>
            <button
              type="button"
              onClick={clear}
              className="shrink-0 text-slate-500 hover:text-red-400 transition-colors"
            >
              <X size={13} />
            </button>
          </div>
        ) : (
          <div className="relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
            <input
              className="ec-input pl-8"
              placeholder="Buscar por nombre o número…"
              value={query}
              autoComplete="off"
              onFocus={() => setOpen(true)}
              onChange={e => { setQuery(e.target.value); setOpen(true) }}
            />
          </div>
        )}

        {/* Dropdown */}
        {open && (
          <div className="absolute z-50 top-full mt-1 w-full rounded-xl border border-white/10 bg-navy-900 shadow-xl overflow-hidden max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-slate-500">Sin resultados</p>
            ) : (
              filtered.map(c => (
                <button
                  key={c.id}
                  type="button"
                  onMouseDown={() => select(c)}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-navy-800 transition-colors flex items-center gap-2"
                >
                  <span className="font-mono text-[11px] text-slate-500 shrink-0">{c.numero}</span>
                  <span className="text-slate-200 truncate">{c.nombre}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
