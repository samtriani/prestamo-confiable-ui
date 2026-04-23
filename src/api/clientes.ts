import client from './client'
import type { Cliente, ClienteRequest, UpdateClienteRequest, Prestamo, PrestamoResumen } from '@/types'

export const clientesApi = {
  getAll: () =>
    client.get<Cliente[]>('/clientes').then(r => r.data),

  getById: (id: string) =>
    client.get<Cliente>(`/clientes/${id}`).then(r => r.data),

  getByNumero: (numero: string) =>
    client.get<Cliente>(`/clientes/numero/${numero}`).then(r => r.data),

  alta: (data: ClienteRequest) =>
    client.post<Cliente>('/clientes', data).then(r => r.data),

  update: (id: string, data: UpdateClienteRequest) =>
    client.put<Cliente>(`/clientes/${id}`, data).then(r => r.data),

  nuevoPrestamo: (clienteId: string, data: ClienteRequest) =>
    client.post<Prestamo>(`/clientes/${clienteId}/prestamos`, data).then(r => r.data),

  getHistorial: (clienteId: string) =>
    client.get<PrestamoResumen[]>(`/clientes/${clienteId}/historial`).then(r => r.data),

  getPrestamosActivos: () =>
    client.get<PrestamoResumen[]>('/clientes/prestamos/activos').then(r => r.data),
}
