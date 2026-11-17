import {
  AlertTriangle, BatteryLow, BatteryMedium, BatteryWarning, DoorOpen, Droplets, Gauge, Home,
  Lock, LockOpen, PanelTop, PersonStanding, Plug, Router, Thermometer, Volume2, WifiOff, Wind, Zap, MapPinOff, Cpu,
} from "lucide-react";
import type { ComponentType } from "react";
import { hace, fechaHora } from "@/lib/formato";
import type { Equipo, Lectura } from "@/lib/equipos";
import type { Reserva } from "@/lib/datos";

type Icono = ComponentType<{ className?: string; strokeWidth?: number }>;

const ICONO: Record<string, { Icono: Icono; color: string }> = {
  cerradura: { Icono: Lock, color: "text-ok bg-ok/10" },
  puerta: { Icono: DoorOpen, color: "text-marca bg-marca-suave" },
  ventana: { Icono: PanelTop, color: "text-marca bg-marca-suave" },
  presencia: { Icono: PersonStanding, color: "text-[#7c5cd6] bg-[#7c5cd6]/10" },
  clima: { Icono: Wind, color: "text-[#2f74c0] bg-[#2f74c0]/10" },
  temperatura: { Icono: Thermometer, color: "text-[#d26a2c] bg-[#d26a2c]/10" },
  humedad: { Icono: Droplets, color: "text-[#2f74c0] bg-[#2f74c0]/10" },
  ruido: { Icono: Volume2, color: "text-atencion bg-atencion/10" },
  consumo: { Icono: Zap, color: "text-atencion bg-atencion/10" },
  conectividad: { Icono: Router, color: "text-suave bg-fondo" },
  wifi: { Icono: Router, color: "text-suave bg-fondo" },
  bajada: { Icono: Gauge, color: "text-suave bg-fondo" },
  bateria: { Icono: BatteryMedium, color: "text-suave bg-fondo" },
};
const icono = (t: string) => ICONO[t] ?? { Icono: Cpu, color: "text-suave bg-fondo" };

const TONO: Record<Lectura["tono"], string> = {
  ok: "border-ok/40 bg-ok/10 text-ok",
  aviso: "border-atencion/40 bg-atencion/10 text-atencion",
  alerta: "border-incidencia/40 bg-incidencia/10 text-incidencia",
  info: "border-[#2f74c0]/30 bg-[#2f74c0]/10 text-[#2f74c0]",
  neutro: "border-borde bg-fondo text-texto",
};

