/** Contenido de la portada, tomado de la convocatoria original.
 *
 *  Vive aparte del componente para que actualizar un texto de la convocatoria
 *  no obligue a tocar el maquetado. Las fechas NO están aquí: salen de la
 *  colección Edicion, para que la portada y la plataforma nunca se
 *  contradigan. */

/** `eyebrow` es el rótulo largo del encabezado de sección; `indice`, el corto
 *  del menú superior. Con los largos, siete entradas más el logo y los botones
 *  no caben en una línea y la cabecera se parte en tres filas. */
export const SECCIONES = [
  { num: "01", id: "acerca", indice: "El reto", eyebrow: "Acerca de la convocatoria", titulo: "El reto" },
  { num: "02", id: "estructura", indice: "Programa", eyebrow: "Estructura del programa", titulo: "Cinco días, un Demo Day" },
  { num: "03", id: "componentes", indice: "Componentes", eyebrow: "Componentes del programa", titulo: "Negocio y tecnología" },
  { num: "04", id: "fechas", indice: "Fechas", eyebrow: "Fechas clave", titulo: "Cronograma de la convocatoria" },
  { num: "05", id: "sede", indice: "Sede", eyebrow: "Sede", titulo: "Valle de Bravo, México" },
  { num: "06", id: "participar", indice: "Participar", eyebrow: "Cómo participar", titulo: "Requisitos y selección" },
  { num: "07", id: "becas", indice: "Becas", eyebrow: "Becas y beneficios", titulo: "Qué incluye la beca" },
] as const;

export const ACERCA = [
  "El Reto ANUIES4MX, desarrollado por Mirai Innovation Research Institute (Japón) y la Asociación Nacional de Universidades e Instituciones de Educación Superior (ANUIES), tiene como objetivo contribuir al desarrollo sostenible de México, alineado con los Objetivos de Desarrollo Sostenible de la ONU. En esta edición, principalmente, con el Objetivo 5: lograr la igualdad entre los géneros y empoderar a todas las mujeres y las niñas.",
  "El reconocimiento e impulso institucional a las trayectorias de mujeres y niñas en la ciencia constituye una medida para la igualdad sustantiva, que se propone corregir la subrepresentación histórica de las mujeres en el planteamiento de preguntas de investigación y en la generación de soluciones científicas y tecnológicas innovadoras y socialmente pertinentes.",
  "Iniciativas como ANUIES4MX Mujeres en STEM contribuyen a la erradicación de estereotipos y a derribar barreras de desigualdad estructural, posicionando a las mujeres como referentes de autoridad en la ciencia, la tecnología, las ingenierías y las matemáticas.",
];

export const DESTACADO =
  "Mujeres en STEM — Negocios del Futuro con Tecnologías Emergentes busca identificar y seleccionar a mujeres estudiantes talentosas de universidades asociadas a la ANUIES para participar en un programa intensivo de cinco días en Valle de Bravo, donde convertirán ideas innovadoras en prototipos de tech startups. Al finalizar, cada equipo presentará su prototipo ante el jurado del Demo Day.";

export const DATOS = [
  ["Duración", "5 días intensivos"],
  ["Sede", "Centro de Capacitación ANUIES, Valle de Bravo, Estado de México"],
  ["Modalidad", "Presencial y residencial"],
  ["Idioma", "Español"],
  ["Perfil objetivo", "Mujeres estudiantes de educación superior en áreas STEM, de universidades asociadas a la ANUIES"],
  ["Organizadores", "ANUIES y Mirai Innovation Research Institute (Osaka, Japón)"],
  ["Enfoque", "Emprendimiento tecnológico y startups de impacto social"],
] as const;

export const DIAS = [
  ["01", "Bienvenida y fundamentos", "Inauguración del programa y primer acercamiento a Design Thinking."],
  ["02", "Tecnologías emergentes", "Neurotecnología, Robótica, Blockchain y Realidad Virtual/Aumentada."],
  ["03", "Negocios y modelos de startup", "Business Model Canvas e Inteligencia Artificial aplicada a negocios."],
  ["04", "Prototipado y pitching", "Construcción del MVP, finanzas y Cómputo en la Nube."],
  ["05", "Demo Day y clausura", "Presentación final de cada equipo ante las personas del jurado."],
] as const;

export const COMPONENTES = {
  negocio: ["Design Thinking", "Business Model Canvas", "Lean Startup y MVP", "Finanzas para startups", "Pitch y storytelling"],
  tecnologia: ["Inteligencia Artificial", "Prompt Engineering", "Realidad Virtual y Aumentada", "Robótica", "Blockchain y Web3", "Cómputo en la Nube"],
};

export const CRITERIOS_SELECCION = [
  ["Claridad de la idea de negocio", "Identificación clara del problema u oportunidad y de la propuesta de solución."],
  ["Innovación y relevancia tecnológica", "Uso innovador de IA, VR/AR, Robótica, Blockchain o Cómputo en la Nube."],
  ["Impacto social", "Potencial de generar un cambio significativo y medible."],
  ["Viabilidad técnica y económica", "Factibilidad de implementación y solidez del modelo de negocio."],
  ["Presentación del video", "Claridad, eficiencia comunicativa y creatividad."],
] as const;

/** Requisitos separados en dos momentos.
 *
 *  La convocatoria original los listaba todos juntos, pero en la plataforma
 *  los documentos oficiales se integran después de los resultados y solo los
 *  entregan las seleccionadas. Presentarlos como si hicieran falta para
 *  postular haría que muchas se rindieran antes de empezar. */
export const REQUISITOS_POSTULAR = [
  "Estudiar en el nivel superior: licenciatura, especialidad, posgrado u otros niveles afines.",
  "Estar inscrita en una universidad o institución educativa asociada a la ANUIES.",
  "Acreditar un promedio global acumulado mínimo de 9.0.",
  "No cursar el último año de tu programa educativo.",
  "Describir tu propuesta y grabar un video de hasta 90 segundos que la presente.",
];

export const REQUISITOS_EXPEDIENTE = [
  "Constancia de inscripción emitida por tu universidad ANUIES.",
  "Relación de estudios oficial con el promedio global acumulado.",
  "Carta compromiso con ANUIES, en el formato oficial.",
  "Carta de respaldo de tu universidad o institución educativa.",
  "Currículum vitae actualizado.",
];

export const BECA =
  "Las personas seleccionadas recibirán una beca de participación que cubre el programa, el hospedaje y la alimentación en el Centro de Capacitación ANUIES de Valle de Bravo durante los días del evento.";

export const CORREO_CONTACTO = "anuies4mx@anuies.mx";
