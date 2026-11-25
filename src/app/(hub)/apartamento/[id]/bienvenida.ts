"use server";

import { headers } from "next/headers";
import { crearClienteServidor } from "@/lib/supabase/server";
import { PISTAS_BIENVENIDA } from "@/lib/bienvenida";

export type ResultadoPrueba = { ok: boolean; mensaje: string };

// Pide a n8n que reproduzca la bienvenida en la tele del apartamento.
// n8n llama a Home Assistant por Tailscale (media_player.play_media).
export async function probarBienvenida(apartamentoId: string, pistaId: string): Promise<ResultadoPrueba> {
  const pista = PISTAS_BIENVENIDA.find((p) => p.id === pistaId);
  if (!apartamentoId || !pista) return { ok: false, mensaje: "Datos no válidos." };

  const sb = await crearClienteServidor();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { ok: false, mensaje: "Tu sesión ha caducado. Vuelve a entrar." };

  // RLS: solo devuelve el apartamento si este usuario puede verlo.
  const { data: apto } = await sb.from("apartamentos").select("id,nombre,instalacion_id").eq("id", apartamentoId).maybeSingle();
  if (!apto) return { ok: false, mensaje: "No tienes acceso a este apartamento." };

  const { data: teles } = await sb.from("dispositivos").select("entity_id")
    .eq("apartamento_id", apartamentoId).eq("activo", true).like("entity_id", "media_player.%");

  const webhook = process.env.N8N_WEBHOOK_BIENVENIDA;
  if (!webhook) {
    return { ok: false, mensaje: "Falta conectar n8n: añade N8N_WEBHOOK_BIENVENIDA en Vercel. Mientras tanto puedes escucharla aquí." };
  }

  const h = await headers();
  const origen = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("x-forwarded-host") ?? h.get("host")}`;

  try {
    const r = await fetch(webhook, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_WEBHOOK_TOKEN ? { Authorization: `Bearer ${process.env.N8N_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({
        accion: "bienvenida_prueba",
        apartamento_id: apto.id,
        apartamento: apto.nombre,
        instalacion_id: apto.instalacion_id,
        media_player: teles?.[0]?.entity_id ?? null,
        audio_url: `${origen}${pista.archivo}`,
        pista: pista.id,
        solicitado_por: user.email,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!r.ok) return { ok: false, mensaje: `n8n respondió ${r.status}. Revisa el flujo de bienvenida.` };
    return { ok: true, mensaje: "Enviado. Debería sonar en la tele en unos segundos." };
  } catch {
    return { ok: false, mensaje: "No se pudo contactar con n8n." };
  }
}
