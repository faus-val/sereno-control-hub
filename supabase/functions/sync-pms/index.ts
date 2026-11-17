import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

// Sincroniza reservas de los PMS conectados. Llamado por pg_cron cada 15 min.
// Autenticacion: cabecera x-cron-token igual a ajustes.cron_token.
// Credenciales del PMS: secreto de la funcion LODGIFY_API_KEY (de momento una cuenta).
// Horarios: entrada 15:00, salida 11:00 (Europe/Madrid).

const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const HORA_ENTRADA = "15:00";
const HORA_SALIDA = "11:00";

const ESTADOS: Record<string, string> = {
  booked: "confirmada", tentative: "pendiente", open: "pendiente", declined: "cancelada",
};

async function lodgifyBookings(apiKey: string) {
  const out: any[] = [];
  for (const stay of ["Current", "Upcoming"]) {
    for (let page = 1; page <= 20; page++) {
      const url = `https://api.lodgify.com/v2/reservations/bookings?stayFilter=${stay}&page=${page}&size=50&includeCount=true`;
      const r = await fetch(url, { headers: { "X-ApiKey": apiKey, Accept: "application/json" } });
      if (!r.ok) throw new Error(`Lodgify ${r.status}: ${(await r.text()).slice(0, 200)}`);
      const j = await r.json();
      const items = Array.isArray(j) ? j : (j.items ?? []);
      out.push(...items);
      if (items.length < 50) break;
    }
  }
  return out;
}

async function syncLodgify(clienteId: string) {
  const apiKey = Deno.env.get("LODGIFY_API_KEY");
  if (!apiKey) throw new Error("Falta el secreto LODGIFY_API_KEY");

  const { data: aptos } = await sb.from("apartamentos").select("id, pms_id")
    .eq("cliente_id", clienteId).eq("pms", "lodgify");
  const mapa = new Map((aptos ?? []).map((a) => [String(a.pms_id), a.id]));

  const bookings = await lodgifyBookings(apiKey);
  const filas = bookings.map((b: any) => {
    const propId = String(b.property_id ?? b.propertyId ?? "");
    const roomId = String(b.rooms?.[0]?.room_type_id ?? b.rooms?.[0]?.roomTypeId ?? "");
    const people = b.rooms?.reduce?.((s: number, x: any) => s + (x.people ?? x.guest_breakdown?.adults ?? 0), 0);
    return {
      cliente_id: clienteId,
      apartamento_id: mapa.get(propId) ?? mapa.get(roomId) ?? null,
      pms: "lodgify",
      pms_reserva_id: String(b.id),
      pms_propiedad_id: propId || roomId || null,
      estado: ESTADOS[String(b.status ?? "").toLowerCase()] ?? "confirmada",
      entrada: `${b.arrival} ${HORA_ENTRADA} Europe/Madrid`,
      salida: `${b.departure} ${HORA_SALIDA} Europe/Madrid`,
      huesped_nombre: b.guest?.name ?? null,
      huespedes: people || null,
      idioma: b.language ?? b.guest?.locale ?? null,
      canal: b.source ?? null,
      actualizada_en: new Date().toISOString(),
    };
  }).filter((f: any) => f.pms_reserva_id && f.entrada && !String(f.entrada).startsWith("undefined"));

  if (filas.length) {
    const { error } = await sb.from("reservas").upsert(filas, { onConflict: "cliente_id,pms,pms_reserva_id" });
    if (error) throw new Error(error.message);
  }
  return { total: filas.length, sin_apartamento: filas.filter((f: any) => !f.apartamento_id).length };
}

Deno.serve(async (req) => {
  const { data: tok } = await sb.from("ajustes").select("valor").eq("clave", "cron_token").single();
  if (!tok || req.headers.get("x-cron-token") !== tok.valor) {
    return new Response("No autorizado", { status: 401 });
  }

  const { data: conexiones } = await sb.from("conexiones_pms").select("cliente_id, pms").eq("activa", true);
  const resultado: any[] = [];
  for (const c of conexiones ?? []) {
    try {
      if (c.pms !== "lodgify") continue; // hostaway, smoobu: pendientes
      const r = await syncLodgify(c.cliente_id);
      await sb.from("conexiones_pms").update({ ultima_sync: new Date().toISOString(), ultimo_error: null })
        .eq("cliente_id", c.cliente_id).eq("pms", c.pms);
      resultado.push({ ...c, ...r });
    } catch (e) {
      await sb.from("conexiones_pms").update({ ultimo_error: String(e).slice(0, 500) })
        .eq("cliente_id", c.cliente_id).eq("pms", c.pms);
      resultado.push({ ...c, error: String(e) });
    }
  }
  return new Response(JSON.stringify(resultado), { headers: { "Content-Type": "application/json" } });
});
