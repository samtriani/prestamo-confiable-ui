import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15_000,
})

client.interceptors.response.use(
  res => res,
  err => {
    const msg =
      err.response?.data?.message ??
      err.response?.data?.error ??
      err.message ??
      'Error desconocido'
    return Promise.reject(new Error(msg))
  }
)

export default client
