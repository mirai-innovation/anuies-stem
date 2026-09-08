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

/** Los cinco documentos oficiales. Son obligatorios para poder enviar la
 *  postulación y se capturan en el paso 3. */
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
  /** Lo que debe cubrir el video, punto por punto. Una sola línea de ayuda no
   *  alcanza para explicar qué se espera, y de eso depende que el video sirva
   *  para evaluar. */
  puntos: string[];
  nota?: string;
  maxSegundos: number;
  obligatorio: boolean;
}[] = [
  // El de presentación va primero a propósito: es el más fácil de grabar y
  // rompe el hielo con la cámara antes de pedir el que sí se califica a fondo.
  {
    tipo: "presentacion",
    nombre: "Video de presentación",
    ayuda:
      "Háblanos de ti y de por qué quieres participar. Este video no es sobre tu propuesta: es sobre tu motivación, y eso es lo que el comité evalúa aquí.",
    puntos: [
      "Quién eres, qué estudias y en qué universidad.",
      "Qué te movió a postularte al Reto ANUIES4MX.",
      "Qué esperas llevarte de los cinco días en Valle de Bravo.",
    ],
    nota: "No hace falta producción ni guion: interesa lo que cuentas, no cómo se ve.",
    maxSegundos: 60,
    obligatorio: true,
  },
  {
    tipo: "propuesta",
    nombre: "Video de propuesta",
    ayuda:
      "Presenta tu propuesta. Debe cubrir los componentes que pide la convocatoria, porque es con este video con el que se califica tu idea.",
    puntos: [
      "El problema u oportunidad que detectaste, y a quién afecta.",
      "La solución que propones.",
      "La tecnología emergente que usarías: IA, VR/AR, Robótica, Blockchain o Cómputo en la Nube.",
      "El impacto social esperado.",
      "Por qué es viable, técnica y económicamente.",
    ],
    maxSegundos: 90,
    obligatorio: true,
  },
];

/** Cómo se captura cada video.
 *
 *  Los dos admiten grabar con la cámara o subir un archivo. La grabación en
 *  vivo es cómoda, pero depende de permisos del navegador y de que el equipo
 *  tenga cámara: dejar siempre abierta la vía del archivo evita que un
 *  problema técnico impida postular. */
export const CAPTURA_VIDEO: Record<TipoVideo, "camara" | "ambas"> = {
  presentacion: "ambas",
  propuesta: "ambas",
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
/** Y por abajo: un WebM de un centenar de bytes es la cabecera del contenedor
 *  sin un solo fotograma. Aceptarlo produce un video que nadie puede abrir. */
export const MIN_GRABACION_BYTES = 8 * 1024;

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
  { num: "Paso 2", slug: "propuesta", label: "Propuesta" },
  { num: "Paso 3", slug: "documentos", label: "Documentos" },
  { num: "Paso 4", slug: "revision", label: "Revisión y envío" },
] as const;

/** En qué paso se captura cada video. La presentación acompaña a los datos
 *  personales —habla de la aplicante, no del proyecto— y la de propuesta va
 *  con la propuesta escrita. */
export const PASO_DE_VIDEO: Record<TipoVideo, "datos" | "propuesta"> = {
  presentacion: "datos",
  propuesta: "propuesta",
};

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
