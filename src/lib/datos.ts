import { crearClienteServidor } from "@/lib/supabase/server";
import { estadoDe, type Estado } from "@/lib/formato";

export type Instalacion = {
  id: string; nombre: string; tipo: string; lat: number | null; lon: number | null;
  ciudad: string | null; provincia: string | null; direccion: string | null; modo: string; cliente_id: string;
};
export type Apartamento = {
  id: string; instalacion_id: string; nombre: string; planta: number | null; posicion: number | null;
  pms: string | null; pms_id: string | null; superficie_m2: number | null;
};
export type Dispositivo = {
  id: string; apartamento_id: string; entity_id: string; tipo_funcional: string; nombre_visible: string | null;
  unidad: string | null; habitacion: string | null; activo: boolean; equipo: string | null;
  estado: { valor: string | null; visto_en: string | null } | null;
};
export type Incidencia = {
  id: string; cliente_id: string; instalacion_id: string | null; apartamento_id: string | null;
  dispositivo_id: string | null; titulo: string; descripcion: string | null; severidad: string;
  estado: string; origen: string; asignado_a: string | null; abierta_en: string; resuelta_en: string | null; notas: string | null;
};
export type Reserva = {
  id: string; apartamento_id: string | null; estado: string; entrada: string; salida: string;
  huesped_nombre: string | null; huespedes: number | null; canal: string | null;
};

export type ResumenApto = Apartamento & {
  dispositivos: Dispositivo[]; incidencias: Incidencia[]; estado: Estado; ultimoDato: string | null;
  caidos: number; ocupado: boolean; reservaActual: Reserva | null; proximaReserva: Reserva | null;
};
export type ResumenInst = Instalacion & {
  aptos: ResumenApto[]; incidencias: Incidencia[]; estado: Estado; ultimoDato: string | null;
  ocupados: number; dispositivos: number; caidos: number;
};

const max = (a: string | null, b: string | null) => (!a ? b : !b ? a : a > b ? a : b);

export async function cargarPanel() {
  const sb = await crearClienteServidor();
  const ahora = new Date().toISOString();

  const [inst, aptos, disp, inc, res, user] = await Promise.all([
    sb.from("instalaciones").select("id,nombre,tipo,lat,lon,ciudad,provincia,direccion,modo,cliente_id").eq("activa", true).order("nombre"),
    sb.from("apartamentos").select("id,instalacion_id,nombre,planta,posicion,pms,pms_id,superficie_m2").order("nombre"),
    sb.from("dispositivos").select("id,apartamento_id,entity_id,tipo_funcional,nombre_visible,unidad,habitacion,activo,equipo,estado:estados(valor,visto_en)").eq("activo", true),
    sb.from("incidencias").select("*").in("estado", ["abierta", "en_curso"]).order("abierta_en", { ascending: false }),
    sb.from("reservas").select("id,apartamento_id,estado,entrada,salida,huesped_nombre,huespedes,canal")
      .in("estado", ["confirmada", "pendiente"]).gte("salida", ahora).order("entrada"),
    sb.auth.getUser(),
  ]);

  const dispositivos = (disp.data ?? []).map((d) => ({
    ...d,
    estado: Array.isArray(d.estado) ? (d.estado[0] ?? null) : d.estado,
  })) as Dispositivo[];
  const incidencias = (inc.data ?? []) as Incidencia[];
  const reservas = (res.data ?? []) as Reserva[];

  // Presencia reciente para apartamentos sin PMS
  const idsPresencia = dispositivos.filter((d) => d.tipo_funcional === "presencia").map((d) => d.id);
  const presenciaReciente = new Set<string>();
  if (idsPresencia.length) {
    const { data: ev } = await sb.from("eventos").select("dispositivo_id")
      .in("dispositivo_id", idsPresencia).eq("valor_nuevo", "on")
      .gte("ocurrido_en", new Date(Date.now() - 3 * 3600_000).toISOString());
    ev?.forEach((e) => e.dispositivo_id && presenciaReciente.add(e.dispositivo_id));
  }

  const resumenAptos: ResumenApto[] = ((aptos.data ?? []) as Apartamento[]).map((a) => {
    const ds = dispositivos.filter((d) => d.apartamento_id === a.id);
    const is = incidencias.filter((i) => i.apartamento_id === a.id);
    const rs = reservas.filter((r) => r.apartamento_id === a.id);
    const reservaActual = rs.find((r) => r.entrada <= ahora && r.salida >= ahora) ?? null;
    const proximaReserva = rs.find((r) => r.entrada > ahora) ?? null;
    const ultimoDato = ds.reduce<string | null>((m, d) => max(m, d.estado?.visto_en ?? null), null);
    const caidos = ds.filter((d) => d.estado?.valor === "unavailable").length;
    const presencia = ds.some((d) => d.tipo_funcional === "presencia" && (d.estado?.valor === "on" || presenciaReciente.has(d.id)));
    const ocupado = !!reservaActual || (!a.pms && presencia);
    return {
      ...a, dispositivos: ds, incidencias: is, ultimoDato, caidos, ocupado, reservaActual, proximaReserva,
      estado: estadoDe({ abiertasAlerta: is.filter((i) => i.severidad === "alerta").length, abiertas: is.length, ultimoDato, caidos }),
    };
  });

  const resumenInst: ResumenInst[] = ((inst.data ?? []) as Instalacion[]).map((i) => {
    const as = resumenAptos.filter((a) => a.instalacion_id === i.id)
      .sort((x, y) => (y.planta ?? 0) - (x.planta ?? 0) || (x.posicion ?? 0) - (y.posicion ?? 0) || x.nombre.localeCompare(y.nombre, "es", { numeric: true }));
    const is = incidencias.filter((x) => x.instalacion_id === i.id);
    const ultimoDato = as.reduce<string | null>((m, a) => max(m, a.ultimoDato), null);
    const caidos = as.reduce((s, a) => s + a.caidos, 0);
    const soloHa = i.modo === "solo_ha";
    return {
      ...i, aptos: as, incidencias: is, ultimoDato, caidos,
      ocupados: soloHa ? 0 : as.filter((a) => a.ocupado).length,
      dispositivos: as.reduce((s, a) => s + a.dispositivos.length, 0),
      estado: estadoDe({ abiertasAlerta: is.filter((x) => x.severidad === "alerta").length, abiertas: is.length, ultimoDato, caidos: soloHa ? 0 : caidos }),
    };
  });

  return { instalaciones: resumenInst, incidencias, reservas, usuario: user.data.user };
}
