import { fmt } from '@/utils/format'
import type { Abono } from '@/types'

interface DesgloseAbonosProps {
  abonos:          Abono[]
  montoProgramado: number
  /** Muestra un esqueleto mientras se resuelve la consulta. */
  isLoading?:      boolean
  /** Oculta el bloque completo cuando no hay ningún abono. */
  ocultarSiVacio?: boolean
}

/**
 * Historial de abonos de un pago: cuánto se abonó, cuándo y cuánto falta.
 *
 * Antes solo se veía el acumulado, así que era imposible saber de cuánto
 * había sido cada pago parcial de un cliente.
 */
export function DesgloseAbonos({
  abonos, montoProgramado, isLoading = false, ocultarSiVacio = false,
}: DesgloseAbonosProps) {

  if (isLoading) {
    return (
      <div className="space-y-2">
        <div className="h-3 w-32 rounded bg-navy-700 animate-pulse" />
        <div className="h-8 rounded-lg bg-navy-700 animate-pulse" />
      </div>
    )
  }

  if (abonos.length === 0) {
    if (ocultarSiVacio) return null
    return (
      <div className="rounded-lg border border-dashed border-white/10 px-3 py-3 text-center">
        <p className="text-xs text-slate-500">Sin abonos registrados</p>
      </div>
    )
  }

  const abonado = abonos.reduce((s, a) => s + a.montoAbono, 0)
  const falta   = Math.max(montoProgramado - abonado, 0)
  const pct     = montoProgramado > 0
    ? Math.min(Math.round((abonado / montoProgramado) * 100), 100)
    : 0
  const completo = falta === 0

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Abonos registrados
        </p>
        <span className="text-[11px] text-slate-500 font-mono">
          {abonos.length} {abonos.length === 1 ? 'abono' : 'abonos'}
        </span>
      </div>

      {/* Lista de abonos individuales */}
      <ul className="rounded-lg bg-navy-800/60 border border-white/5 divide-y divide-white/5">
        {abonos.map((abono, i) => (
          <li key={abono.id} className="flex items-center gap-2.5 px-3 py-2">
            <span className="w-5 shrink-0 text-[10px] font-mono text-slate-600">
              {i + 1}
            </span>
            <span className="font-mono text-sm font-medium text-slate-200">
              {fmt.money(abono.montoAbono)}
            </span>
            <span className="ml-auto text-[11px] text-slate-500 shrink-0">
              {fmt.datetime(abono.fechaAbono)}
            </span>
            <span
              title={abono.enCorte ? 'Ya procesado en corte' : 'Pendiente de corte'}
              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                abono.enCorte ? 'bg-green-400' : 'bg-orange-400'
              }`}
            />
          </li>
        ))}
      </ul>

      {/* Resumen abonado / falta */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">
          Abonado <span className="font-mono text-slate-300">{fmt.money(abonado)}</span>
          <span className="text-slate-600"> de {fmt.money(montoProgramado)}</span>
        </span>
        <span className={completo ? 'text-green-400' : 'text-orange-400'}>
          {completo
            ? 'Pago completo'
            : <>Falta <span className="font-mono">{fmt.money(falta)}</span></>}
        </span>
      </div>

      {/* Barra de avance del pago */}
      <div className="h-1.5 rounded-full bg-navy-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            completo ? 'bg-green-500' : 'bg-orange-500'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
