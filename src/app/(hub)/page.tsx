import Link from "next/link";
import { cargarPanel } from "@/lib/datos";
import { EtiquetaEstado } from "@/components/Estado";
import { ListaIncidencias } from "@/components/ListaIncidencias";
import MapaCliente from "@/components/MapaCliente";
import { ESTADO_TEXTO, fechaDia, hace } from "@/lib/formato";

export const dynamic = "force-dynamic";

export default async function Global() {
  const { instalaciones, incidencias, reservas } = await cargarPanel();
  const servicio = instalaciones.filter((i) => i.modo === "servicio");
  const aptos = servicio.flatMap((i) => i.aptos);
  const ocupados = aptos.filter((a) => a.ocupado).length;
  const alertas = incidencias.filter((i) => i.severidad === "alerta").length;
  const proximasLlegadas = reservas.filter((r) => r.entrada > new Date().toISOString()).slice(0, 4);

  const nombres = {
    inst: Object.fromEntries(instalaciones.map((i) => [i.id, i.nombre])),
    apto: Object.fromEntries(instalaciones.flatMap((i) => i.aptos.map((a) => [a.id, a.nombre]))),
  };
  const aptoInst = Object.fromEntries(instalaciones.flatMap((i) => i.aptos.map((a) => [a.id, i.nombre])));

  const puntos = instalaciones.filter((i) => i.lat != null && i.lon != null).map((i) => ({
    id: i.id, nombre: i.nombre, lat: i.lat!, lon: i.lon!, estado: i.estado,
    detalle: `${ESTADO_TEXTO[i.estado]} · ${i.aptos.length} aptos · ${i.incidencias.length} incidencias`,
  }));

  const kpis = [
    { valor: servicio.length, texto: "Instalaciones" },
    { valor: aptos.length, texto: "Apartamentos" },
    { valor: `${ocupados}/${aptos.length}`, texto: "Ocupados ahora" },
    { valor: incidencias.length, texto: "Incidencias abiertas", tono: alertas ? "text-incidencia" : "" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tus alojamientos</h1>
          <p className="text-suave text-sm">Estado en tiempo real de todas las instalaciones.</p>
        </div>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {kpis.map((k) => (
          <div key={k.texto} className="bg-panel border border-borde rounded-xl p-4">
            <div className={`text-3xl font-semibold tabular-nums ${k.tono ?? ""}`}>{k.valor}</div>
            <div className="text-sm text-suave mt-1">{k.texto}</div>
          </div>
        ))}
      </section>

      <section className="grid lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 bg-panel border border-borde rounded-xl p-2 h-[380px]">
          <MapaCliente puntos={puntos} />
        </div>
        <div className="lg:col-span-2 bg-panel border border-borde rounded-xl p-4">
          <h2 className="font-semibold mb-2">Próximas llegadas</h2>
          {proximasLlegadas.length ? (
            <ul className="divide-y divide-borde">
              {proximasLlegadas.map((r) => (
                <li key={r.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{r.huesped_nombre ?? "Huésped"}</div>
                    <div className="text-sm text-suave truncate">
                      {r.apartamento_id ? aptoInst[r.apartamento_id] : "Sin asignar"}
                      {r.huespedes ? ` · ${r.huespedes} pers.` : ""}
                      {r.canal ? ` · ${r.canal}` : ""}
                    </div>
                  </div>
                  <div className="text-sm text-right shrink-0">{fechaDia(r.entrada)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-suave py-6 text-center">No hay llegadas próximas.</p>
          )}
        </div>
      </section>

      <section className="bg-panel border border-borde rounded-xl">
        <h2 className="font-semibold px-4 pt-4">Instalaciones</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-suave">
              <tr className="border-b border-borde">
                <th className="font-medium px-4 py-2.5">Nombre</th>
                <th className="font-medium px-4 py-2.5">Estado</th>
                <th className="font-medium px-4 py-2.5 hidden sm:table-cell">Ciudad</th>
                <th className="font-medium px-4 py-2.5 text-right">Aptos</th>
                <th className="font-medium px-4 py-2.5 text-right hidden md:table-cell">Ocupados</th>
                <th className="font-medium px-4 py-2.5 text-right hidden md:table-cell">Dispositivos</th>
                <th className="font-medium px-4 py-2.5 text-right">Incidencias</th>
                <th className="font-medium px-4 py-2.5 hidden lg:table-cell">Último dato</th>
              </tr>
            </thead>
            <tbody>
              {instalaciones.map((i) => (
                <tr key={i.id} className="border-b border-borde last:border-0 hover:bg-marca-suave/60">
                  <td className="px-4 py-3">
                    <Link href={`/instalacion/${i.id}`} className="font-medium hover:underline">{i.nombre}</Link>
                    {i.modo === "solo_ha" && <span className="ml-2 text-xs text-suave border border-borde rounded px-1.5 py-0.5">Solo HA</span>}
                  </td>
                  <td className="px-4 py-3"><EtiquetaEstado estado={i.estado} /></td>
                  <td className="px-4 py-3 hidden sm:table-cell text-suave">{i.ciudad ?? "—"}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{i.aptos.length}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">{i.modo === "solo_ha" ? "—" : i.ocupados}</td>
                  <td className="px-4 py-3 text-right tabular-nums hidden md:table-cell">
                    {i.dispositivos}
                    {i.caidos > 0 && <span className="text-atencion"> ({i.caidos} caídos)</span>}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{i.incidencias.length || "—"}</td>
                  <td className="px-4 py-3 hidden lg:table-cell text-suave">{hace(i.ultimoDato)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-panel border border-borde rounded-xl px-4 pb-1">
        <div className="flex items-center justify-between pt-4">
          <h2 className="font-semibold">Incidencias abiertas</h2>
          <Link href="/incidencias" className="text-sm text-marca hover:underline">Ver todas</Link>
        </div>
        <ListaIncidencias incidencias={incidencias.slice(0, 6)} nombres={nombres} />
      </section>
    </div>
  );
}
