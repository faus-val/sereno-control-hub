"use server";

import { revalidatePath } from "next/cache";
import { crearClienteServidor } from "@/lib/supabase/server";

const PERMITIDOS = ["en_curso", "resuelta", "descartada"];

export async function cambiarEstado(form: FormData) {
  const id = String(form.get("id") ?? "");
  const estado = String(form.get("estado") ?? "");
  if (!id || !PERMITIDOS.includes(estado)) return;

  const sb = await crearClienteServidor();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return;

  // RLS decide si este usuario puede tocar la incidencia.
  await sb.from("incidencias")
    .update(estado === "en_curso" ? { estado, asignado_a: user.id } : { estado })
    .eq("id", id);

  revalidatePath("/", "layout");
}
