import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { AppLayout } from '@/components/layout'
import Login         from '@/pages/Login'
import Dashboard     from '@/pages/Dashboard'
import Clientes      from '@/pages/Clientes'
import DetalleCliente from '@/pages/DetalleCliente'
import AltaCliente   from '@/pages/AltaCliente'
import ControlPagos  from '@/pages/ControlPagos'
import Cortes        from '@/pages/Cortes'
import Usuarios        from '@/pages/Usuarios'
import MiCredito       from '@/pages/MiCredito'
import CobranzaSemanal from '@/pages/CobranzaSemanal'
import Reportes        from '@/pages/Reportes'

const qc = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  30_000,
      retry:      1,
      refetchOnWindowFocus: false,
    },
  },
})

function ProtectedApp() {
  const { user } = useAuth()

  if (!user) return <Login />
  if (user.rol === 'CLIENTE') return <MiCredito />

  return (
    <AppLayout>
      <Routes>
        <Route path="/"              element={<Dashboard />}      />
        <Route path="/clientes"      element={<Clientes />}       />
        <Route path="/clientes/:id"  element={<DetalleCliente />} />
        <Route path="/alta"          element={<AltaCliente />}    />
        <Route path="/control"       element={<ControlPagos />}   />
        <Route path="/cortes"        element={<Cortes />}         />
        <Route path="/cobranza"      element={<CobranzaSemanal />} />
        <Route path="/usuarios"      element={<Usuarios />}       />
        <Route path="/reportes"      element={<Reportes />}       />
        <Route path="*"              element={<Navigate to="/" />} />
      </Routes>
    </AppLayout>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <BrowserRouter>
        <AuthProvider>
          <ProtectedApp />
        </AuthProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
