import type {
  AreaStem,
  Dictamen,
  EstadoAplicacion,
  Nivel,
  Rol,
  Tecnologia,
  TipoDocumento,
  TipoVideo,
} from "@prisma/client";

/** Zona horaria de la convocatoria. Mexico no aplica horario de verano desde
 *  2022, asi que America/Mexico_City es UTC-6 todo el anio. */
export const ZONA_HORARIA = "America/Mexico_City";

/** Las cinco claves de criterio, en el orden fijo del brief. Toda la app
 *  (formulario, promedio, IA, resultado) itera sobre este arreglo para que el
 *  orden no dependa de como quedo escrito cada componente. */
export const CLAVES_CRITERIO = [
  "claridad",
  "innovacion",
  "impacto",
  "viabilidad",
  "presentacion",
] as const;

export type ClaveCriterio = (typeof CLAVES_CRITERIO)[number];

export const CRITERIOS: { clave: ClaveCriterio; nombre: string; descripcion: string }[] = [
  {
    clave: "claridad",
    nombre: "Claridad de la idea de negocio",
    descripcion: "El problema, la solucion y el usuario están delimitados.",
  },
  {
    clave: "innovacion",
    nombre: "Innovación y relevancia tecnológica",
    descripcion: "La tecnología emergente es pertinente al problema.",
  },
  {
    clave: "impacto",
    nombre: "Impacto social",
    descripcion: "El beneficio esperado es concreto y verificable.",
  },
  {
    clave: "viabilidad",
    nombre: "Viabilidad técnica y económica",
    descripcion: "La propuesta es realizable con recursos alcanzables.",
  },
  {
    clave: "presentacion",
    nombre: "Presentación del video",
    descripcion: "Comunica con claridad dentro del tiempo permitido.",
  },
];

export const TECNOLOGIAS: Record<Tecnologia, string> = {
  ia: "Inteligencia Artificial",
  vr_ar: "VR/AR",
  robotica: "Robótica",
  blockchain_web3: "Blockchain y Web3",
  nube: "Cómputo en la Nube",
};

export const AREAS_STEM: Record<AreaStem, string> = {
  ingenieria: "Ingeniería",
  computacion: "Ciencias de la computación",
  ciencias_exactas: "Ciencias exactas",
  matematicas: "Matemáticas",
  ciencias_salud: "Ciencias de la salud",
};

export const NIVELES: Record<Nivel, string> = {
  licenciatura: "Licenciatura",
  especialidad: "Especialidad",
  posgrado: "Posgrado",
};

export const ROLES: Record<Rol, string> = {
  applicant: "Aplicante",
  anuies: "ANUIES",
  admin: "Administración",
};

export const ESTADOS: Record<EstadoAplicacion, string> = {
  draft: "Borrador",
  submitted: "Enviada",
  in_review: "En evaluación",
  evaluated: "Evaluada",
  selected: "Seleccionada",
  waitlist: "Lista de espera",
  rejected: "No seleccionada",
};

/** Estados que la lista pinta en teal (cerrados) frente a rosa (en curso).
 *  Corresponde a `a.isDone` / `a.isOpen` del diseno. */
export const ESTADOS_CERRADOS: EstadoAplicacion[] = ["evaluated", "selected", "waitlist", "rejected"];

export const DICTAMENES: Record<Dictamen, string> = {
  selected: "Seleccionada",
  waitlist: "Lista de espera",
  rejected: "No seleccionada",
};

/** Documentos del expediente.
 *
 *  Ya no se piden para postular: se integran DESPUÉS de la publicación de
 *  resultados y solo las aplicantes seleccionadas los entregan. Pedir cinco
 *  constancias oficiales por adelantado a cientos de estudiantes, cuando la
 *  mayoría no será seleccionada, es trabajo desperdiciado para ellas y para
 *  las áreas escolares que los emiten. */
