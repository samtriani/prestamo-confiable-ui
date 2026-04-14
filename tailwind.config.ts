import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans:    ['DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      colors: {
        // Base
        navy:  {
          950: '#060b14',
          900: '#0a0f1a',
          800: '#0f1724',
          700: '#16202f',
          600: '#1e2d40',
          500: '#253548',
        },
        // Acento principal
        green: {
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        // Estados pago
        paid:    '#22c55e',   // verde  — PAGADO
        late:    '#ef4444',   // rojo   — ATRASADO
        pending: '#f97316',   // naranja — PAGADO_SIN_CORTE
        next:    '#3b82f6',   // azul   — PROXIMO
        idle:    '#374151',   // gris   — PENDIENTE
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease both',
        'fade-in':   'fadeIn 0.3s ease both',
        'slide-in':  'slideIn 0.35s ease both',
      },
      keyframes: {
        fadeUp:  { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'none' } },
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn: { from: { opacity: '0', transform: 'translateX(-12px)' }, to: { opacity: '1', transform: 'none' } },
      },
    },
  },
  plugins: [],
} satisfies Config
