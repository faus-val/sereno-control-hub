// Mensajes de bienvenida que se reproducen en la tele del apartamento.
// Los audios viven en /public/audio y se sirven desde la propia app,
// así Home Assistant (y el TV Box) pueden descargarlos por URL.

export type PistaBienvenida = { id: string; nombre: string; archivo: string; descripcion: string };

export const PISTAS_BIENVENIDA: PistaBienvenida[] = [
  { id: "sunlit", nombre: "Aitana · Welcome Home, Sunlit", archivo: "/audio/bienvenida-sunlit.mp3", descripcion: "Acústica y luminosa" },
  { id: "folk", nombre: "Aitana · Welcome Home", archivo: "/audio/bienvenida-folk.mp3", descripcion: "Ambiental con toque folk" },
];

export const TEXTO_BIENVENIDA =
  "¡Hola, y bienvenidos! Nos alegra mucho teneros aquí. En la pantalla tenéis un código QR con la wifi y la guía del apartamento. " +
  "Si necesitáis cualquier cosa, escribidnos o llamadnos: estamos para ayudaros. Poneos cómodos… y disfrutad de vuestra estancia.";