function Chip({ l }: { l: Lectura }) {
  const I = l.tipo === "cerradura" ? (l.texto === "Abierta" ? LockOpen : Lock)
    : l.tipo === "temperatura" ? Thermometer : l.tipo === "humedad" ? Droplets
    : l.tipo === "consumo" ? Plug : l.tipo === "presencia" ? PersonStanding : null;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ${TONO[l.tono]}`}>
      {I && <I className="size-3.5" strokeWidth={2} />}
      {l.texto}
    </span>
  );
}

function Bateria({ b }: { b: Equipo["bateria"] }) {
  if (!b) return <span className="text-suave">—</span>;
  if (b.pct == null) {
    return b.critica
      ? <span className="inline-flex items-center gap-1.5 text-incidencia font-medium"><BatteryWarning className="size-4" />Crítica</span>
      : <span className="inline-flex items-center gap-1.5"><BatteryMedium className="size-4 text-suave" />OK</span>;
  }
  const color = b.critica ? "bg-incidencia" : b.pct < 30 ? "bg-atencion" : "bg-texto";
  return (
    <span className={`inline-flex items-center gap-2 ${b.critica ? "text-incidencia" : ""}`}>
      {b.critica ? <BatteryWarning className="size-4" /> : <BatteryMedium className="size-4 text-suave" />}
      <span className="w-16 h-1.5 rounded-full bg-borde overflow-hidden">
        <span className={`block h-full rounded-full ${color}`} style={{ width: `${Math.max(4, Math.min(100, b.pct))}%` }} />
      </span>
      <span className="tabular-nums text-sm">{Math.round(b.pct)}%</span>
    </span>
  );
}

function Tarjeta({ n, texto, Icono, tono }: { n: number; texto: string; Icono: Icono; tono: string }) {
  return (
    <div className="relative bg-panel border border-borde rounded-xl px-3 py-3 flex flex-col items-center justify-center text-center min-h-24">
      <span className={`absolute top-2 right-2 text-xs font-medium tabular-nums rounded-md px-1.5 ${n ? "bg-fondo" : "text-suave"}`}>{n}</span>
      <span className={`size-9 rounded-full grid place-items-center ${n ? tono : "bg-fondo text-suave"}`}>
        <Icono className="size-4.5" strokeWidth={2} />
      </span>
      <span className="text-sm mt-2 leading-tight">{texto}</span>
    </div>
  );
}

export function TablaEquipos({ equipos, sinCerradura, nombreApto }: {
  equipos: Equipo[]; sinCerradura: Reserva[]; nombreApto: string;
}) {
  const atencion = equipos.filter((e) => e.incidencias.length > 0).length;
  const sinConexion = equipos.filter((e) => !e.enLinea).length;
  const bateriaBaja = equipos.filter((e) => e.bateria?.critica).length;
  const sinEstancia = equipos.filter((e) => !e.estancia).length;

  return (
    <section className="bg-panel border border-borde rounded-2xl p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Dispositivos</h2>
        <span className="text-sm text-suave">{equipos.length} equipos</span>
      </div>

      <div className="grid gap-3 lg:grid-cols-[repeat(4,minmax(0,8rem))_1fr] grid-cols-2 sm:grid-cols-4">
        <Tarjeta n={atencion} texto="Requieren atención" Icono={AlertTriangle} tono="bg-atencion/15 text-atencion" />
        <Tarjeta n={sinConexion} texto="Sin conexión" Icono={WifiOff} tono="bg-sin-datos/20 text-texto" />
        <Tarjeta n={bateriaBaja} texto="Batería baja" Icono={BatteryLow} tono="bg-incidencia/15 text-incidencia" />
        <Tarjeta n={sinEstancia} texto="Sin estancia asignada" Icono={MapPinOff} tono="bg-atencion/15 text-atencion" />

        <div className={`col-span-2 sm:col-span-4 lg:col-span-1 rounded-xl border p-4 ${sinCerradura.length ? "border-atencion/40 bg-atencion/10" : "border-borde bg-fondo"}`}>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="font-medium">Llegadas sin cerradura operativa</span>
            <span className="text-xs text-suave">Próximas 72 h</span>
          </div>
          {sinCerradura.length ? (
            <ul className="mt-2 space-y-2">
              {sinCerradura.map((r) => (
                <li key={r.id} className="bg-panel border border-borde rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{r.huesped_nombre ?? "Huésped"}</span>
                      <span className="text-xs rounded px-1.5 py-0.5 bg-incidencia/10 text-incidencia font-medium shrink-0">Cerradura caída</span>
                    </div>
                    <div className="text-xs text-suave truncate">{nombreApto} · llega {fechaHora(r.entrada)}</div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-suave mt-2">Ninguna llegada afectada.</p>
          )}
        </div>
      </div>

      <div className="overflow-x-auto -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[860px]">
          <thead>
            <tr className="text-left text-suave border-b border-borde">
              <th className="font-medium px-4 py-2.5">Equipo</th>
              <th className="font-medium px-3 py-2.5">Estado</th>
              <th className="font-medium px-3 py-2.5">Última señal</th>
              <th className="font-medium px-3 py-2.5">Batería</th>
              <th className="font-medium px-3 py-2.5">Lectura / control</th>
              <th className="font-medium px-3 py-2.5">Estancia</th>
            </tr>
          </thead>
          <tbody>
            {equipos.map((e) => {
              const { Icono, color } = icono(e.tipo);
              const atencion = e.incidencias.length > 0;
              return (
                <tr key={e.clave} className="border-b border-borde last:border-0 hover:bg-marca-suave/50 align-middle">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`size-8 rounded-full grid place-items-center shrink-0 ${color}`}>
                        <Icono className="size-4" strokeWidth={2} />
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{e.nombre}</span>
                          {atencion && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-atencion/40 bg-atencion/10 text-atencion px-1.5 py-0.5 text-xs font-medium"
                              title={e.incidencias.map((i) => i.titulo).join("\n")}>
                              <AlertTriangle className="size-3" /> Requiere atención
                            </span>
                          )}
                        </div>
                        {e.entidades.length > 1 && (
                          <div className="text-xs text-suave">{e.entidades.length} sensores</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {e.enLinea ? (
                      <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${e.parcial ? "border-atencion/40 bg-atencion/10 text-atencion" : "border-ok/40 bg-ok/10 text-ok"}`}>
                        <span className={`size-1.5 rounded-full ${e.parcial ? "bg-atencion" : "bg-ok"}`} />
                        {e.parcial ? "Parcial" : "En línea"}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-borde bg-fondo px-2.5 py-0.5 text-xs font-medium text-suave">
                        <span className="size-1.5 rounded-full bg-sin-datos" />Sin conexión
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-suave whitespace-nowrap">{hace(e.ultimo)}</td>
                  <td className="px-3 py-3 whitespace-nowrap"><Bateria b={e.bateria} /></td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {e.lecturas.length ? e.lecturas.map((l, i) => <Chip key={i} l={l} />) : <span className="text-suave">—</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    {e.estancia ? (
                      <span className="inline-flex items-center gap-1.5"><Home className="size-3.5 text-suave" />{e.estancia}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-atencion text-xs"><AlertTriangle className="size-3.5" />Asignar estancia</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
