import Link from "next/link";
import { crearClienteServidor } from "@/lib/supabase/server";
import { salir } from "@/app/login/actions";

export default async function HubLayout({ children }: { children: React.ReactNode }) {
  const sb = await crearClienteServidor();
  const [{ data: { user } }, { count }] = await Promise.all([
    sb.auth.getUser(),
    sb.from("incidencias").select("id", { count: "exact", head: true }).in("estado", ["abierta", "en_curso"]),
  ]);

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-[1000] border-b border-borde bg-panel/90 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 h-14 flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span className="size-3 rounded-full bg-marca" aria-hidden />
            <span className="font-semibold tracking-tight">Sereno</span>
            <span className="text-suave hidden sm:inline">Control Hub</span>
          </Link>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/" className="px-3 py-1.5 rounded-md hover:bg-marca-suave">Alojamientos</Link>
            <Link href="/incidencias" className="px-3 py-1.5 rounded-md hover:bg-marca-suave inline-flex items-center gap-1.5">
              Incidencias
              {!!count && (
                <span className="min-w-5 h-5 px-1 rounded-full bg-incidencia text-white text-xs grid place-items-center">{count}</span>
              )}
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span className="text-suave hidden md:inline truncate max-w-56">{user?.email}</span>
            <form action={salir}>
              <button className="px-3 py-1.5 rounded-md border border-borde hover:bg-marca-suave">Salir</button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
