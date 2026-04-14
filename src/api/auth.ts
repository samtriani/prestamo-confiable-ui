import client from './client'
import type { LoginRequest, LoginResponse, PrestamoResumen } from '@/types'

export const authApi = {
  login: (data: LoginRequest) =>
    client.post<LoginResponse>('/auth/login', data).then(r => r.data),

  miCredito: () =>
    client.get<PrestamoResumen>('/auth/mi-credito').then(r => r.data),
}
