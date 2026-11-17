export type Estado = "en_linea" | "atencion" | "incidencia" | "sin_datos";

export const ESTADO_TEXTO: Record<Estado, string> = {
  en_linea: "En línea",
  atencion: "Atención",
  incidencia: "Incidencia",
  sin_datos: "Sin datos",
};

export const SEVERIDAD_TEXTO: Record<string, string> = { info: "Info", aviso: "Aviso", alerta: "Alerta" };

export const ESTADO_INC_TEXTO: Record<string, string> = {
  abierta: "Abierta",
  en_curso: "En curso",
  resuelta: "Resuelta",
  descartada: "Descartada",
};

export const TIPO_TEXTO: Record<string, string> = {
  cerradura: "Cerradura", clima: "Clima", temperatura: "Temperatura", humedad: "Humedad",
  ruido: "Ruido", ventana: "Ventana", puerta: "Puerta", consumo: "Consumo", wifi: "Wifi",
  presencia: "Presencia", bateria: "Batería", bajada: "Bajada", subida: "Subida",
  latencia: "Latencia", cortes: "Cortes", conectividad: "Conectividad",
};

const VALOR_TEXTO: Record<string, string> = {
  on: "Sí", off: "No", unavailable: "No disponible", unknown: "Desconocido",
  locked: "Cerrada", unlocked: "Abierta", heat: "Calefacción", cool: "Frío", auto: "Auto",
};

export function valorLegible(tipo: string, valor: string | null, unidad?: string | null) {
  if (valor == null) return "—";
  if (tipo === "puerta" || tipo === "ventana") {
    if (valor === "on") return "Abierta";
    if (valor === "off") return "Cerrada";
  }
  if (tipo === "presencia") {
    if (valor === "on") return "Detectada";
    if (valor === "off") return "Sin presencia";
  }
  if (tipo === "conectividad") {
    if (valor === "on") return "Conectado";
    if (valor === "off") return "Desconectado";
  }
  if (VALOR_TEXTO[valor]) return VALOR_TEXTO[valor];
  const n = Number(valor);
  if (!Number.isNaN(n) && valor.trim() !== "") {
    const r = Math.abs(n) >= 100 ? Math.round(n) : Math.round(n * 10) / 10;
    return `${r.toLocaleString("es-ES")}${unidad ? ` ${unidad}` : ""}`;
  }
  return valor;
}

const fmt = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Madrid",
});
const fmtDia = new Intl.DateTimeFormat("es-ES", {
  weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Madrid",
});

export const fechaHora = (s: string | null) => (s ? fmt.format(new Date(s)) : "—");
export const fechaDia = (s: string | null) => (s ? fmtDia.format(new Date(s)) : "—");

export function hace(s: string | null) {
  if (!s) return "—";
  const min = Math.round((Date.now() - new Date(s).getTime()) / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 48) return `hace ${h} h`;
  return `hace ${Math.round(h / 24)} días`;
}

export function estadoDe(opts: { abiertasAlerta: number; abiertas: number; ultimoDato: string | null; caidos?: number }): Estado {
  if (!opts.ultimoDato || Date.now() - new Date(opts.ultimoDato).getTime() > 15 * 60000) return "sin_datos";
  if (opts.abiertasAlerta > 0) return "incidencia";
  if (opts.abiertas > 0 || (opts.caidos ?? 0) > 0) return "atencion";
  return "en_linea";
}

export const haceDias = (dias: number) => new Date(Date.now() - dias * 86400_000).toISOString();
