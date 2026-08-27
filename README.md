# prestamo-confiable-ui

Interfaz de la Plataforma de Préstamos Confiables. React 18 + TypeScript + Vite,
con Tailwind y TanStack Query.

## Requisitos

- **Node.js 18+** y npm
- La API corriendo — ver [`prestamo-confiable-api`](../prestamo-confiable-api/README.md)

## 1. Instalar

```bash
npm install
```

## 2. Configurar

Copia el ejemplo y ajusta la URL del backend:

```bash
cp .env.example .env.local
```

```env
VITE_API_URL=http://localhost:8080/api
```

En local puedes dejarlo así: `vite.config.ts` ya hace proxy de `/api` hacia
`http://localhost:8080`, así que no hay problemas de CORS mientras desarrollas.

## 3. Levantar

```bash
npm run dev
```

Queda en **http://localhost:5173**.

Necesitas la API arriba y un usuario en la tabla `usuarios` para poder entrar —
la pantalla de login pega contra `POST /api/auth/login`.

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | servidor de desarrollo con HMR en el puerto 5173 |
| `npm run build` | `tsc` + build de producción a `dist/` |
| `npm run preview` | sirve el `dist/` ya construido |
| `npm run lint` | ⚠️ declarado pero **no funciona** — ver abajo |

`npm run build` corre `tsc` primero, así que un error de tipos rompe el build.
Para revisar tipos sin construir: `npx tsc --noEmit`.

El script `lint` está en el `package.json` pero ESLint no está en las
dependencias ni hay archivo de configuración, así que hoy falla. Para
habilitarlo haría falta instalar `eslint`, `@typescript-eslint/*` y el plugin de
React, y agregar un `eslint.config.js`.

## Estructura

```
src/
  pages/       una pantalla por archivo (Dashboard, ControlPagos, DetalleCliente…)
  components/  UI compartida
  hooks/       wrappers de TanStack Query sobre la API
  utils/       formato de dinero/fechas y colores de estado
  types/       tipos compartidos con la API
```

El alias `@` apunta a `src/` (`import { fmt } from '@/utils/format'`).

## Colores de estado

Los estados de pago y sus colores viven en un solo lugar:
[`src/utils/estadoPago.ts`](src/utils/estadoPago.ts). Ahí está `estadoConfig`
(etiqueta y color por estado) y `corridaHex()`, que arma los colores de la
corrida de 14 pagos. Si agregas un estado nuevo en la API, agrégalo también al
tipo `EstadoPago` en [`src/types/index.ts`](src/types/index.ts) — TypeScript te
obliga a completar `estadoConfig` y ahí se cierra el círculo.

## Despliegue

Va a Vercel con [`vercel.json`](vercel.json), que ya trae el rewrite de SPA para
que las rutas de React Router funcionen al recargar. Configura `VITE_API_URL` en
las variables de entorno del proyecto en Vercel apuntando a la API en producción.
