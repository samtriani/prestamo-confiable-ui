// ── Enums ─────────────────────────────────────────────────────────
export type EstadoPago =
  | 'PENDIENTE'
  | 'PROXIMO'
  | 'ABONO_PARCIAL'
  | 'PAGADO_SIN_CORTE'
  | 'PAGADO'
  | 'ATRASADO'

// ── Entidades ──────────────────────────────────────────────────────
export interface Cliente {
  id:        string
  numero:    string   // PC-001
  nombre:    string
  telefono:  string | null
  domicilio: string | null
  createdAt: string
  updatedAt: string
}

export interface Prestamo {
  id:              string
  clienteId:       string
  numero:          string   // PR-001
  monto:           number
  pagoSemanal:     number
  fechaInicio:     string
  fechaPrimerPago: string
  activo:          boolean
  createdAt:       string
  updatedAt:       string
  // enriquecido desde vista
  clienteNombre?:  string
  clienteNumero?:  string
  clienteTelefono?: string
}

export interface Pago {
  id:               string
  prestamoId:       string
  numeroPago:       number   // 1-14
  fechaProgramada:  string
  montoProgramado:  number
  estado:           EstadoPago
  createdAt:        string
  updatedAt:        string
  // calculado en el backend (PagoService) a partir de los abonos del pago
  totalAbonado?:    number
  saldoPendiente?:  number
  numAbonos?:       number
  /** El pago se cubrió en varias exhibiciones o sigue incompleto. */
  tieneAbonoParcial?:   boolean
  tienePendienteCorte?: boolean
  /** Desglose abono por abono. Solo lo manda /auth/mi-credito/pagos. */
  abonos?:          Abono[]
}

export interface Abono {
  id:          string
  pagoId:      string
  // La API omite los nulos (default-property-inclusion: non_null), así que
  // un abono sin corte llega sin la propiedad, no con null.
  corteId?:    string
  montoAbono:  number
  fechaAbono:  string
  createdAt:   string
  /** false = pendiente de corte (naranja). */
  enCorte:     boolean
}

export interface Corte {
  id:           string
  fechaCorte:   string
  totalSemanal: number
  numAbonos:    number
  descripcion:  string | null
  createdAt:    string
  // enriquecido desde vista
  numClientes?:  number
  numPrestamos?: number
}

// ── Dashboard ──────────────────────────────────────────────────────
export interface DashboardData {
  totalClientes:           number
  prestamosActivos:        number
  totalPrestadoHistorico:  number
  totalRecuperado:         number
  totalSemanalActual:      number
  pagosAtrasados:          number
  abonosPendientesCorte:   number
}

// ── Vistas enriquecidas ────────────────────────────────────────────
export interface PrestamoResumen extends Prestamo {
  totalPagos:      number
  pagosCubiertos:  number
  pagosSinCorte:   number
  /** Pagos con abonos que no alcanzan el monto programado. */
  pagosParciales:  number
  pagosAtrasados:  number
  totalAbonado:    number
  saldoPendiente:  number
  semanalSinCorte: number
  totalARecuperar: number
}

export interface ClienteHistorial extends Cliente {
  prestamos: PrestamoResumen[]
}

// ── Auth ──────────────────────────────────────────────────────────
export type Rol = 'ADMIN' | 'OPERADOR' | 'CLIENTE'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  token:     string
  username:  string
  nombre:    string
  rol:       Rol
  clienteId?: string
}

export interface AuthUser {
  username:  string
  nombre:    string
  rol:       Rol
  clienteId?: string
}

// ── Usuarios ──────────────────────────────────────────────────────
export interface Usuario {
  id:         string
  username:   string
  nombre:     string
  rol:        Rol
  activo:     boolean
  clienteId?: string
  createdAt:  string
}

export interface CreateUsuarioRequest {
  username:   string
  password:   string
  nombre:     string
  rol:        Rol
  clienteId?: string
}

export interface UpdateUsuarioRequest {
  nombre?:    string
  rol?:       Rol
  password?:  string
  clienteId?: string
}

// ── Cobranza ──────────────────────────────────────────────────────
export interface CobranzaItem {
  pagoId:          string
  numeroPago:      number
  fechaProgramada: string
  montoProgramado: number
  estado:          'PROXIMO' | 'ATRASADO'
  diasVencido:     number
  // abonos parciales ya registrados sobre este pago
  totalAbonado:    number
  saldoPendiente:  number
  numAbonos:       number
  prestamoId:      string
  prestamoNumero:  string
  clienteId:       string
  clienteNumero:   string
  clienteNombre:   string
  clienteTelefono: string | null
}

// ── Requests ───────────────────────────────────────────────────────
export interface ClienteRequest {
  nombre:          string
  telefono:        string
  domicilio:       string
  monto:           number
  fechaInicio:     string
  fechaPrimerPago: string
}

export interface UpdateClienteRequest {
  telefono?:  string
  domicilio?: string
}

// ── Reportes ──────────────────────────────────────────────────────
export interface MesDato {
  mes:      string   // "2024-01"
  monto:    number
  cantidad: number
}

export interface TopDeudor {
  clienteNumero:  string
  clienteNombre:  string
  saldoPendiente: number
  totalAbonado:   number
  pagosAtrasados: number
}

export interface ReporteData {
  totalPrestado:        number
  totalRecuperado:      number
  gananciaNeta:         number
  pendienteSiLiquidan:  number
  proyeccionGanancia:   number
  prestamosActivos:     number
  prestamosAtrasados:   number
  prestamosAlCorriente: number
  totalClientes:        number
  prestamosPorMes:      MesDato[]
  abonosPorMes:         MesDato[]
  topSaldos:            TopDeudor[]
}

export interface AbonoRequest {
  pagoId:      string
  montoAbono:  number
  fechaAbono?: string
}

export interface CorteRequest {
  fechaCorte?:  string
  descripcion?: string
}

export interface CorteAbonoItem {
  clienteNumero:  string
  clienteNombre:  string
  clienteTelefono: string | null
  prestamoNumero: string
  prestaMonto:    number
  numeroPago:     number
  montoAbono:     number
  fechaAbono:     string
}
