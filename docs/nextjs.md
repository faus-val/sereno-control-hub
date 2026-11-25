# Control Hub (Next.js)

Panel web de Sereno Tech. Sustituye al dashboard de Lovable.

- **Repositorio:** `faus-val/sereno-control-hub` (privado)
- **Hosting:** Vercel, equipo *SERENO TECH* (plan Hobby), despliegue automático desde la rama `main`
- **URL:** https://sereno-control-hub.vercel.app
- **Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Supabase (`@supabase/ssr`) · Leaflet + OpenStreetMap

## Pantallas

| Ruta | Qué muestra |
|---|---|
| `/login` | Acceso con email y contraseña (Supabase Auth) |
| `/recuperar` | Pide un enlace por email para crear contraseña nueva |
| `/auth/callback` | Destino de los enlaces de email de Supabase (canjea el código por sesión) |
| `/nueva-contrasena` | Crear contraseña nueva (mínimo 10 caracteres) |
| `/` | KPIs, mapa de instalaciones, próximas llegadas, tabla de instalaciones, incidencias abiertas |
| `/instalacion/[id]` | Apartamentos por planta con estado, ocupación, dispositivos e incidencias |
| `/apartamento/[id]` | Tabla de **equipos** (una línea por aparato físico): estado, última señal, batería, lecturas/control y estancia. Arriba, contadores (atención, sin conexión, batería baja, sin estancia) y aviso de llegadas en 72 h con la cerradura caída. Debajo, reservas e incidencias |
| `/apartamento/[id]` (abajo) | **Bienvenida en la tele**: escuchar las mezclas y *Probar en la tele* (vía n8n → Home Assistant). Ver [bienvenida-tv.md](bienvenida-tv.md) |
| `/incidencias` | Abiertas (con acciones *Me encargo*, *Resuelta*, *Descartar*) y cerradas de los últimos 7 días |

### Estado de una instalación o apartamento

| Estado | Cuándo |
|---|---|
| Sin datos | Nada recibido en los últimos 15 min |
| Incidencia | Hay alguna incidencia abierta de severidad *alerta* |
| Atención | Hay incidencias abiertas o dispositivos *no disponibles* |
| En línea | Todo lo demás |

## Estructura

```
src/
  proxy.ts                     Refresca la sesión y redirige a /login (en Next 16 "middleware" se llama "proxy")
  lib/supabase/server.ts       Cliente Supabase para servidor (cookies)
  lib/datos.ts                 Carga y resume instalaciones, apartamentos, dispositivos, incidencias y reservas
  lib/formato.ts               Textos, fechas (Europe/Madrid) y cálculo de estado
  components/                  Mapa, estados, lista de incidencias
  app/login/                   Pantalla y acciones de acceso
  app/(hub)/                   Pantallas con sesión: global, instalación, apartamento, incidencias
supabase/functions/sync-pms/   Código de la Edge Function (desplegada en Supabase)
docs/                          Esta documentación
```

## Seguridad

- La app usa la **clave publicable** de Supabase. Es segura en el navegador porque **RLS** decide qué filas ve cada usuario.
- Nunca se usa la clave `service_role` en la app.
- Cambiar el estado de una incidencia es una *server action*; RLS valida si el usuario puede hacerlo.

## Variables de entorno

| Variable | Valor |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://tdxjmkkrfvdkpwcupctz.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Clave publicable (`sb_publishable_...`) de *Project Settings → API Keys* |
| `N8N_WEBHOOK_BIENVENIDA` | Webhook de n8n para la bienvenida en la tele (solo servidor) |
| `N8N_WEBHOOK_TOKEN` | Opcional, token que comprueba ese webhook |

En local van en `.env.local` (no se sube a git; plantilla en `.env.example`). En Vercel, en *Settings → Environment Variables*.

## Trabajar en local

```bash
npm install
cp .env.example .env.local   # y rellenar la clave publicable
npm run dev                  # http://localhost:3000
npm run lint && npm run build
```

## Desplegar en Vercel (una sola vez)

1. Entrar en vercel.com con la cuenta de GitHub.
2. *Add New → Project* → importar `faus-val/sereno-control-hub`.
3. Añadir las dos variables de entorno de arriba.
4. *Deploy*. A partir de ahí, cada push a `main` se publica solo.
5. En Supabase → *Authentication → URL Configuration*: *Site URL* = `https://sereno-control-hub.vercel.app` y *Redirect URL* = `https://sereno-control-hub.vercel.app/**` (hecho el 17/11/2026). Para probar en local, añadir también `http://localhost:3000/**`.

## Decisiones

- **Fuentes autoalojadas** (`@fontsource/ibm-plex-*`) en vez de Google Fonts: no dependen de servicios externos al compilar.
- **Leaflet + OpenStreetMap** para el mapa: gratis y sin clave. Pendiente: zoom por provincia y ciudad.
- **Next.js 16.4.6**: las versiones 15.x tenían vulnerabilidades críticas abiertas a noviembre de 2026.

## Pendiente

- Acciones sobre dispositivos (abrir cerradura, clima) vía n8n + Tailscale.
- Gráficas de mediciones (temperatura, consumo, ruido).
- Gestión de usuarios y roles desde el panel.
- Avisos a Slack y WhatsApp.
- Agente IA.
- Tiempo real (Supabase Realtime) en vez de recargar la página.
