# Arquitectura

Sereno Tech da a gestores de alojamientos turísticos un único proveedor, un único panel y una única cuota para la tecnología de sus apartamentos.

## Piezas

```
 Apartamento / edificio                 Nube                                   Personas
 ─────────────────────                  ────                                   ────────
 Sensores Zigbee, Nuki, clima  ─┐
 Router (MikroTik / Omada)      ├─> Home Assistant ──(n8n, webhook)──> Supabase ──> Control Hub (Next.js, Vercel)
                                ┘        ▲                              │  ▲             │
                                         │ Tailscale (sin puertos)      │  │             └─> Agente IA (pendiente)
                                         └──────── n8n (acciones) <─────┘  │
                                                                           │
 PMS del gestor (Lodgify, Hostaway, Smoobu) ──(Edge Function sync-pms)─────┘
                                                                Supabase ──> Slack / WhatsApp (pendiente)
```

| Pieza | Tecnología | Estado |
|---|---|---|
| Cerebro en cada sitio | Home Assistant (hardware LinknLink) | Funciona (Ávila Living, Murallas Home, Casa) |
| Acceso remoto seguro | Tailscale, sin puertos abiertos | Funciona |
| Ingesta y acciones | n8n | Funciona (ingesta); acciones pendientes de conectar al Hub |
| Base de datos multicliente | Supabase (proyecto `Sereno-hug`, París) | Funciona |
| Motor de alertas | Postgres + pg_cron, cada 2 min | Funciona |
| Reservas | Edge Function `sync-pms`, cada 15 min | Lodgify funciona; Hostaway y Smoobu pendientes |
| Panel web | Next.js en Vercel, repo `sereno-control-hub` | En construcción |
| Avisos | Slack (equipo de Adrià), WhatsApp (limpieza) | Pendiente |
| Agente IA | Avisa de alertas y responde preguntas | Pendiente |

## Modelo de datos (resumen)

```
clientes ─┬─ miembros (usuario + rol)
          ├─ instalaciones (edificio, local, hostal, piso...) ── apartamentos ── dispositivos ─┬─ estados (último valor)
          │                                                         │                       ├─ mediciones (histórico numérico)
          │                                                         │                       └─ eventos (cambios)
          ├─ reservas (del PMS) ───────────────────────────────────┘
          ├─ reglas_alerta ── reglas_seguimiento
          ├─ incidencias
          └─ conexiones_pms
```

Todo lleva `cliente_id`, y la seguridad por filas (RLS) garantiza que cada gestor solo ve lo suyo.

## Decisiones tomadas

| Fecha | Decisión | Motivo |
|---|---|---|
| 17/11/2026 | Reutilizar el proyecto Supabase de la demo (`Sereno-hug`) como base de Sereno Tech | Ya era multicliente y tenía datos reales; la cuenta gratuita solo permite 2 proyectos activos |
| 17/11/2026 | Rental Hub es el **cliente cero** | Demos con datos reales |
| 17/11/2026 | PMS genérico (`pms` + `pms_id`) en vez de `lodgify_id` | Mosaic/WeHost usa Hostaway; hay que soportar varios PMS |
| 17/11/2026 | Motor de reglas dentro de Postgres (pg_cron) | No depende de n8n ni de servidores extra |
| 17/11/2026 | Sin PMS, la ocupación se deduce de sensores de presencia (últimas 3 h) | Ávila Living no tiene PMS |
| 17/11/2026 | Instalación "Casa" en modo `solo_ha` | Es la casa de Faus: solo conexión con HA, sin alertas ni ocupación |
| 17/11/2026 | Horarios: entrada 15:00, salida 11:00 | Lodgify solo da el día |
| 17/11/2026 | Panel en Next.js + GitHub + Vercel, fuera de Lovable | Sin dependencia de créditos de Lovable; código propio |
