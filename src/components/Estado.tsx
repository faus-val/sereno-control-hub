import { ESTADO_TEXTO, SEVERIDAD_TEXTO, type Estado } from "@/lib/formato";

const COLOR: Record<Estado, string> = {
  en_linea: "bg-ok", atencion: "bg-atencion", incidencia: "bg-incidencia", sin_datos: "bg-sin-datos",
};

export function PuntoEstado({ estado, className = "" }: { estado: Estado; className?: string }) {
  return <span className={`inline-block size-2.5 rounded-full ${COLOR[estado]} ${className}`} aria-hidden />;
}

export function EtiquetaEstado({ estado }: { estado: Estado }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <PuntoEstado estado={estado} />
      {ESTADO_TEXTO[estado]}
    </span>
  );
}

const SEV: Record<string, string> = {
  alerta: "text-incidencia border-incidencia/40 bg-incidencia/10",
  aviso: "text-atencion border-atencion/40 bg-atencion/10",
  info: "text-suave border-borde bg-fondo",
};

export function Severidad({ valor }: { valor: string }) {
  return (
    <span className={`inline-block rounded-md border px-1.5 py-0.5 text-xs font-medium ${SEV[valor] ?? SEV.info}`}>
      {SEVERIDAD_TEXTO[valor] ?? valor}
    </span>
  );
}
