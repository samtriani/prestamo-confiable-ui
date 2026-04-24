import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientesApi, pagosApi, abonosApi, cortesApi, dashboardApi, usuariosApi, cobranzaApi, reportesApi } from '@/api'
import type { ClienteRequest, UpdateClienteRequest, AbonoRequest, CorteRequest, CreateUsuarioRequest, UpdateUsuarioRequest } from '@/types'
import { toast } from '@/utils/toast'

// ── Keys ──────────────────────────────────────────────────────────
// ── Usuarios ───────────────────────────────────────────────────────
export function useUsuarios() {
  return useQuery({ queryKey: ['usuarios'], queryFn: usuariosApi.getAll })
}

export function useCrearUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateUsuarioRequest) => usuariosApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuario creado exitosamente')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useEditarUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUsuarioRequest }) =>
      usuariosApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuario actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useToggleUsuario() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => usuariosApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['usuarios'] }),
    onError: (e: Error) => toast.error(e.message),
  })
}

export const qk = {
  dashboard:          ['dashboard'],
  clientes:           ['clientes'],
  cliente:       (id: string) => ['clientes', id],
  historial:     (id: string) => ['historial', id],
  prestamosActivos:   ['prestamos', 'activos'],
  pagos:         (prestamoId: string) => ['pagos', prestamoId],
  abonosPago:    (pagoId: string) => ['abonos', 'pago', pagoId],
  abonosPendientes:   ['abonos', 'pendientes'],
  totalSemanal:       ['abonos', 'total-semanal'],
  cortes:             ['cortes'],
}

// ── Dashboard ──────────────────────────────────────────────────────
export function useDashboard() {
  return useQuery({
    queryKey: qk.dashboard,
    queryFn: dashboardApi.get,
    refetchInterval: 60_000,
  })
}

// ── Clientes ───────────────────────────────────────────────────────
export function useClientes() {
  return useQuery({
    queryKey: qk.clientes,
    queryFn:  clientesApi.getAll,
  })
}

export function useCliente(id: string) {
  return useQuery({
    queryKey: qk.cliente(id),
    queryFn:  () => clientesApi.getById(id),
    enabled:  !!id,
  })
}

export function useHistorialCliente(clienteId: string) {
  return useQuery({
    queryKey: qk.historial(clienteId),
    queryFn:  () => clientesApi.getHistorial(clienteId),
    enabled:  !!clienteId,
  })
}

export function usePrestamosActivos() {
  return useQuery({
    queryKey: qk.prestamosActivos,
    queryFn:  clientesApi.getPrestamosActivos,
  })
}

export function useAltaCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ClienteRequest) => clientesApi.alta(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.clientes })
      qc.invalidateQueries({ queryKey: qk.prestamosActivos })
      qc.invalidateQueries({ queryKey: qk.dashboard })
      toast.success('Cliente registrado exitosamente')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useEditarCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateClienteRequest }) =>
      clientesApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: qk.cliente(id) })
      qc.invalidateQueries({ queryKey: qk.clientes })
      qc.invalidateQueries({ queryKey: qk.prestamosActivos })
      toast.success('Cliente actualizado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

export function useNuevoPrestamo(clienteId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: ClienteRequest) => clientesApi.nuevoPrestamo(clienteId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.historial(clienteId) })
      qc.invalidateQueries({ queryKey: qk.prestamosActivos })
      qc.invalidateQueries({ queryKey: qk.dashboard })
      toast.success('Préstamo generado exitosamente')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Pagos ──────────────────────────────────────────────────────────
export function usePagosPrestamo(prestamoId: string) {
  return useQuery({
    queryKey: qk.pagos(prestamoId),
    queryFn:  () => pagosApi.getByPrestamo(prestamoId),
    enabled:  !!prestamoId,
  })
}

// ── Abonos ─────────────────────────────────────────────────────────
export function useAbonosPago(pagoId: string) {
  return useQuery({
    queryKey: qk.abonosPago(pagoId),
    queryFn:  () => abonosApi.getByPago(pagoId),
    enabled:  !!pagoId,
  })
}

export function useAbonosPendientes() {
  return useQuery({
    queryKey: qk.abonosPendientes,
    queryFn:  abonosApi.getPendientes,
  })
}

export function useTotalSemanal() {
  return useQuery({
    queryKey: qk.totalSemanal,
    queryFn:  abonosApi.getTotalSemanal,
    refetchInterval: 30_000,
  })
}

export function useRegistrarAbono(prestamoId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AbonoRequest) => abonosApi.registrar(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: qk.pagos(prestamoId) })
      qc.invalidateQueries({ queryKey: qk.abonosPago(vars.pagoId) })
      qc.invalidateQueries({ queryKey: qk.abonosPendientes })
      qc.invalidateQueries({ queryKey: qk.totalSemanal })
      qc.invalidateQueries({ queryKey: qk.dashboard })
      qc.invalidateQueries({ queryKey: qk.prestamosActivos })
      // Invalida todos los historiales para que pagosCubiertos y montos se actualicen
      qc.invalidateQueries({ queryKey: ['historial'] })
      toast.success('Abono registrado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Cobranza ───────────────────────────────────────────────────────
export function useCobranza() {
  return useQuery({
    queryKey: ['cobranza'],
    queryFn:  cobranzaApi.getSemana,
    refetchInterval: 60_000,
  })
}

export function useRegistrarAbonoCobranza() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: AbonoRequest) => abonosApi.registrar(data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['cobranza'] })
      qc.invalidateQueries({ queryKey: qk.abonosPago(vars.pagoId) })
      qc.invalidateQueries({ queryKey: qk.totalSemanal })
      qc.invalidateQueries({ queryKey: qk.dashboard })
      qc.invalidateQueries({ queryKey: qk.prestamosActivos })
      qc.invalidateQueries({ queryKey: ['historial'] })
      toast.success('Pago registrado')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

// ── Reportes ───────────────────────────────────────────────────────
export function useReporte() {
  return useQuery({
    queryKey: ['reporte'],
    queryFn:  reportesApi.get,
    staleTime: 5 * 60_000,
  })
}

// ── Cortes ─────────────────────────────────────────────────────────
export function useCortes() {
  return useQuery({
    queryKey: qk.cortes,
    queryFn:  cortesApi.getHistorico,
  })
}

export function useRealizarCorte() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data?: CorteRequest) => cortesApi.realizar(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.cortes })
      qc.invalidateQueries({ queryKey: qk.totalSemanal })
      qc.invalidateQueries({ queryKey: qk.abonosPendientes })
      qc.invalidateQueries({ queryKey: qk.prestamosActivos })
      qc.invalidateQueries({ queryKey: qk.dashboard })
      toast.success('Corte realizado exitosamente')
    },
    onError: (e: Error) => toast.error(e.message),
  })
}
