"use client";

import dynamic from "next/dynamic";
import type { Punto } from "./Mapa";

// Leaflet usa window: solo en el navegador.
const Mapa = dynamic(() => import("./Mapa"), {
  ssr: false,
  loading: () => <div className="h-full w-full rounded-xl bg-marca-suave animate-pulse" />,
});

export default function MapaCliente({ puntos }: { puntos: Punto[] }) {
  return <Mapa puntos={puntos} />;
}
