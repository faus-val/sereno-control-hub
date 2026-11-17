import Link from "next/link";
import { notFound } from "next/navigation";
import { cargarPanel } from "@/lib/datos";
import { EtiquetaEstado, PuntoEstado } from "@/components/Estado";
import { ListaIncidencias } from "@/components/ListaIncidencias";
import { fechaDia, hace } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Instalacion({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { instalaciones } = await cargarPanel();
  const inst = instalaciones.find((i) => i.id === id);
  if (!inst) notFound();

  const plantas = [...new Set(inst.aptos.map((a) => a.planta ?? 0))].sort((a, b) => b - a);
  const nombres = {
    inst: { [inst.id]: inst.nombre },
    apto: Object.fromEntries(inst.aptos.map((a) => [a.id, a.nombre])),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="text-sm text-suave hover:underline">← Alojamientos</Link>
        <div className="flex items-center gap-3 flex-wrap mt-1">
          <h1 className="text-2xl font-semibold tracking-tight">{inst.nombre}</h1>
          <EtiquetaEstado estado={inst.estado} />
        </div>
        <p className="text-suave text-sm">
          {[inst.direccion, inst.ciudad].filter(Boolean).join(", ") || inst.tipo}
          {" · "}{inst.aptos.length} apartamentos · {inst.dispositivos} dispositivos · último dato {hace(inst.ultimoDato)}
        </p>
      </div>

      {plantas.map((p) => (
        <section key={p}>
          {plantas.length > 1 && <h2 className="text-sm font-medium text-suave mb-2">Planta {p}</h2>}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {inst.aptos.filter((a) => (a.planta ?? 0) === p).map((a) => (
              <Link key={a.id} href={`/apartamento/${a.id}`}
                className="bg-panel border border-borde rounded-xl p-4 hover:border-marca transition-colors block">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{a.nombre}</span>
                  <PuntoEstado estado={a.estado} />
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-suave text-xs">Ocupación</div>
                    <div>{inst.modo === "solo_ha" ? "—" : a.ocupado ? "Ocupado" : "Libre"}</div>
                  </div>
                  <div>
                    <div className="text-suave text-xs">Dispositivos</div>
                    <div className="tabular-nums">
                      {a.dispositivos.length}
                      {a.caidos > 0 && <span className="text-atencion"> · {a.caidos} caídos</span>}
                    </div>
                  </div>
                  <div>
                    <div className="text-suave text-xs">Incidencias</div>
                    <div className={a.incidencias.length ? "text-incidencia font-medium" : ""}>{a.incidencias.length || "—"}</div>
                  </div>
                </div>
                {(a.reservaActual || a.proximaReserva) && (
                  <div className="mt-3 pt-3 border-t border-borde text-sm text-suave">
                    {a.reservaActual
                      ? <>Sale {fechaDia(a.reservaActual.salida)}{a.reservaActual.huesped_nombre ? ` · ${a.reservaActual.huesped_nombre}` : ""}</>
                      : <>Próxima llegada {fechaDia(a.proximaReserva!.entrada)}</>}
                  </div>
                )}
                {!a.pms && inst.modo === "servicio" && (
                  <div className="mt-3 pt-3 border-t border-borde text-xs text-suave">
                    Sin PMS: ocupación por sensor de presencia
                    {!a.dispositivos.some((d) => d.tipo_funcional === "presencia") && " (no tiene)"}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </section>
      ))}

      <section className="bg-panel border border-borde rounded-xl px-4 pb-1">
        <h2 className="font-semibold pt-4">Incidencias abiertas</h2>
        <ListaIncidencias incidencias={inst.incidencias} nombres={nombres} />
      </section>
    </div>
  );
}
