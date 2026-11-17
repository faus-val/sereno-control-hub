# Supabase

- **Proyecto:** `Sereno-hug` · ref `tdxjmkkrfvdkpwcupctz` · región eu-west-3 (París) · plan Free
- **URL:** https://tdxjmkkrfvdkpwcupctz.supabase.co
- **Organización:** la de 4 proyectos (`ojwpdizxlhjigrpillhf`). Hay otra con el mismo nombre; pendiente renombrarlas.
- **Otros proyectos activos en la organización:** `rh-control` (Londres). El plan Free permite 2 activos.

## Tablas

| Tabla | Para qué | Notas |
|---|---|---|
| `clientes` | Cada gestor (Rental Hub, Mosaic...) | Raíz del multicliente |
| `miembros` | Usuario + cliente + rol | Roles: `admin`, `gestor`, `operador`, `limpieza`, `lectura` |
| `instalaciones` | Edificio, local, hostal, casa de huéspedes, piso, casa, autocaravana | `ciudad`, `provincia`, `codigo_postal`, `plantas`, `lat/lon` para el mapa. `nodo_tailscale`, `ha_url`. `modo`: `servicio` o `solo_ha` |
| `apartamentos` | Unidades dentro de una instalación | `pms` + `pms_id` (antes `lodgify_id`). `planta`, `posicion` para el plano |
| `dispositivos` | Entidades de Home Assistant | `equipo`: aparato físico al que pertenece (agrupa filas en el panel; nulo = la entidad es su propio aparato). `entity_id`, `tipo_funcional` (cerradura, clima, temperatura, humedad, ruido, ventana, puerta, consumo, wifi, presencia, bateria, conectividad...) |
| `estados` | Último valor de cada dispositivo | Lo escribe n8n |
| `mediciones` | Histórico numérico | ~225.000 filas a 17/11/2026 |
| `eventos` | Cambios de estado | |
| `reglas_alerta` | Qué vigilar | `cliente_id` nulo = regla por defecto de Sereno Tech. `tipo_funcional='*'` = cualquier dispositivo |
| `reglas_seguimiento` | Desde cuándo se cumple cada regla en cada dispositivo | Interna del motor |
| `incidencias` | Lo que alguien tiene que atender | Estados: `abierta`, `en_curso`, `resuelta`, `descartada`. Origen: `automatica`, `manual`, `huesped` |
| `reservas` | Reservas traídas del PMS | Entrada 15:00, salida 11:00 (Europe/Madrid) |
| `conexiones_pms` | Qué PMS tiene cada cliente | `ultima_sync`, `ultimo_error` |
| `ajustes` | Clave/valor interno | `webhook_token` (n8n), `cron_token` (tareas programadas). Sin acceso desde la API |

## Seguridad (RLS)

Todas las tablas tienen RLS activado. Funciones de apoyo (security definer, solo para usuarios con sesión):

- `es_miembro(cliente)` · `es_admin(cliente)` · `tiene_rol(cliente, roles[])`

| Rol | Ve | Puede |
|---|---|---|
| `admin`, `gestor` | Todo su cliente | Gestionar reglas, crear y atender incidencias |
| `operador` | Todo su cliente | Crear y atender incidencias |
| `limpieza` | Reservas y **solo las incidencias asignadas a él** | Atender sus incidencias |
| `lectura` | Todo su cliente | Nada |

Auth: *Site URL* `https://sereno-control-hub.vercel.app`, *Redirect URL* `https://sereno-control-hub.vercel.app/**`.

Pendiente: activar en Auth la protección contra contraseñas filtradas antes de dar acceso a terceros.

## Motor de reglas

- Función `evaluar_reglas()`, ejecutada por **pg_cron cada 2 minutos** (tarea `evaluar-reglas`).
- Una regla se cumple → empieza a contar. Si sigue cumpliéndose `minutos` después → abre una incidencia (una sola mientras siga abierta).
- Si deja de cumplirse y la incidencia sigue `abierta` (nadie la cogió) → se cierra sola como `resuelta`.
- "Instalación sin datos": si una instalación no manda nada en 15 min → una incidencia para toda la instalación.
- Las reglas `solo_con_huesped` solo cuentan si `hay_huesped(apartamento)`.
- Las instalaciones en modo `solo_ha` se ignoran.

### `hay_huesped(apartamento)`

