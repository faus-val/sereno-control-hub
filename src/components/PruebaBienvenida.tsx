"use client";

import { useState, useTransition } from "react";
import { Play, Tv } from "lucide-react";
import { PISTAS_BIENVENIDA, TEXTO_BIENVENIDA } from "@/lib/bienvenida";
import { probarBienvenida, type ResultadoPrueba } from "@/app/(hub)/apartamento/[id]/bienvenida";

export function PruebaBienvenida({ apartamentoId, tieneTele }: { apartamentoId: string; tieneTele: boolean }) {
  const [pista, setPista] = useState(PISTAS_BIENVENIDA[0].id);
  const [resultado, setResultado] = useState<ResultadoPrueba | null>(null);
  const [enviando, startTransition] = useTransition();
  const actual = PISTAS_BIENVENIDA.find((p) => p.id === pista) ?? PISTAS_BIENVENIDA[0];

  return (
    <section className="bg-panel border border-borde rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Tv className="size-4 text-marca" aria-hidden />
        <h2 className="font-semibold">Bienvenida en la tele</h2>
      </div>
      <p className="text-sm text-suave">{TEXTO_BIENVENIDA}</p>

      <fieldset className="grid sm:grid-cols-2 gap-2">
        <legend className="sr-only">Música de fondo</legend>
        {PISTAS_BIENVENIDA.map((p) => (
          <label key={p.id}
            className={`flex items-start gap-2 rounded-lg border px-3 py-2 cursor-pointer text-sm ${pista === p.id ? "border-marca bg-marca-suave" : "border-borde"}`}>
            <input type="radio" name="pista" value={p.id} checked={pista === p.id}
              onChange={() => { setPista(p.id); setResultado(null); }} className="mt-1 accent-[var(--marca)]" />
            <span>
              <span className="font-medium block">{p.nombre}</span>
              <span className="text-suave">{p.descripcion}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <audio key={actual.archivo} controls preload="none" src={actual.archivo} className="w-full">
        Tu navegador no puede reproducir audio.
      </audio>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={enviando}
          onClick={() => startTransition(async () => setResultado(await probarBienvenida(apartamentoId, pista)))}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-marca text-white text-sm disabled:opacity-60">
          <Play className="size-4" aria-hidden />
          {enviando ? "Enviando…" : "Probar en la tele"}
        </button>
        {!tieneTele && (
          <span className="text-xs text-suave">No hay tele registrada en este apartamento: n8n usará la tele por defecto.</span>
        )}
      </div>

      {resultado && (
        <p role="status" className={`text-sm ${resultado.ok ? "text-ok" : "text-atencion"}`}>{resultado.mensaje}</p>
      )}
    </section>
  );
}
