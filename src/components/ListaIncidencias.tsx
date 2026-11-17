import Link from "next/link";
import { Severidad } from "./Estado";
import { ESTADO_INC_TEXTO, hace } from "@/lib/formato";
import type { Incidencia } from "@/lib/datos";
import { cambiarEstado } from "@/app/(hub)/incidencias/actions";

type Nombres = { inst: Record<string, string>; apto: Record<string, string> };

export function ListaIncidencias({
  incidencias, nombres, acciones = true, vacio = "No hay incidencias abiertas.",
}: { incidencias: Incidencia[]; nombres: Nombres; acciones?: boolean; vacio?: string }) {
  if (!incidencias.length) {
    return <p className="text-suave text-sm py-6 text-center">{vacio}</p>;
  }
  return (
    <ul className="divide-y divide-borde">
      {incidencias.map((i) => {
        const donde = [i.instalacion_id && nombres.inst[i.instalacion_id], i.apartamento_id && nombres.apto[i.apartamento_id]]
          .filter(Boolean).filter((v, k, arr) => arr.indexOf(v) === k).join(" · ");
        return (
          <li key={i.id} className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Severidad valor={i.severidad} />
                <span className="font-medium">{i.titulo}</span>
              </div>
              <div className="text-sm text-suave mt-0.5">
                {donde && (
                  <Link className="hover:underline" href={i.apartamento_id ? `/apartamento/${i.apartamento_id}` : `/instalacion/${i.instalacion_id}`}>
                    {donde}
                  </Link>
                )}
                {donde && " · "}
                {hace(i.abierta_en)} · {ESTADO_INC_TEXTO[i.estado]}
                {i.descripcion && <> · {i.descripcion}</>}
              </div>
            </div>
            {acciones && (i.estado === "abierta" || i.estado === "en_curso") && (
              <form action={cambiarEstado} className="flex gap-2 shrink-0">
                <input type="hidden" name="id" value={i.id} />
                {i.estado === "abierta" && (
                  <button name="estado" value="en_curso" className="text-sm px-3 py-1.5 rounded-md border border-borde hover:bg-marca-suave">
                    Me encargo
                  </button>
                )}
                <button name="estado" value="resuelta" className="text-sm px-3 py-1.5 rounded-md bg-marca text-white dark:text-[#0d1512]">
                  Resuelta
                </button>
                <button name="estado" value="descartada" className="text-sm px-3 py-1.5 rounded-md text-suave hover:bg-marca-suave">
                  Descartar
                </button>
              </form>
            )}
          </li>
        );
      })}
    </ul>
  );
}