1. Hay una reserva `confirmada` o `pendiente` en curso, **o**
2. el apartamento **no tiene PMS** y un sensor de presencia está activo o se activó en las últimas 3 horas.

### Reglas por defecto

| Regla | Condición | Espera | Severidad | Solo con huésped |
|---|---|---|---|---|
| Ruido alto con huésped | ruido > 70 | 10 min | aviso | sí |
| Ruido muy alto | ruido > 85 | 5 min | alerta | no |
| Temperatura baja | < 10 | 30 min | aviso | no |
| Temperatura alta | > 32 | 30 min | aviso | no |
| Humedad alta | > 75 | 60 min | aviso | no |
| Batería baja | < 15 | 0 | info | no |
| Puerta abierta mucho tiempo | = on | 30 min | aviso | no |
| Ventana abierta con clima | = on | 15 min | info | sí |
| Wifi caído | conectividad = off | 5 min | alerta | no |
| Dispositivo no disponible | cualquiera = unavailable | 60 min | aviso | no |
| Instalación sin datos | sin datos | 15 min | alerta | no |

## Reservas (PMS)

- Edge Function **`sync-pms`** (código en `supabase/functions/sync-pms/`), llamada por **pg_cron cada 15 min** (tarea `sync-pms`) vía `pg_net`.
- Autenticación: cabecera `x-cron-token` = `ajustes.cron_token`. JWT desactivado en la función.
- Trae reservas actuales y futuras (`stayFilter=Current` y `Upcoming`).
- Vincula cada reserva al apartamento por `apartamentos.pms_id` = id de propiedad del PMS.
- Soportado: **Lodgify**. Pendiente: Hostaway, Smoobu.

| Apartamento | PMS | ID |
|---|---|---|
| Murallas Home | Lodgify | 820849 (propiedad) |
| Ávila Living (6 estudios) | Sin PMS | Ocupación por presencia. Estudios 2, 5 y 6 sin sensor |
| Casa | — | Modo `solo_ha` |

## Secretos (Edge Functions)

Se configuran en *Project Settings → Edge Functions → Secrets*. Nunca en el código ni en esta documentación.

| Nombre | Para qué |
|---|---|
| `LODGIFY_API_KEY` | Lodgify, cuenta de Rental Hub. Se saca en Lodgify → Settings → Public API |

## Tareas programadas (pg_cron)

| Nombre | Cada | Qué hace |
|---|---|---|
| `evaluar-reglas` | 2 min | `select public.evaluar_reglas()` |
| `sync-pms` | 15 min | POST a la Edge Function `sync-pms` |

## Extensiones

`pg_cron`, `pg_net`, `pgcrypto`, `uuid-ossp`, `supabase_vault`, `pg_stat_statements`.

## Migraciones aplicadas (17/11/2026)

| Versión | Nombre | Qué hace |
|---|---|---|
| 20261117122533 | `st_01_roles_y_pms` | Roles ampliados, `tiene_rol()`, `lodgify_id` → `pms` + `pms_id` |
| 20261117122539 | `st_02_edificios` | Nuevos tipos de instalación y campos de ubicación |
| 20261117142937 | `st_03_alertas_e_incidencias` | `reglas_alerta`, `incidencias`, RLS, reglas por defecto |
| 20261117153638 | `st_04_revocar_anon_funciones` | Funciones de permisos solo para usuarios con sesión |
| 20261117154444 | `st_05_motor_reglas` | `reglas_seguimiento`, `evaluar_reglas()`, cron cada 2 min |
| 20261117155547 | `st_06_reservas` | `reservas`, `conexiones_pms`, `hay_huesped()`, cron de sync |
| 20261117161216 | `st_07_murallas_pms_y_presencia` | ID Lodgify de Murallas; ocupación por presencia sin PMS |
| 20261117161426 | `st_08_salida_11_y_casa_solo_ha` | Salida 11:00; modo `solo_ha` |
| 20261117161440 | `st_09_evaluar_reglas_sin_casa` | El motor ignora instalaciones `solo_ha` |
| 20261117 | `st_10_equipos` | Columna `dispositivos.equipo` y agrupación inicial (Nuki, sensores, termo, internet, estudios) |

Las migraciones anteriores (la demo de Lovable) no están registradas. Para traer el esquema completo al repositorio: `supabase link --project-ref tdxjmkkrfvdkpwcupctz` y `supabase db pull`.
