import type { Dispositivo, Incidencia, Reserva } from "@/lib/datos";

// Un "equipo" es el aparato físico: agrupa las entidades de Home Assistant que vienen de él
// (p. ej. la Nuki = cerradura + batería + sensor de puerta).

export type Lectura = { tipo: string; texto: string; tono: "ok" | "aviso" | "alerta" | "neutro" | "info" };

export type Equipo = {
  clave: string;
  nombre: string;
  tipo: string;                // tipo de la entidad principal (para el icono)
  estancia: string | null;
  entidades: Dispositivo[];
  enLinea: boolean;
  parcial: boolean;            // alguna entidad caída pero no todas
  ultimo: string | null;
  bateria: { pct: number | null; critica: boolean } | null;
  lecturas: Lectura[];
  incidencias: Incidencia[];
};

const PRIORIDAD = ["cerradura", "clima", "puerta", "ventana", "presencia", "temperatura", "humedad", "ruido", "consumo", "conectividad", "wifi", "bajada", "subida", "latencia", "cortes", "bateria"];
const rango = (t: string) => { const i = PRIORIDAD.indexOf(t); return i < 0 ? 99 : i; };

const caido = (d: Dispositivo) => d.estado?.valor === "unavailable" || d.estado?.valor === "unknown" || d.estado?.valor == null;
const num = (v: string | null | undefined) => (v != null && v.trim() !== "" && !Number.isNaN(Number(v)) ? Number(v) : null);
const fmt = (n: number, dec = 1) => (Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10 ** dec) / 10 ** dec).toLocaleString("es-ES");

function lectura(d: Dispositivo): Lectura | null {
  const v = d.estado?.valor ?? null;
  if (caido(d)) return null;
  const n = num(v);
  switch (d.tipo_funcional) {
    case "cerradura":
      if (v === "locked") return { tipo: "cerradura", texto: "Cerrada", tono: "ok" };
      if (v === "unlocked") return { tipo: "cerradura", texto: "Abierta", tono: "aviso" };
      if (v === "jammed") return { tipo: "cerradura", texto: "Atascada", tono: "alerta" };
      return { tipo: "cerradura", texto: v ?? "—", tono: "neutro" };
    case "puerta":
    case "ventana":
      return { tipo: d.tipo_funcional, texto: v === "on" ? "Abierta" : "Cerrada", tono: v === "on" ? "aviso" : "neutro" };
    case "presencia":
      return { tipo: "presencia", texto: v === "on" ? "Presencia" : "Sin presencia", tono: v === "on" ? "info" : "neutro" };
    case "clima":
      return { tipo: "clima", texto: v === "off" ? "Apagado" : v === "heat" ? "Calor" : v === "cool" ? "Frío" : (v ?? "—"), tono: v === "off" ? "neutro" : "info" };
    case "temperatura":
      return n == null ? null : { tipo: "temperatura", texto: `${fmt(n)} °C`, tono: n > 30 || n < 12 ? "aviso" : "neutro" };
    case "humedad":
      return n == null ? null : { tipo: "humedad", texto: `${fmt(n, 0)} %`, tono: n > 75 ? "aviso" : "neutro" };
    case "ruido":
      return n == null ? null : { tipo: "ruido", texto: `${fmt(n, 0)} dB`, tono: n > 70 ? "aviso" : "neutro" };
    case "consumo":
      return n == null ? null : { tipo: "consumo", texto: `${fmt(Math.abs(n))} ${d.unidad ?? ""}`.trim(), tono: "neutro" };
    case "conectividad":
    case "wifi":
      return { tipo: d.tipo_funcional, texto: v === "on" ? "Conectado" : "Sin conexión", tono: v === "on" ? "ok" : "alerta" };
    case "bajada":
      return n == null ? null : { tipo: "bajada", texto: `↓ ${fmt(n, 0)} Mb`, tono: "neutro" };
    case "subida":
      return n == null ? null : { tipo: "subida", texto: `↑ ${fmt(n, 0)} Mb`, tono: "neutro" };
    case "latencia":
      return n == null ? null : { tipo: "latencia", texto: `${fmt(n, 0)} ms`, tono: n > 100 ? "aviso" : "neutro" };
    case "cortes":
      if (d.unidad === "h") return null;
      return n == null ? null : { tipo: "cortes", texto: `${fmt(n, 0)} cortes 24 h`, tono: n > 0 ? "aviso" : "neutro" };
    default:
      return null;
  }
}

export function agruparEquipos(dispositivos: Dispositivo[], incidencias: Incidencia[], ultimoBueno: Record<string, string> = {}): Equipo[] {
  const grupos = new Map<string, Dispositivo[]>();
  for (const d of dispositivos) {
    const k = d.equipo ?? d.entity_id;
    grupos.set(k, [...(grupos.get(k) ?? []), d]);
  }

  return [...grupos.entries()].map(([clave, ents]) => {
    ents.sort((a, b) => rango(a.tipo_funcional) - rango(b.tipo_funcional));
    const principal = ents.find((e) => e.tipo_funcional !== "bateria") ?? ents[0];
    const conDatos = ents.filter((e) => !caido(e));
    const bat = ents.find((e) => e.tipo_funcional === "bateria");
    const pct = num(bat?.estado?.valor);
    const ids = new Set(ents.map((e) => e.id));
    return {
      clave,
      nombre: principal.equipo ?? principal.nombre_visible ?? principal.entity_id,
      tipo: principal.tipo_funcional,
      estancia: ents.find((e) => e.habitacion)?.habitacion ?? null,
      entidades: ents,
      enLinea: conDatos.length > 0,
      parcial: conDatos.length > 0 && conDatos.length < ents.length,
      // En línea: último dato recibido. Sin conexión: último valor real antes de caerse.
      ultimo: conDatos.length
        ? conDatos.reduce<string | null>((m, e) => (e.estado?.visto_en && (!m || e.estado.visto_en > m) ? e.estado.visto_en : m), null)
        : ents.reduce<string | null>((m, e) => (ultimoBueno[e.id] && (!m || ultimoBueno[e.id] > m) ? ultimoBueno[e.id] : m), null),
      bateria: bat && !caido(bat)
        ? { pct, critica: pct != null ? pct < 15 : bat.estado?.valor === "on" }
        : null,
      lecturas: ents.filter((e) => e.tipo_funcional !== "bateria").map(lectura).filter((l): l is Lectura => !!l),
      incidencias: incidencias.filter((i) => i.dispositivo_id && ids.has(i.dispositivo_id)),
    };
  }).sort((a, b) =>
    Number(b.incidencias.length > 0 || !b.enLinea) - Number(a.incidencias.length > 0 || !a.enLinea)
    || rango(a.tipo) - rango(b.tipo) || a.nombre.localeCompare(b.nombre, "es"));
}

/** Llegadas en las próximas 72 h a un apartamento cuya cerradura no está operativa. */
export function llegadasSinCerradura(equipos: Equipo[], reservas: Reserva[], ahora: number) {
  const cerraduraMal = equipos.some((e) => e.tipo === "cerradura" && (!e.enLinea || e.bateria?.critica));
  if (!cerraduraMal) return [];
  const limite = ahora + 72 * 3600_000;
  return reservas.filter((r) => {
    const t = new Date(r.entrada).getTime();
    return t <= limite && new Date(r.salida).getTime() >= ahora;
  });
}
