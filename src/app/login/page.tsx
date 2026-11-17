"use client";

import { useActionState } from "react";
import { entrar } from "./actions";

export default function Login() {
  const [estado, accion, enviando] = useActionState(entrar, undefined);

  return (
    <main className="min-h-dvh grid place-items-center px-4">
      <form action={accion} className="w-full max-w-sm bg-panel border border-borde rounded-2xl p-8 space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full bg-marca" aria-hidden />
            <span className="font-semibold tracking-tight text-lg">Sereno</span>
            <span className="text-suave">Control Hub</span>
          </div>
          <p className="text-suave text-sm mt-2">Entra con tu cuenta para ver tus alojamientos.</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Email</span>
          <input name="email" type="email" required autoComplete="email"
            className="w-full rounded-lg border border-borde bg-fondo px-3 py-2 outline-none focus:border-marca" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Contraseña</span>
          <input name="password" type="password" required autoComplete="current-password"
            className="w-full rounded-lg border border-borde bg-fondo px-3 py-2 outline-none focus:border-marca" />
        </label>

        {estado?.error && <p className="text-sm text-incidencia">{estado.error}</p>}

        <button disabled={enviando}
          className="w-full rounded-lg bg-marca text-white dark:text-[#0d1512] font-medium py-2.5 disabled:opacity-60">
          {enviando ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </main>
  );
}
