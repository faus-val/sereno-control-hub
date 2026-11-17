"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip } from "react-leaflet";
import { useRouter } from "next/navigation";
import type { Estado } from "@/lib/formato";

export type Punto = { id: string; nombre: string; lat: number; lon: number; estado: Estado; detalle: string };

const COLOR: Record<Estado, string> = {
  en_linea: "#2e8b57", atencion: "#c98a0b", incidencia: "#c2412d", sin_datos: "#8b9490",
};

export default function Mapa({ puntos }: { puntos: Punto[] }) {
  const router = useRouter();
  const bounds = puntos.length
    ? (puntos.map((p) => [p.lat, p.lon]) as [number, number][])
    : undefined;

  return (
    <MapContainer
      bounds={bounds && bounds.length > 1 ? bounds : undefined}
      boundsOptions={{ padding: [40, 40] }}
      center={bounds?.length === 1 ? bounds[0] : [40.2, -3.7]}
      zoom={bounds?.length === 1 ? 13 : 6}
      scrollWheelZoom={false}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {puntos.map((p) => (
        <CircleMarker
          key={p.id}
          center={[p.lat, p.lon]}
          radius={11}
          pathOptions={{ color: "#ffffff", weight: 3, fillColor: COLOR[p.estado], fillOpacity: 1 }}
          eventHandlers={{ click: () => router.push(`/instalacion/${p.id}`) }}
        >
          <Tooltip direction="top" offset={[0, -10]}>
            <strong>{p.nombre}</strong>
            <br />
            {p.detalle}
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
