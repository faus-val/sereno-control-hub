"use client";

import { useActionState } from "react";
import { guardarContrasena } from "../recuperar/actions";

export default function NuevaContrasena() {
  const [estado, accion, enviando] = useActionState(guardarContrasena, undefined);

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <form action={accion} className="w-full max-w-sm bg-panel border border-borde rounded-2xl p-8 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-marca" aria-hidden />
            <span className="font-semibold tracking-tight text-lg">Sereno</span>
            <span className="text-suave">Control Hub</span>
          </div>
          <h1 className="font-medium mt-4">Nueva contraseña</h1>
          <p className="text-suave text-sm mt-1">Mínimo 10 caracteres.</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Contraseña nueva</span>
          <input name="password" type="password" required minLength={10} autoComplete="new-password"
            className="w-full rounded-lg border border-borde bg-fondo px-3 py-2 outline-none focus:border-marca" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Repítela</span>
          <input name="password2" type="password" required minLength={10} autoComplete="new-password"
            className="w-full rounded-lg border border-borde bg-fondo px-3 py-2 outline-none focus:border-marca" />
        </label>

        {estado?.error && <p className="text-sm text-incidencia">{estado.error}</p>}

        <button disabled={enviando}
          className="w-full rounded-lg bg-marca text-white dark:text-[#0d1512] font-medium py-2.5 disabled:opacity-60">
          {enviando ? "Guardando…" : "Guardar y entrar"}
        </button>
      </form>
    </main>
  );
}
