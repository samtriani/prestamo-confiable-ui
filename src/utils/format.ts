import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

export const fmt = {
  money: (n: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n),

  moneyShort: (n: number) => {
    if (n >= 1000) return `$${(n / 1000).toFixed(1)}k`
    return `$${n}`
  },

  date: (iso: string) => {
    try { return format(parseISO(iso), 'dd MMM yyyy', { locale: es }) }
    catch { return iso }
  },

  dateShort: (iso: string) => {
    try { return format(parseISO(iso), 'dd/MM/yy', { locale: es }) }
    catch { return iso }
  },

  datetime: (iso: string) => {
    try { return format(parseISO(iso), "dd MMM yyyy 'a las' HH:mm", { locale: es }) }
    catch { return iso }
  },

  percent: (value: number, total: number) =>
    total === 0 ? '0%' : `${Math.round((value / total) * 100)}%`,

  initials: (nombre: string) =>
    nombre.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase(),
}
