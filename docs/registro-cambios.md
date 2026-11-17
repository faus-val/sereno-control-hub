# Registro de cambios

Bitácora fechada. Lo más reciente arriba.

## 17/11/2026

### Organización
- Creado el proyecto **SERENO TECh** en Claude para agrupar todos los chats.
- Miro conectado. Tableros: *Sereno Tech – Arquitectura* (diagrama v1) y *Sereno Control Hub – Arquitectura* (posible duplicado).

### Supabase
- Se descubre que hay **dos organizaciones con el mismo nombre**. La buena (4 proyectos) contiene `Sereno-hug` (la demo del Control Hub) y `rh-control`.
- Decisión: usar `Sereno-hug` como base de Sereno Tech, con Rental Hub como cliente cero.
- Migraciones `st_01` a `st_09` (detalle en [supabase.md](supabase.md)):
  - Roles `admin`, `gestor`, `operador`, `limpieza`, `lectura`.
  - `lodgify_id` → `pms` + `pms_id`.
  - Instalaciones con tipos de Mosaic (local, hostal, casa de huéspedes) y ubicación.
  - Reglas de alerta e incidencias con RLS.
  - Motor de reglas con pg_cron cada 2 min.
  - Reservas desde Lodgify con Edge Function `sync-pms` cada 15 min.
  - Ocupación por sensor de presencia en apartamentos sin PMS (Ávila Living).
  - Horarios: entrada 15:00, salida 11:00.
  - Instalación *Casa* en modo `solo_ha` (sin alertas ni ocupación).
- Seguridad: las funciones de permisos ya no se pueden llamar sin sesión.
- Secreto `LODGIFY_API_KEY` añadido por Faus. Primera sincronización: 25 reservas de Murallas Home (ID de propiedad Lodgify `820849`).
- Rellenadas ciudad y provincia de Ávila Living y Murallas Home.
- Detectado en la primera evaluación: 10 dispositivos *no disponibles* (5 Nuki de Ávila Living, ventana del Estudio 1, y Nuki, batería, puerta y ventana de Murallas Home).

### Control Hub (Next.js)
- Proyecto Next.js 16 con login, vista global con mapa, instalación, apartamento e incidencias.
- Documentación inicial en `docs/`.
- Código subido a `faus-val/sereno-control-hub` (privado).
- Desplegado en Vercel (equipo SERENO TECH): https://sereno-control-hub.vercel.app. Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en Production.
- Incidencia: el primer despliegue salió sin variables (error 500); se añadieron y se volvió a desplegar.
- Añadida recuperación de contraseña por email (`/recuperar`, `/auth/callback`, `/nueva-contrasena`).
- Supabase Auth: *Site URL* y *Redirect URL* apuntando a Vercel.
