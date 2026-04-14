// Toast mínimo sin dependencias externas
type ToastType = 'success' | 'error' | 'info'

function show(message: string, type: ToastType) {
  const el = document.createElement('div')
  const colors = {
    success: 'bg-green-500',
    error:   'bg-red-500',
    info:    'bg-blue-500',
  }
  el.className = `fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3
    rounded-xl text-white text-sm font-medium shadow-2xl
    ${colors[type]} animate-fade-up`
  el.textContent = message
  document.body.appendChild(el)
  setTimeout(() => el.remove(), 3500)
}

export const toast = {
  success: (msg: string) => show(msg, 'success'),
  error:   (msg: string) => show(msg, 'error'),
  info:    (msg: string) => show(msg, 'info'),
}
