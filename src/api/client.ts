import axios from 'axios'

const TOKEN_KEY = 'ec_token'
const USER_KEY  = 'ec_user'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,   // 30 s — da tiempo al cold-start de Fly.io
})

client.interceptors.response.use(
  res => res,
  err => {
    // Token expirado o inválido → limpiar sesión y mandar al login
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      delete client.defaults.headers.common['Authorization']
      window.location.href = '/login'
      return Promise.reject(new Error('Sesión expirada. Inicia sesión de nuevo.'))
    }

    const msg =
      err.response?.data?.message ??
      err.response?.data?.error ??
      err.message ??
      'Error desconocido'
    return Promise.reject(new Error(msg))
  }
)

export default client
