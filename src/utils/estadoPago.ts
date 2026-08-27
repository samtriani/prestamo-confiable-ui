import type { EstadoPago } from '@/types'

export const estadoConfig: Record<EstadoPago, {
  label:   string
  color:   string    // tailwind bg class
  text:    string    // tailwind text class
  border:  string
  hex:     string    // for inline styles
  dot:     string
}> = {
  PAGADO: {
    label:  'Pagado',
    color:  'bg-green-500/15',
    text:   'text-green-400',
    border: 'border-green-500/30',
    hex:    '#22c55e',
    dot:    'bg-green-500',
  },
  ATRASADO: {
    label:  'Atrasado',
    color:  'bg-red-500/15',
    text:   'text-red-400',
    border: 'border-red-500/30',
    hex:    '#ef4444',
    dot:    'bg-red-500',
  },
  PAGADO_SIN_CORTE: {
    label:  'Sin corte',
    color:  'bg-orange-500/15',
    text:   'text-orange-400',
    border: 'border-orange-500/30',
    hex:    '#f97316',
    dot:    'bg-orange-500',
  },
  ABONO_PARCIAL: {
    label:  'Abono parcial',
    color:  'bg-yellow-500/15',
    text:   'text-yellow-400',
    border: 'border-yellow-500/30',
    hex:    '#eab308',
    dot:    'bg-yellow-500',
  },
  PROXIMO: {
    label:  'Próximo',
    color:  'bg-blue-500/15',
    text:   'text-blue-400',
    border: 'border-blue-500/30',
    hex:    '#3b82f6',
    dot:    'bg-blue-500',
  },
  PENDIENTE: {
    label:  'Pendiente',
    color:  'bg-slate-500/10',
    text:   'text-slate-500',
    border: 'border-slate-600/30',
    hex:    '#374151',
    dot:    'bg-slate-600',
  },
}

export const getEstado = (estado: EstadoPago) => estadoConfig[estado]

/**
 * Colores de la corrida de 14 pagos de un préstamo.
 *
 * Los cuadritos no representan pagos concretos sino tramos, en este orden:
 * pagados y cortados, cubiertos sin corte, con abono parcial, atrasados
 * sin un peso encima, el próximo a cobrar y el resto pendientes.
 */
export const corridaHex = (p: {
  totalPagos?:     number
  pagosCubiertos?: number
  pagosSinCorte?:  number
  pagosParciales?: number
  pagosAtrasados?: number
}): string[] => {
  const total     = p.totalPagos     ?? 14
  const cubiertos = p.pagosCubiertos ?? 0
  const sinCorte  = p.pagosSinCorte  ?? 0
  const parciales = p.pagosParciales ?? 0
  const atrasados = p.pagosAtrasados ?? 0

  const finParciales = cubiertos + parciales
  const finAtrasados = finParciales + atrasados

  return Array.from({ length: total }, (_, i) => {
    if (i <  cubiertos - sinCorte) return estadoConfig.PAGADO.hex
    if (i <  cubiertos)            return estadoConfig.PAGADO_SIN_CORTE.hex
    if (i <  finParciales)         return estadoConfig.ABONO_PARCIAL.hex
    if (i <  finAtrasados)         return estadoConfig.ATRASADO.hex
    if (i === finAtrasados)        return estadoConfig.PROXIMO.hex
    return estadoConfig.PENDIENTE.hex
  })
}
