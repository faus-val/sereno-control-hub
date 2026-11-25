# Bienvenida en la tele

Mensaje de voz (Aitana, ElevenLabs v4) con música de fondo que suena en la tele del apartamento. Desde la ficha de cada apartamento del Control Hub se puede escuchar y **probar en la tele**.

## Audios

| Archivo | Música | Duración |
|---|---|---|
| `public/audio/bienvenida-sunlit.mp3` | Welcome Home, Sunlit (ElevenLabs Music) | 23 s |
| `public/audio/bienvenida-folk.mp3` | Welcome Home (ElevenLabs Music) | 23 s |

Mezcla: la música entra con fundido, la voz empieza a los 2 s, la música baja mientras habla (sidechain) y termina con fundido. Volumen normalizado a −16 LUFS.

`/audio/*` queda fuera del control de sesión (`src/proxy.ts`) para que Home Assistant pueda descargarlo sin iniciar sesión. Solo poner ahí audios públicos.

## Flujo

```
Control Hub ("Probar en la tele")
  └─ server action probarBienvenida ──POST──> n8n (webhook)
                                                └─ Home Assistant (Tailscale) ── media_player.play_media ──> Xiaomi TV Box
```

La server action comprueba la sesión y, con RLS, que el usuario puede ver el apartamento. Busca la tele del apartamento (`dispositivos.entity_id` que empiece por `media_player.`).

### Datos que recibe n8n

```json
{
  "accion": "bienvenida_prueba",
  "apartamento_id": "uuid",
  "apartamento": "Nombre",
  "instalacion_id": "uuid",
  "media_player": "media_player.xiaomi_tv_box",
  "audio_url": "https://sereno-control-hub.vercel.app/audio/bienvenida-sunlit.mp3",
  "pista": "sunlit",
  "solicitado_por": "email"
}
```

`media_player` puede venir vacío si la tele no está dada de alta en Supabase; en ese caso n8n usa una por defecto.

### Variables de entorno (Vercel, solo servidor)

| Variable | Valor |
|---|---|
| `N8N_WEBHOOK_BIENVENIDA` | URL del webhook de n8n |
| `N8N_WEBHOOK_TOKEN` | Opcional. n8n debe comprobar `Authorization: Bearer <token>` |

### Flujo de n8n

1. **Webhook** (POST). Si hay token, comprobar la cabecera `Authorization`.
2. **HTTP Request** a Home Assistant (por Tailscale), con un token de larga duración de HA:
   - `POST {HA}/api/services/script/bienvenida_tv`
   - Cuerpo: `{ "tele": "{{ $json.body.media_player || 'media_player.xiaomi_tv_box' }}", "audio": "{{ $json.body.audio_url }}" }`
3. **Respond to Webhook** con 200.

### Script de Home Assistant (`scripts.yaml`)

```yaml
bienvenida_tv:
  alias: Bienvenida en la tele
  fields:
    tele: { description: "media_player del TV Box" }
    audio: { description: "URL del MP3" }
  sequence:
    - action: media_player.turn_on
      target: { entity_id: "{{ tele }}" }
    - delay: "00:00:08"
    - action: media_player.volume_set
      target: { entity_id: "{{ tele }}" }
      data: { volume_level: 0.25 }
    - action: media_player.play_media
      target: { entity_id: "{{ tele }}" }
      data:
        media_content_id: "{{ audio }}"
        media_content_type: music
```

Usar la entidad de **Google Cast** del TV Box para `play_media`. Con la de ADB, encender funciona, pero reproducir una URL no siempre. Para que la tele LG se encienda con el TV Box, activar **SIMPLINK** (HDMI-CEC).

## Pendiente

- Automatización real: al abrir el Nuki el día de llegada (una vez por estancia y fuera de horario nocturno) → script `bienvenida_tv` + aviso con el QR (PiPup).
- Elegir la música definitiva y borrar la otra.
