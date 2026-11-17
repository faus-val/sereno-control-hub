"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function pedirEnlace(_: { ok?: boolean; error?: string } | undefined, form: FormData) {
  const email = String(form.get("email") ?? "").trim();
  if (!email) return { error: "Escribe tu email." };

  const h = await headers();
  const origen = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const sb = await crearClienteServidor();
  const { error } = await sb.auth.resetPasswordForEmail(email, {
    redirectTo: `${origen}/auth/callback?next=/nueva-contrasena`,
  });
  // No revelamos si el email existe o no.
  if (error && error.status === 429) return { error: "Demasiados intentos. Espera unos minutos." };
  return { ok: true };
}

export async function guardarContrasena(_: { error?: string } | undefined, form: FormData) {
  const p1 = String(form.get("password") ?? "");
  const p2 = String(form.get("password2") ?? "");
  if (p1.length < 10) return { error: "Usa al menos 10 caracteres." };
  if (p1 !== p2) return { error: "Las contraseñas no coinciden." };

  const sb = await crearClienteServidor();
  const { error } = await sb.auth.updateUser({ password: p1 });
  if (error) return { error: error.message.includes("pwned") || error.message.toLowerCase().includes("weak")
    ? "Esa contraseña es demasiado débil o ha aparecido en filtraciones. Elige otra."
    : "No se pudo guardar. Vuelve a pedir el enlace." };

  redirect("/");
}
