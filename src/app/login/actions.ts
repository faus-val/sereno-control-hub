"use server";

import { redirect } from "next/navigation";
import { crearClienteServidor } from "@/lib/supabase/server";

export async function entrar(_: { error?: string } | undefined, form: FormData) {
  const sb = await crearClienteServidor();
  const { error } = await sb.auth.signInWithPassword({
    email: String(form.get("email") ?? ""),
    password: String(form.get("password") ?? ""),
  });
  if (error) {
    // Si había otra sesión abierta en este navegador, se cierra: quien está en el login quiere entrar con otra credencial.
    await sb.auth.signOut();
    return { error: "Email o contraseña incorrectos." };
  }
  redirect("/");
}

export async function salir() {
  const sb = await crearClienteServidor();
  await sb.auth.signOut();
  redirect("/login");
}
