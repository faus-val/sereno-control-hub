import Link from "next/link";
import { notFound } from "next/navigation";
import { cargarPanel } from "@/lib/datos";
import { EtiquetaEstado } from "@/components/Estado";
import { ListaIncidencias } from "@/components/ListaIncidencias";
import { ahoraMs, fechaDia, fechaHora, hace } from "@/lib/formato";
import { agruparEquipos, llegadasSinCerradura } from "@/lib/equipos";
import { TablaEquipos } from "@/components/TablaEquipos";

export const dynamic = "force-dynamic";

export default async function Apartamento({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { instalaciones, reservas } = await cargarPanel();
  const inst = instalaciones.find((i) => i.aptos.some((a) => a.id === id));
  const apto = inst?.aptos.find((a) => a.id === id);
  if (!inst || !apto) notFound();

  const proximas = reservas.filter((r) => r.apartamento_id === apto.id).slice(0, 5);
  const equipos = agruparEquipos(apto.dispositivos, apto.incidencias);
  const sinCerradura = llegadasSinCerradura(equipos, proximas, ahoraMs());
  const nombres = { inst: { [inst.id]: inst.nombre }, apto: { [apto.id]: apto.nombre } };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/instalacion/${inst.id}`} className="text-sm text-suave hover:underline">← {inst.nombre}</Link>
        <div className="flex items-center gap-3 flex-wrap mt-1">
          <h1 className="text-2xl font-semibold tracking-tight">{apto.nombre}</h1>
          <EtiquetaEstado estado={apto.estado} />
          {inst.modo === "servicio" && (
            <span className={`text-sm px-2 py-0.5 rounded-md border ${apto.ocupado ? "border-marca text-marca" : "border-borde text-suave"}`}>
              {apto.ocupado ? "Ocupado" : "Libre"}
            </span>
          )}
        </div>
        <p className="text-suave text-sm">
          {apto.pms ? `PMS ${apto.pms} · ${apto.pms_id}` : "Sin PMS"} · {apto.dispositivos.length} dispositivos · último dato {hace(apto.ultimoDato)}
        </p>
      </div>

      <TablaEquipos equipos={equipos} sinCerradura={sinCerradura} nombreApto={apto.nombre} />

      <div className="grid lg:grid-cols-2 gap-4">
        <section className="bg-panel border border-borde rounded-xl p-4">
          <h2 className="font-semibold mb-2">Reservas</h2>
          {!apto.pms ? (
            <p className="text-sm text-suave">Este apartamento no está conectado a un PMS. La ocupación se deduce de los sensores de presencia.</p>
          ) : proximas.length ? (
            <ul className="divide-y divide-borde">
              {proximas.map((r) => {
                const actual = r.entrada <= new Date().toISOString();
                return (
                  <li key={r.id} className="py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate">{r.huesped_nombre ?? "Huésped"}</span>
                      {actual && <span className="text-xs text-marca border border-marca rounded px-1.5">Ahora</span>}
                    </div>
                    <div className="text-sm text-suave">
                      {fechaDia(r.entrada)} → {fechaDia(r.salida)}
                      {r.huespedes ? ` · ${r.huespedes} pers.` : ""}
                      {r.canal ? ` · ${r.canal}` : ""}
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-suave">Sin reservas próximas.</p>
          )}
        </section>

        <section className="bg-panel border border-borde rounded-xl px-4 pb-1">
          <h2 className="font-semibold pt-4">Incidencias abiertas</h2>
          <ListaIncidencias incidencias={apto.incidencias} nombres={nombres} />
        </section>
      </div>

      <p className="text-xs text-suave">Actualizado {fechaHora(new Date().toISOString())}</p>
    </div>
  );
}
