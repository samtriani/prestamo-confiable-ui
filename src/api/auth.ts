import client from './client'
import type { LoginRequest, LoginResponse, PrestamoResumen, Pago } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<LoginResponse>('/auth/login', data).then(r => r.data),

  miCredito: () =>
    client.get<PrestamoResumen>('/auth/mi-credito').then(r => r.data),

  // Corrida real de pagos del cliente, con el desglose de abonos incluido.
  miCreditoPagos: () =>
    client.get<Pago[]>('/auth/mi-credito/pagos').then(r => r.data),
}
