import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, Controller } from 'react-hook-form'
import { ArrowLeft, Calculator, User, DollarSign, Calendar } from 'lucide-react'
import { useAltaCliente } from '@/hooks'
import { Button, Input, DateInput } from '@/components/ui'
import { fmt } from '@/utils/format'
import type { ClienteRequest } from '@/types'

export default function AltaCliente() {
  const navigate = useNavigate()
  const alta     = useAltaCliente()

  // Calcular próximo sábado automáticamente
  function proximoSabado(desde?: string): string {
    const base = desde ? new Date(desde + 'T12:00:00') : new Date()
    const diff = (6 - base.getDay() + 7) % 7 || 7
    base.setDate(base.getDate() + diff)
    return base.toISOString().split('T')[0]
  }

  const [sugerido] = useState(() => proximoSabado())

  const {
    register, handleSubmit, watch, control,
    formState: { errors },
  } = useForm<ClienteRequest>({ defaultValues: { fechaPrimerPago: sugerido } })

  const monto          = watch('monto')
  const fechaPrimerPago = watch('fechaPrimerPago')
  const pagoSemanal    = monto ? Math.round(monto * 0.10 * 100) / 100 : 0
  const totalRecuperar = monto ? monto * 1.4 : 0

  function onSubmit(data: ClienteRequest) {
    alta.mutate(
      { ...data, monto: Number(data.monto) },
      { onSuccess: () => navigate('/clientes') }
    )
  }

  // Preview corrida de 14 fechas
  const corrida: string[] = fechaPrimerPago
    ? Array.from({ length: 14 }, (_, i) => {
        const d = new Date(fechaPrimerPago + 'T12:00:00')
        d.setDate(d.getDate() + i * 7)
        return d.toISOString().split('T')[0]
      })
    : []

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-up">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl hover:bg-navy-800 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display font-bold text-lg">Alta de cliente</h1>
          <p className="text-xs text-slate-500">Registro y generación de corrida de 14 pagos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Datos personales */}
        <div className="ec-card overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <User size={14} className="text-green-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Datos personales
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <Input
                label="Nombre completo"
                placeholder="Nombre del cliente"
                error={errors.nombre?.message}
                {...register('nombre', { required: 'El nombre es obligatorio' })}
              />
            </div>
            <Input
              label="Teléfono"
              placeholder="55 0000 0000"
              {...register('telefono')}
            />
            <div className="sm:col-span-2">
              <Input
                label="Domicilio"
                placeholder="Calle, número, colonia, CP, municipio"
                {...register('domicilio')}
              />
            </div>
          </div>
        </div>

        {/* Datos del préstamo */}
        <div className="ec-card overflow-hidden">
          <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
            <DollarSign size={14} className="text-green-400" />
            <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Datos del préstamo
            </span>
          </div>
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Monto del préstamo ($)"
              type="number"
              min="100"
              step="100"
              placeholder="3000"
              error={errors.monto?.message}
              {...register('monto', {
                required: 'El monto es obligatorio',
                min: { value: 100, message: 'Mínimo $100' },
              })}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide">
                Pago semanal (10%)
              </label>
              <div className="ec-input flex items-center gap-2 cursor-default opacity-70">
                <Calculator size={14} className="text-green-400 shrink-0" />
                <span className="font-mono text-green-400 font-medium">
                  {pagoSemanal > 0 ? fmt.money(pagoSemanal) : '—'}
                </span>
              </div>
              <p className="text-xs text-slate-500">Calculado automáticamente</p>
            </div>
            <Controller
              name="fechaInicio"
              control={control}
              rules={{ required: 'La fecha es obligatoria' }}
              render={({ field }) => (
                <DateInput
                  label="Fecha de inicio"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  error={errors.fechaInicio?.message}
                />
              )}
            />
            <Controller
              name="fechaPrimerPago"
              control={control}
              rules={{ required: 'La fecha de pago es obligatoria' }}
              render={({ field }) => (
                <DateInput
                  label="Primer sábado de pago"
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  hint={`Próximo sábado: ${fmt.date(sugerido)}`}
                  error={errors.fechaPrimerPago?.message}
                />
              )}
            />
          </div>
        </div>

        {/* Preview corrida */}
        {corrida.length > 0 && monto > 0 && (
          <div className="ec-card overflow-hidden animate-fade-in">
            <div className="px-5 py-3 border-b border-white/5 flex items-center gap-2">
              <Calendar size={14} className="text-green-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Corrida de 14 pagos — preview
              </span>
              <span className="ml-auto text-xs text-slate-500 font-mono">
                Total a recuperar: <span className="text-green-400 font-medium">{fmt.money(totalRecuperar)}</span>
              </span>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {corrida.map((fecha, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-1 p-2 rounded-lg bg-navy-700/50 border border-white/5"
                  >
                    <span
                      className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-mono font-medium"
                      style={{ backgroundColor: '#3b82f633', color: '#3b82f6', border: '1px solid #3b82f655' }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-[9px] text-slate-500 text-center leading-tight">
                      {fmt.dateShort(fecha)}
                    </span>
                    <span className="text-[9px] text-green-500 font-mono">
                      ${pagoSemanal}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="ghost"
            size="lg"
            className="flex-1"
            onClick={() => navigate(-1)}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="flex-1"
            loading={alta.isPending}
          >
            Registrar cliente
          </Button>
        </div>
      </form>
    </div>
  )
}
