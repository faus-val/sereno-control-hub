import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { ListaIncidencias } from "@/components/ListaIncidencias";
import type { Incidencia } from "@/lib/datos";
import { haceDias } from "@/lib/formato";

export const dynamic = "force-dynamic";

const FILTROS = [
  { clave: "abiertas", texto: "Abiertas", estados: ["abierta", "en_curso"] },
  { clave: "cerradas", texto: "Cerradas (7 días)", estados: ["resuelta", "descartada"] },
];

export default async function Incidencias({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
  const { ver = "abiertas" } = await searchParams;
  const filtro = FILTROS.find((f) => f.clave === ver) ?? FILTROS[0];
  const sb = await crearClienteServidor();

  let q = sb.from("incidencias").select("*").in("estado", filtro.estados).order("abierta_en", { ascending: false }).limit(200);
  if (filtro.clave === "cerradas") q = q.gte("abierta_en", haceDias(7));

  const [{ data }, inst, aptos] = await Promise.all([
    q,
    sb.from("instalaciones").select("id,nombre"),
    sb.from("apartamentos").select("id,nombre"),
  ]);
  const nombres = {
    inst: Object.fromEntries((inst.data ?? []).map((i) => [i.id, i.nombre])),
    apto: Object.fromEntries((aptos.data ?? []).map((a) => [a.id, a.nombre])),
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Incidencias</h1>
      <div className="flex gap-2">
        {FILTROS.map((f) => (
          <Link key={f.clave} href={`/incidencias?ver=${f.clave}`}
            className={`text-sm px-3 py-1.5 rounded-md border ${f.clave === filtro.clave ? "border-marca bg-marca-suave" : "border-borde hover:bg-marca-suave"}`}>
            {f.texto}
          </Link>
        ))}
      </div>
      <section className="bg-panel border border-borde rounded-xl px-4">
        <ListaIncidencias
          incidencias={(data ?? []) as Incidencia[]}
          nombres={nombres}
          acciones={filtro.clave === "abiertas"}
          vacio={filtro.clave === "abiertas" ? "Todo en orden: no hay incidencias abiertas." : "No hay incidencias cerradas esta semana."}
        />
      </section>
    </div>
  );
}
