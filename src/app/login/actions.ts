"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function entrar(_: { error?: string } | undefined, form: FormData) {
  const sb = await crearClienteServidor();
  const { error } = await sb.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) return { error: "Email o contraseña incorrectos." };
  redirect("/");
}

export async function salir() {
  const sb = await crearClienteServidor();
  await sb.auth.signOut();
  redirect("/login");
}
