# Sereno Tech · Documentación técnica

Documentación viva del Control Hub de Sereno Tech. Se actualiza con cada cambio.

| Documento | Qué cubre |
|---|---|
| [arquitectura.md](arquitectura.md) | Visión general: piezas, flujo de datos y decisiones |
| [supabase.md](supabase.md) | Base de datos, roles y seguridad, motor de reglas, reservas, tareas programadas, secretos |
| [nextjs.md](nextjs.md) | Aplicación web: estructura, variables de entorno, despliegue en Vercel |
| [registro-cambios.md](registro-cambios.md) | Bitácora fechada de todo lo que se hace |

Diagrama de arquitectura en Miro: https://miro.com/app/board/uXjVENjsqYw=/

## Reglas para mantener esto al día

1. Todo cambio en Supabase se hace como **migración con nombre** (`st_NN_descripcion`) y se apunta en `registro-cambios.md`.
2. Si cambia una tabla, rol, regla o tarea programada, se actualiza `supabase.md` en el mismo cambio.
3. Las claves y secretos **nunca** se escriben aquí: solo su nombre y dónde se configuran.
