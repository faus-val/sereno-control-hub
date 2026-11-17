"use client";

import Link from "next/link";
import { useActionState } from "react";
import { pedirEnlace } from "./actions";

export default function Recuperar() {
  const [estado, accion, enviando] = useActionState(pedirEnlace, undefined);

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <form action={accion} className="w-full max-w-sm bg-panel border border-borde rounded-2xl p-8 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-marca" aria-hidden />
            <span className="font-semibold tracking-tight text-lg">Sereno</span>
            <span className="text-suave">Control Hub</span>
          </div>
          <h1 className="font-medium mt-4">Recuperar contraseña</h1>
          <p className="text-suave text-sm mt-1">Te enviamos un enlace para crear una nueva.</p>
        </div>

        {estado?.ok ? (
          <p className="text-sm bg-marca-suave rounded-lg p-3">
            Si el email tiene cuenta, te llegará un enlace en unos minutos. Ábrelo en este mismo navegador.
          </p>
        ) : (
          <>
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Email</span>
              <input name="email" type="email" required autoComplete="email"
                className="w-full rounded-lg border border-borde bg-fondo px-3 py-2 outline-none focus:border-marca" />
            </label>
            {estado?.error && <p className="text-sm text-incidencia">{estado.error}</p>}
            <button disabled={enviando}
              className="w-full rounded-lg bg-marca text-white dark:text-[#0d1512] font-medium py-2.5 disabled:opacity-60">
              {enviando ? "Enviando…" : "Enviar enlace"}
            </button>
          </>
        )}

        <Link href="/login" className="block text-center text-sm text-suave hover:underline">Volver a entrar</Link>
      </form>
    </main>
  );
}
