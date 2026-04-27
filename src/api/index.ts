import client from './client'
import type { Cliente, ClienteRequest, UpdateClienteRequest, PrestamoResumen, Pago, EstadoPago, Abono, AbonoRequest, Corte, CorteRequest, DashboardData } from '@/types'

export const clientesApi = {
  getAll: () =>
    client.get<Cliente[]>('/clientes').then(r => r.data),

  getById: (id: string) =>
    client.get<Cliente>(`/clientes/${id}`).then(r => r.data),

  getHistorial: (clienteId: string) =>
    client.get<PrestamoResumen[]>(`/clientes/${clienteId}/historial`).then(r => r.data),

  getPrestamosActivos: () =>
    client.get<PrestamoResumen[]>('/clientes/prestamos/activos').then(r => r.data),

  alta: (data: ClienteRequest) =>
    client.post<Cliente>('/clientes', data).then(r => r.data),

  update: (id: string, data: UpdateClienteRequest) =>
    client.put<Cliente>(`/clientes/${id}`, data).then(r => r.data),

  nuevoPrestamo: (clienteId: string, data: ClienteRequest) =>
    client.post<Cliente>(`/clientes/${clienteId}/prestamos`, data).then(r => r.data),
}

export const pagosApi = {
  getByPrestamo: (prestamoId: string) =>
    client.get<Pago[]>(`/pagos/prestamo/${prestamoId}`).then(r => r.data),

  getById: (id: string) =>
    client.get<Pago>(`/pagos/${id}`).then(r => r.data),

  getByEstado: (estado: EstadoPago) =>
    client.get<Pago[]>(`/pagos/estado/${estado}`).then(r => r.data),
}

export const abonosApi = {
  registrar: (data: AbonoRequest) =>
    client.post<Abono>('/abonos', data).then(r => r.data),

  getByPago: (pagoId: string) =>
    client.get<Abono[]>(`/abonos/pago/${pagoId}`).then(r => r.data),

  getPendientes: () =>
    client.get<Abono[]>('/abonos/pendientes').then(r => r.data),

  getTotalSemanal: () =>
    client.get<{ totalSemanal: number }>('/abonos/total-semanal').then(r => r.data),
}

export const cortesApi = {
  realizar: (data?: CorteRequest) =>
    client.post<Corte>('/cortes', data ?? {}).then(r => r.data),

  getHistorico: () =>
    client.get<Corte[]>('/cortes').then(r => r.data),

  getById: (id: string) =>
    client.get<Corte>(`/cortes/${id}`).then(r => r.data),

  getAbonos: (id: string) =>
    client.get<import('@/types').CorteAbonoItem[]>(`/cortes/${id}/abonos`).then(r => r.data),
}

export const usuariosApi = {
  getAll: () =>
    client.get<import('@/types').Usuario[]>('/usuarios').then(r => r.data),

  create: (data: import('@/types').CreateUsuarioRequest) =>
    client.post<import('@/types').Usuario>('/usuarios', data).then(r => r.data),

  update: (id: string, data: import('@/types').UpdateUsuarioRequest) =>
    client.put<import('@/types').Usuario>(`/usuarios/${id}`, data).then(r => r.data),

  toggle: (id: string) =>
    client.patch<import('@/types').Usuario>(`/usuarios/${id}/toggle`).then(r => r.data),
}

export const dashboardApi = {
  get: () =>
    client.get<DashboardData>('/dashboard').then(r => r.data),
}

export const reportesApi = {
  get: () =>
    client.get<import('@/types').ReporteData>('/reportes').then(r => r.data),
}

export const cobranzaApi = {
  getSemana: () =>
    client.get<import('@/types').CobranzaItem[]>('/cobranza/semana').then(r => r.data),
}
