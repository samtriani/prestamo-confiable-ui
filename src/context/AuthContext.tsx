import { createContext, useContext, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import type { AuthUser, LoginRequest } from '@/types'
import { authApi } from '@/api/auth'
import client from '@/api/client'

const TOKEN_KEY = 'ec_token'
const USER_KEY  = 'ec_user'

interface AuthContextValue {
  user:    AuthUser | null
  login:   (data: LoginRequest) => Promise<void>
  logout:  () => void
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const stored = localStorage.getItem(USER_KEY)
      const token  = localStorage.getItem(TOKEN_KEY)
      // Set header synchronously so React Query can use it before any effects run
      if (token) {
        client.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const login = useCallback(async (data: LoginRequest) => {
    const res = await authApi.login(data)
    localStorage.setItem(TOKEN_KEY, res.token)
    localStorage.setItem(USER_KEY, JSON.stringify({
      username:  res.username,
      nombre:    res.nombre,
      rol:       res.rol,
      clienteId: res.clienteId,
    }))
    client.defaults.headers.common['Authorization'] = `Bearer ${res.token}`
    setUser({ username: res.username, nombre: res.nombre, rol: res.rol, clienteId: res.clienteId })
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    delete client.defaults.headers.common['Authorization']
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin: user?.rol === 'ADMIN' }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