export const DOCUMENTOS: { tipo: TipoDocumento; nombre: string; ayuda: string }[] = [
  {
    tipo: "constancia_inscripcion",
    nombre: "Constancia de inscripción",
    ayuda: "Vigente, emitida por tu universidad ANUIES.",
  },
  {
    tipo: "relacion_estudios",
    nombre: "Relación de estudios",
    ayuda: "Debe mostrar tu promedio global acumulado.",
  },
  {
    tipo: "carta_compromiso",
    nombre: "Carta compromiso",
    ayuda: "En el formato ANUIES, firmada por ti.",
  },
  {
    tipo: "carta_respaldo",
    nombre: "Carta de respaldo institucional",
    ayuda: "Firmada por tu universidad.",
  },
  { tipo: "cv", nombre: "Currículum vitae", ayuda: "Máximo dos cuartillas." },
];

export const VIDEOS: {
  tipo: TipoVideo;
  nombre: string;
  ayuda: string;
  maxSegundos: number;
  obligatorio: boolean;
}[] = [
  {
    tipo: "propuesta",
    nombre: "Video de propuesta",
    ayuda: "Máximo 90 segundos. Problema, solución y tecnología emergente.",
    maxSegundos: 90,
    obligatorio: true,
  },
  {
    tipo: "presentacion",
    nombre: "Video de presentación",
    ayuda: "Hasta 60 segundos. Quién eres, qué estudias y por qué quieres participar.",
    maxSegundos: 60,
    obligatorio: false,
  },
];

/** Cómo se captura cada video. El de propuesta se produce aparte y se sube; el
 *  de presentación se graba en el momento con la cámara, así que no hay
 *  archivo que preparar ni exportar. */
export const CAPTURA_VIDEO: Record<TipoVideo, "archivo" | "camara"> = {
  propuesta: "archivo",
  presentacion: "camara",
};

/** Límites de archivo. Se aplican en las condiciones del POST firmado, que
 *  S3 evalúa antes de aceptar los bytes, y otra vez al verificar el objeto. */
export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024;
export const TIPOS_PDF = ["application/pdf"];
export const TIPOS_VIDEO = ["video/mp4", "video/quicktime"];
/** La grabación de la cámara sale en el formato que ofrezca el navegador:
 *  WebM en Chrome y Firefox, MP4 en Safari. */
export const TIPOS_GRABACION = ["video/webm", "video/mp4", "video/quicktime"];
/** Un minuto de webcam pesa unos pocos MB; no hay razón para admitir 500. */
export const MAX_GRABACION_BYTES = 120 * 1024 * 1024;

export const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche",
  "Chiapas", "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango",
  "Estado de México", "Guanajuato", "Guerrero", "Hidalgo", "Jalisco",
  "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora",
  "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

export const TALLAS = ["XS", "S", "M", "L", "XL", "2XL"];

export const PASOS = [
  { num: "Paso 1", slug: "datos", label: "Datos personales y académicos" },
  { num: "Paso 2", slug: "videos", label: "Videos" },
  { num: "Paso 3", slug: "revision", label: "Revisión y envío" },
] as const;

/** Saludo del tablero. Los nombres mexicanos suelen traer dos nombres de pila
 *  y dos apellidos, asi que con cuatro o mas partes se saluda con las dos
 *  primeras ("Ana Sofia") y no solo con la primera ("Ana"). */
export function nombreDePila(nombreCompleto: string) {
  const partes = nombreCompleto.trim().split(/\s+/).filter(Boolean);
  return partes.length >= 4 ? partes.slice(0, 2).join(" ") : (partes[0] ?? "");
}

/** Etiqueta "Aplicación · paso N de M".
 *
 *  Se deriva de PASOS en lugar de escribirse a mano en cada pantalla: escrita
 *  a mano se desincroniza en cuanto cambia la estructura del asistente. */
export function etiquetaPaso(slug: (typeof PASOS)[number]["slug"]) {
  const i = PASOS.findIndex((p) => p.slug === slug);
  return `Aplicación · paso ${i + 1} de ${PASOS.length}`;
}
