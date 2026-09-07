/**
 * Seed de la edicion 2026.
 *
 * La aplicante insignia (Ana Sofia Marquez Duarte, folio A4MX-2026-0184) usa
 * exactamente los datos de muestra del diseno, para poder comparar la vista
 * construida contra el archivo aprobado. Las demas se generan alrededor de
 * ella, repartidas entre los estados que cada vista necesita mostrar.
 */
import { PrismaClient, type Dictamen, type EstadoAplicacion, type Nivel, type Tecnologia, type AreaStem } from "@prisma/client";
import { hash } from "@node-rs/argon2";

const db = new PrismaClient();

/** Construye una fecha a partir de hora local de Mexico (UTC-6 todo el anio). */
const cst = (iso: string) => new Date(`${iso}-06:00`);

const OPCIONES_HASH = { memoryCost: 19456, timeCost: 2, parallelism: 1 };

const CONSONANTES = "BCDFGHJKLMNPQRSTVWXYZ";
const ENTIDADES = ["DF", "MC", "JC", "NL", "PL", "MN", "GT", "YN", "SP", "VZ"];

/** CURP sintética con la forma correcta (18 caracteres). No corresponde a
 *  ninguna persona: las aplicantes del seed son inventadas. Se genera porque
 *  una aplicación en estado "enviada" tiene que estar realmente completa, y
 *  dejar el campo vacío hacía que el tablero la marcara como pendiente. */
function curpSintetica(nombre: string, i: number) {
  const iniciales = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .split(/\s+/);
  const base = (
    (iniciales[2]?.[0] ?? "X") +
    (iniciales[2]?.[1] ?? "X") +
    (iniciales[3]?.[0] ?? "X") +
    (iniciales[0]?.[0] ?? "X")
  ).replace(/[^A-Z]/g, "X");
  const anio = String(3 + (i % 6)).padStart(2, "0");
  const mes = String((i % 12) + 1).padStart(2, "0");
  const dia = String((i % 27) + 1).padStart(2, "0");
  const homoclave =
    CONSONANTES[i % CONSONANTES.length] +
    CONSONANTES[(i * 3) % CONSONANTES.length] +
    CONSONANTES[(i * 7) % CONSONANTES.length];
  return `${base}0${anio}${mes}${dia}M${ENTIDADES[i % ENTIDADES.length]}${homoclave}${i % 10}${i % 9}`;
}
const hashear = (p: string) => hash(p, OPCIONES_HASH);

const UNIVERSIDADES = [
  { nombre: "Universidad Nacional Autónoma de México", siglas: "UNAM", estado: "Ciudad de México" },
  { nombre: "Instituto Politécnico Nacional", siglas: "IPN", estado: "Ciudad de México" },
  { nombre: "Universidad de Guadalajara", siglas: "UdeG", estado: "Jalisco" },
  { nombre: "Tecnológico Nacional de México", siglas: "TecNM", estado: "Ciudad de México" },
  { nombre: "Universidad Autónoma de Nuevo León", siglas: "UANL", estado: "Nuevo León" },
  { nombre: "Benemérita Universidad Autónoma de Puebla", siglas: "BUAP", estado: "Puebla" },
  { nombre: "Universidad Autónoma del Estado de México", siglas: "UAEMex", estado: "Estado de México" },
  { nombre: "Universidad de Guanajuato", siglas: "UG", estado: "Guanajuato" },
  { nombre: "Universidad Autónoma de Yucatán", siglas: "UADY", estado: "Yucatán" },
  { nombre: "Universidad Autónoma de San Luis Potosí", siglas: "UASLP", estado: "San Luis Potosí" },
];

type Semilla = {
  folio: string;
  nombre: string;
  email: string;
  uni: string;
  programa: string;
  nivel: Nivel;
  semestre: number;
  promedio: number;
  area: AreaStem;
  estadoResidencia: string;
  proyecto: string;
  tecnologia: Tecnologia;
  problema: string;
  impacto: string;
  estado: EstadoAplicacion;
  duracionVideo: number;
  /** Documentos del expediente. Solo tienen sentido para las seleccionadas:
   *  el expediente se integra después de publicar resultados. */
  docs: number;
  dictamen?: Dictamen;
  /** Puntajes fijados a mano para que el registro coincida con el diseno
   *  aprobado (comite 4.4, IA 4.2). Solo lo usa la aplicante insignia. */
  fijo?: {
    comite: [number, number, number, number, number][];
    ia: [number, number, number, number, number];
    iaGlobal: number;
  };
};

const APLICANTES: Semilla[] = [
  {
    folio: "A4MX-2026-0184",
    nombre: "Ana Sofía Márquez Duarte",
    email: "ana.marquez@comunidad.unam.mx",
    uni: "UNAM",
    programa: "Ingeniería en Mecatrónica",
    nivel: "licenciatura",
    semestre: 6,
    promedio: 9.4,
    area: "ingenieria",
    estadoResidencia: "Ciudad de México",
    proyecto: "Sensa",
    tecnologia: "ia",
    problema:
      "Los pequeños productores del Estado de México detectan plagas de forma tardía, con pérdidas de hasta 30% de la cosecha. No existen herramientas de diagnóstico accesibles en campo.",
    impacto:
      "Reducir pérdidas de cosecha en unidades de producción familiar mediante diagnóstico temprano desde un teléfono, sin conexión permanente a internet.",
    estado: "evaluated",
    duracionVideo: 84,
    docs: 5,
    dictamen: "selected",
    fijo: {
      // Cada evaluador promedia 4.4, asi que el promedio del comite es 4.4.
      comite: [
        [5, 4, 5, 4, 4],
        [4, 5, 5, 4, 4],
        [5, 4, 5, 3, 5],
      ],
      ia: [4.5, 4.3, 4.6, 3.5, 4.1],
      iaGlobal: 4.2,
    },
  },
  {
    folio: "A4MX-2026-0185",
    nombre: "Regina Fuentes Olvera",
    email: "regina.fuentes@alumnos.ipn.mx",
    uni: "IPN",
    programa: "Ingeniería Biomédica",
    nivel: "licenciatura",
    semestre: 7,
    promedio: 9.6,
    area: "ingenieria",
    estadoResidencia: "Ciudad de México",
    proyecto: "Aliento",
    tecnologia: "ia",
    problema:
      "El tamizaje de enfermedad pulmonar en clinicas de primer nivel depende de equipo que la mayoria de los centros rurales no tiene, y la referencia a segundo nivel toma semanas.",
    impacto:
      "Tamizaje respiratorio de bajo costo a partir de audio de tos, para priorizar referencias en centros de salud sin radiologo.",
    estado: "evaluated",
    duracionVideo: 89,
    docs: 5,
    dictamen: "selected",
  },
  {
    folio: "A4MX-2026-0186",
    nombre: "Valeria Contreras Núñez",
    email: "valeria.contreras@alumnos.udg.mx",
    uni: "UdeG",
    programa: "Ciencias Computacionales",
    nivel: "licenciatura",
    semestre: 8,
    promedio: 9.2,
    area: "computacion",
    estadoResidencia: "Jalisco",
    proyecto: "Milpa Viva",
    tecnologia: "blockchain_web3",
    problema:
      "Los productores de agave no logran comprobar el origen de su materia prima ante compradores internacionales y pierden el sobreprecio de la trazabilidad.",
    impacto:
      "Registro de trazabilidad verificable para cooperativas pequeñas, con costo por lote accesible.",
    estado: "evaluated",
    duracionVideo: 76,
    docs: 5,
    dictamen: "waitlist",
  },
  {
    folio: "A4MX-2026-0187",
    nombre: "Daniela Robles Cervantes",
    email: "daniela.robles@uanl.edu.mx",
    uni: "UANL",
    programa: "Ingeniería en Robótica",
    nivel: "licenciatura",
    semestre: 6,
    promedio: 9.8,
    area: "ingenieria",
    estadoResidencia: "Nuevo León",
    proyecto: "Manos",
    tecnologia: "robotica",
    problema:
      "La rehabilitación motriz posterior a un evento vascular requiere sesiones presenciales frecuentes que las familias de bajos ingresos no pueden sostener.",
    impacto:
      "Órtesis de rehabilitación de bajo costo con seguimiento remoto del avance para terapeutas.",
    estado: "evaluated",
    duracionVideo: 90,
    docs: 5,
    dictamen: "selected",
  },
  {
    folio: "A4MX-2026-0188",
    nombre: "Ximena Alcántara Ríos",
    email: "ximena.alcantara@correo.buap.mx",
    uni: "BUAP",
    programa: "Física Aplicada",
    nivel: "posgrado",
    semestre: 3,
    promedio: 9.5,
    area: "ciencias_exactas",
    estadoResidencia: "Puebla",
    proyecto: "Sol Comun",
    tecnologia: "nube",
    problema:
      "Las cooperativas de energía solar comunitaria no cuentan con herramientas para repartir generación y consumo entre socios, y terminan usando hojas de calculo.",
    impacto:
      "Plataforma de reparto y facturación para redes solares comunitarias en zonas periurbanas.",
    estado: "evaluated",
    duracionVideo: 71,
    docs: 5,
    dictamen: "waitlist",
  },
  {
    folio: "A4MX-2026-0189",
    nombre: "Fernanda Ibarra Lozano",
    email: "fernanda.ibarra@uaemex.mx",
    uni: "UAEMex",
    programa: "Ingeniería en Software",
    nivel: "licenciatura",
    semestre: 5,
    promedio: 9.1,
    area: "computacion",
    estadoResidencia: "Estado de México",
    proyecto: "Ruta Segura",
    tecnologia: "ia",
    problema:
      "Las estudiantes que se trasladan de noche entre campus carecen de información confiable sobre que rutas han tenido incidentes recientes.",
    impacto:
      "Mapa colaborativo de rutas seguras con alertas verificadas por las propias comunidades universitarias.",
    estado: "in_review",
    duracionVideo: 88,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0190",
    nombre: "Paulina Vega Estrada",
    email: "paulina.vega@ugto.mx",
    uni: "UG",
    programa: "Ingeniería Ambiental",
    nivel: "licenciatura",
    semestre: 7,
    promedio: 9.3,
    area: "ingenieria",
    estadoResidencia: "Guanajuato",
    proyecto: "Agua Clara",
    tecnologia: "nube",
    problema:
      "Los comites de agua potable rurales miden calidad de forma esporadica y sin registro historico, asi que no detectan tendencias de contaminacion.",
    impacto:
      "Monitoreo continuo y económico de calidad de agua para comites comunitarios del Bajio.",
    estado: "in_review",
    duracionVideo: 82,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0191",
    nombre: "Mariana Escobar Pineda",
    email: "mariana.escobar@correo.uady.mx",
    uni: "UADY",
    programa: "Ingeniería en Datos",
    nivel: "licenciatura",
    semestre: 6,
    promedio: 9.7,
    area: "computacion",
    estadoResidencia: "Yucatán",
    proyecto: "Meliponas",
    tecnologia: "ia",
    problema:
      "La apicultura de abeja melipona en la península pierde colmenas por causas que los productores no logran identificar a tiempo.",
    impacto:
      "Monitoreo acústico de colmenas para alertar de pérdida de población antes del colapso.",
    estado: "in_review",
    duracionVideo: 79,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0192",
    nombre: "Andrea Salgado Miranda",
    email: "andrea.salgado@uaslp.mx",
    uni: "UASLP",
    programa: "Ingeniería Mecánica",
    nivel: "licenciatura",
    semestre: 5,
    promedio: 9.0,
    area: "ingenieria",
    estadoResidencia: "San Luis Potosí",
    proyecto: "Taller Abierto",
    tecnologia: "vr_ar",
    problema:
      "La capacitación práctica en maquinaria industrial es cara y riesgosa, y los planteles técnicos rara vez tienen equipo suficiente para todo el grupo.",
    impacto:
      "Entrenamiento en realidad aumentada para operación segura de maquinaria en planteles técnicos.",
    estado: "submitted",
    duracionVideo: 86,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0193",
    nombre: "Sofía Ledesma Quiroz",
    email: "sofia.ledesma@tecnm.mx",
    uni: "TecNM",
    programa: "Ingeniería en Sistemas Computacionales",
    nivel: "licenciatura",
    semestre: 6,
    promedio: 9.2,
    area: "computacion",
    estadoResidencia: "Michoacán",
    proyecto: "Cosecha Justa",
    tecnologia: "blockchain_web3",
    problema:
      "Las productoras de aguacate venden a intermediarios sin referencia de precio y aceptan el primer monto que se les ofrece.",
    impacto:
      "Referencia de precios abierta y contratos simples para productoras sin acceso a mercado formal.",
    estado: "submitted",
    duracionVideo: 74,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0194",
    nombre: "Camila Ortiz Bautista",
    email: "camila.ortiz@comunidad.unam.mx",
    uni: "UNAM",
    programa: "Ciencias de la Computación",
    nivel: "licenciatura",
    semestre: 4,
    promedio: 9.9,
    area: "computacion",
    estadoResidencia: "Ciudad de México",
    proyecto: "Senas",
    tecnologia: "ia",
    problema:
      "Los tramites de ventanilla en dependencias públicas no cuentan con intérprete de Lengua de Señas Mexicana y la persona sorda depende de un acompañante.",
    impacto:
      "Traducción asistida de LSM para ventanillas de atención pública, con vocabulario de tramites.",
    estado: "submitted",
    duracionVideo: 90,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0195",
    nombre: "Renata Guzmán Tapia",
    email: "renata.guzman@alumnos.ipn.mx",
    uni: "IPN",
    programa: "Ingeniería Química",
    nivel: "licenciatura",
    semestre: 7,
    promedio: 9.4,
    area: "ingenieria",
    estadoResidencia: "Ciudad de México",
    proyecto: "Segunda Vida",
    tecnologia: "robotica",
    problema:
      "Los centros de acopio separan plastico a mano, con bajo rendimiento y riesgo sanitario para quienes lo hacen.",
    impacto:
      "Celda de separación automatizada asequible para centros de acopio municipales.",
    estado: "submitted",
    duracionVideo: 81,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0196",
    nombre: "Lucía Ramos Villalobos",
    email: "lucia.ramos@alumnos.udg.mx",
    uni: "UdeG",
    programa: "Matemáticas Aplicadas",
    nivel: "posgrado",
    semestre: 2,
    promedio: 9.6,
    area: "matematicas",
    estadoResidencia: "Jalisco",
    proyecto: "Prevenir",
    tecnologia: "nube",
    problema:
      "Los municipios pequeños no anticipan brotes estacionales de dengue porque sus datos de salud viven en reportes en papel.",
    impacto:
      "Modelo de alerta temprana de dengue para municipios con capacidad técnica limitada.",
    estado: "submitted",
    duracionVideo: 87,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0197",
    nombre: "Isabela Nava Trejo",
    email: "isabela.nava@uanl.edu.mx",
    uni: "UANL",
    programa: "Ingeniería en Nanotecnología",
    nivel: "posgrado",
    semestre: 4,
    promedio: 9.5,
    area: "ciencias_exactas",
    estadoResidencia: "Nuevo León",
    proyecto: "Filtra",
    tecnologia: "nube",
    problema:
      "Las comunidades con pozos contaminados por arsénico no tienen forma de saber si su filtro sigue funcionando después de meses de uso.",
    impacto:
      "Indicador de saturacion para filtros domesticos de arsénico, legible sin instrumentos.",
    estado: "submitted",
    duracionVideo: 68,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0198",
    nombre: "Emilia Cárdenas Bravo",
    email: "emilia.cardenas@correo.buap.mx",
    uni: "BUAP",
    programa: "Ingeniería en Telecomunicaciones",
    nivel: "licenciatura",
    semestre: 5,
    promedio: 9.1,
    area: "ingenieria",
    estadoResidencia: "Puebla",
    proyecto: "Enlace Sierra",
    tecnologia: "nube",
    problema:
      "Las telesecundarias de la sierra pierden clases enteras cuando el enlace satelital falla y nadie local puede diagnosticarlo.",
    impacto:
      "Diagnóstico remoto de enlaces educativos para que el mantenimiento no dependa de una visita.",
    estado: "submitted",
    duracionVideo: 90,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0199",
    nombre: "Natalia Zamora Peña",
    email: "natalia.zamora@uaemex.mx",
    uni: "UAEMex",
    programa: "Enfermeria",
    nivel: "licenciatura",
    semestre: 6,
    promedio: 9.3,
    area: "ciencias_salud",
    estadoResidencia: "Estado de México",
    proyecto: "Cuidar",
    tecnologia: "vr_ar",
    problema:
      "Las cuidadoras de personas mayores aprenden maniobras de movilización por imitacion y se lesionan la espalda con frecuencia.",
    impacto:
      "Entrenamiento guiado en realidad aumentada para movilización segura de pacientes en casa.",
    estado: "submitted",
    duracionVideo: 59,
    docs: 5,
  },
  {
    folio: "A4MX-2026-0200",
    nombre: "Jimena Rincón Aguilar",
    email: "jimena.rincon@ugto.mx",
    uni: "UG",
    programa: "Ingeniería en Mecatrónica",
    nivel: "licenciatura",
    semestre: 4,
    promedio: 9.0,
    area: "ingenieria",
    estadoResidencia: "Guanajuato",
    proyecto: "Braille Fácil",
    tecnologia: "robotica",
    problema:
      "El material escolar en braille es caro y llega tarde, asi que las alumnas ciegas trabajan con copias prestadas.",
    impacto:
      "Impresora braille de escritorio de bajo costo para escuelas públicas.",
    estado: "submitted",
    duracionVideo: 85,
    docs: 5,
  },
  // Borradores: sirven para probar el checklist de envio incompleto y la
  // regla de que un borrador no enviado no aparece en la lista de revision.
  {
    folio: "A4MX-2026-0201",
    nombre: "Alejandra Miranda Sosa",
    email: "alejandra.miranda@correo.uady.mx",
    uni: "UADY",
    programa: "Ingeniería Civil",
    nivel: "licenciatura",
    semestre: 5,
    promedio: 9.2,
    area: "ingenieria",
    estadoResidencia: "Yucatán",
    proyecto: "Techo Fresco",
    tecnologia: "nube",
    problema:
      "Las viviendas de interes social en clima calido alcanzan temperaturas insalubres y el gasto en ventilacion es inasumible.",
    impacto: "Diseño de cubierta pasiva de bajo costo evaluado con datos locales.",
    estado: "draft",
    duracionVideo: 0,
    docs: 3,
  },
  {
    folio: "A4MX-2026-0202",
    nombre: "Carolina Beltrán Ochoa",
    email: "carolina.beltran@uaslp.mx",
    uni: "UASLP",
    programa: "Ingeniería en Computación",
    nivel: "licenciatura",
    semestre: 6,
    promedio: 9.4,
    area: "computacion",
    estadoResidencia: "San Luis Potosí",
    proyecto: "Memoria Viva",
    tecnologia: "vr_ar",
    problema:
      "Las lenguas originarias con pocos hablantes carecen de material interactivo y la enseñanza depende de una sola persona en la comunidad.",
    impacto: "Archivo interactivo de lengua y territorio hecho con las comunidades.",
    estado: "draft",
    duracionVideo: 0,
    docs: 1,
  },
  {
    folio: "A4MX-2026-0203",
    nombre: "Gabriela Peralta Solís",
    email: "gabriela.peralta@tecnm.mx",
    uni: "TecNM",
    programa: "Ingeniería Industrial",
    nivel: "licenciatura",
    semestre: 7,
    promedio: 9.1,
    area: "ingenieria",
    estadoResidencia: "Veracruz",
    proyecto: "Cadena Corta",
    tecnologia: "ia",
    problema:
      "Las cooperativas de café pierden margen porque no saben cuanto producto tendran listo ni cuando, y venden con descuento de urgencia.",
    impacto: "Pronostico de acopio para planear ventas sin rematar la cosecha.",
    estado: "draft",
    duracionVideo: 0,
    docs: 4,
  },
];

const COMITE = [
  { nombre: "Dra. Leticia Herrera Cruz", email: "leticia.herrera@anuies4mx.test", organizacion: "ANUIES" },
  { nombre: "Dr. Hiroshi Tanaka", email: "hiroshi.tanaka@anuies4mx.test", organizacion: "Mirai Innovation Research Institute" },
  { nombre: "Mtra. Susana Peralta Vidal", email: "susana.peralta@anuies4mx.test", organizacion: "ANUIES · Vinculación" },
];

async function main() {
  console.log("Limpiando colecciones…");
  await db.auditLog.deleteMany();
  await db.aiEvaluation.deleteMany();
  await db.evaluation.deleteMany();
  await db.application.deleteMany();
  await db.team.deleteMany();
  await db.token.deleteMany();
  await db.user.deleteMany();
  await db.universidad.deleteMany();
  await db.edicion.deleteMany();
  await db.contador.deleteMany();

  console.log("Edicion 2026…");
  await db.edicion.create({
    data: {
      clave: "2026",
      nombre: "Reto ANUIES4MX 2026 · Mujeres en STEM",
      cierreRecepcion: cst("2026-11-15T23:59:59"),
      evaluacionInicia: cst("2026-11-16T00:00:00"),
      evaluacionTermina: cst("2026-11-22T23:59:59"),
      // Arranca sin publicar: /resultado debe mostrar "en evaluación" hasta
      // que el admin ejecute la accion de publicar.
      resultadosPublicadosEn: null,
      confirmacionAbre: cst("2026-11-24T00:00:00"),
      confirmacionCierra: cst("2026-11-30T23:59:59"),
      eventoInicia: cst("2026-12-13T00:00:00"),
      eventoTermina: cst("2026-12-18T23:59:59"),
      promedioMinimo: 9.0,
    },
  });

  console.log("Catalogo de universidades…");
  const universidades = new Map<string, string>();
  for (const u of UNIVERSIDADES) {
    const creada = await db.universidad.create({ data: u });
    universidades.set(u.siglas, creada.id);
  }

  console.log("Cuentas de prueba…");
  const passAdmin = await hashear("Admin2026!");
  const passAnuies = await hashear("Anuies2026!");
  const passAplicante = await hashear("Aplicante2026!");
  const ahora = new Date();

  const admin = await db.user.create({
    data: {
      nombre: "Rafael Hernández",
      email: "admin@anuies4mx.test",
      passwordHash: passAdmin,
      rol: "admin",
      organizacion: "Mirai Innovation Research Institute",
      emailVerifiedAt: ahora,
    },
  });

  await db.user.create({
    data: {
      nombre: "Dirección General ANUIES",
      email: "anuies@anuies4mx.test",
      passwordHash: passAnuies,
      rol: "anuies",
      organizacion: "ANUIES",
      emailVerifiedAt: ahora,
    },
  });

  const evaluadores = [admin];
  for (const c of COMITE) {
    evaluadores.push(
      await db.user.create({
        data: {
          nombre: c.nombre,
          email: c.email,
          passwordHash: passAdmin,
          rol: "admin",
          organizacion: c.organizacion,
          emailVerifiedAt: ahora,
        },
      }),
    );
  }

  console.log("Aplicaciones…");
  const creadas: { id: string; s: Semilla }[] = [];

  for (const [i, s] of APLICANTES.entries()) {
    // La primera aplicante es tambien la cuenta de prueba del rol applicant.
    const esCuentaDePrueba = i === 0;
    // El correo de la CUENTA usa el dominio .test, reservado por RFC 2606 y
    // que ningún servidor resuelve: así una prueba de envío masivo no puede
    // alcanzar el buzón de una persona real. El correo institucional realista
    // se conserva en `datos.correoInstitucional`, que es el que se muestra.
    const correoCuenta = esCuentaDePrueba
      ? "aplicante@anuies4mx.test"
      : s.email.replace(/@.+$/, "@anuies4mx.test");

    const user = await db.user.create({
      data: {
        nombre: s.nombre,
        email: correoCuenta,
        passwordHash: esCuentaDePrueba ? passAplicante : passAplicante,
        rol: "applicant",
        emailVerifiedAt: ahora,
      },
    });

    const enviada = s.estado !== "draft";
    const universidadId = universidades.get(s.uni)!;

    const app = await db.application.create({
      data: {
        folio: s.folio,
        estado: s.estado,
        userId: user.id,
        universidadId,
        datos: {
          nombreCompleto: s.nombre,
          curp: curpSintetica(s.nombre, i),
          fechaNacimiento: new Date(Date.UTC(2003, i % 12, ((i * 7) % 27) + 1)),
          telefono: `+52 55 ${String(1000 + i * 37).padStart(4, "0")} ${String(2000 + i * 13).padStart(4, "0")}`,
          estadoResidencia: s.estadoResidencia,
          correoInstitucional: s.email,
        },
        academicos: {
          universidadId,
          programaEducativo: s.programa,
          nivel: s.nivel,
          semestre: s.semestre,
          promedio: s.promedio,
          areaStem: s.area,
          declaraNoUltimoAnio: enviada,
        },
        propuesta: {
          nombre: s.proyecto,
          tecnologia: s.tecnologia,
          problema: s.problema,
          impacto: s.impacto,
        },
        // El expediente solo existe para quien ya fue seleccionada.
        documentos: (s.dictamen === "selected"
          ? [
              "constancia_inscripcion",
              "relacion_estudios",
              "carta_compromiso",
              "carta_respaldo",
              "cv",
            ]
          : [])
          .slice(0, s.docs)
          .map((tipo) => ({
            tipo: tipo as never,
            blobPathname: `seed/${s.folio}/${tipo}.pdf`,
            nombreOriginal: `${tipo}.pdf`,
            tamanoBytes: 400_000 + ((i * 9_973) % 900_000),
            contentType: "application/pdf",
          })),
        videos: enviada
          ? [
              {
                tipo: "propuesta" as const,
                blobPathname: `seed/${s.folio}/propuesta.mp4`,
                nombreOriginal: `propuesta_${s.proyecto.toLowerCase().replace(/\s+/g, "_")}.mp4`,
                tamanoBytes: 120_000_000 + ((i * 3_331_777) % 60_000_000),
                contentType: "video/mp4",
                duracionSegundos: s.duracionVideo,
                resumen: null,
              },
            ]
          : [],
        declaraVeracidad: enviada,
        enviadaEn: enviada ? cst(`2026-11-${String(8 + (i % 7)).padStart(2, "0")}T1${i % 9}:24:00`) : null,
        guardadaEn: new Date(ahora.getTime() - (i % 5) * 60_000),
      },
    });

    creadas.push({ id: app.id, s });
  }

  // El contador arranca despues del ultimo folio sembrado para que un registro
  // nuevo no choque con uno existente.
  const ultimo = Math.max(...APLICANTES.map((a) => Number(a.folio.split("-")[2])));
  await db.contador.create({ data: { id: "folio:2026", valor: ultimo } });

  console.log("Evaluaciones del comité…");
  const COMENTARIOS = {
    fortalezas:
      "El problema está delimitado con datos concretos y la tecnología elegida es pertinente al contexto. El video comunica la propuesta con claridad dentro del tiempo permitido.",
    areas:
      "El modelo de ingresos requiere mayor detalle: no se especifica el costo del hardware ni la via de adopción con las usuarias. Trabaja este punto antes del Demo Day.",
  };

  for (const { id, s } of creadas) {
    if (s.estado !== "evaluated") continue;

    // Tres evaluadores por aplicacion, con puntajes ligeramente distintos.
    const base = s.dictamen === "selected" ? 4 : 3;
    for (const [j, ev] of evaluadores.slice(1).entries()) {
      const f = s.fijo?.comite[j];
      const criterios = f
        ? { claridad: f[0], innovacion: f[1], impacto: f[2], viabilidad: f[3], presentacion: f[4] }
        : {
            claridad: Math.min(5, base + ((j + 1) % 2)),
            innovacion: Math.min(5, base + (j % 2)),
            impacto: Math.min(5, base + 1),
            viabilidad: Math.max(1, base - (j % 2)),
            presentacion: Math.min(5, base + ((j + 1) % 2)),
          };
      const valores = Object.values(criterios);
      const promedio = valores.reduce((a, b) => a + b, 0) / valores.length;

      await db.evaluation.create({
        data: {
          applicationId: id,
          evaluatorId: ev.id,
          criterios,
          promedio: Number(promedio.toFixed(2)),
          fortalezas: COMENTARIOS.fortalezas,
          areasOportunidad: COMENTARIOS.areas,
          dictamen: s.dictamen!,
        },
      });
    }

    const evs = await db.evaluation.findMany({ where: { applicationId: id } });
    const puntaje = evs.reduce((a, e) => a + e.promedio, 0) / evs.length;

    await db.application.update({
      where: { id },
      data: {
        puntajeComite: Number(puntaje.toFixed(2)),
        dictamen: s.dictamen,
        criteriosComite: {
          claridad: Math.round(evs.reduce((a, e) => a + e.criterios.claridad, 0) / evs.length),
          innovacion: Math.round(evs.reduce((a, e) => a + e.criterios.innovacion, 0) / evs.length),
          impacto: Math.round(evs.reduce((a, e) => a + e.criterios.impacto, 0) / evs.length),
          viabilidad: Math.round(evs.reduce((a, e) => a + e.criterios.viabilidad, 0) / evs.length),
          presentacion: Math.round(evs.reduce((a, e) => a + e.criterios.presentacion, 0) / evs.length),
        },
        retroalimentacionPublicada: {
          fortalezas: COMENTARIOS.fortalezas,
          areasOportunidad: COMENTARIOS.areas,
        },
      },
    });
  }

  console.log("Evaluaciones por IA…");
  // Solo la aplicante insignia trae evaluación por IA ya generada, con los
  // valores del diseño aprobado. Las demás quedan en "pendiente" a propósito:
  // así el panel de administración tiene un lote real que ejecutar contra la
  // API, que es el flujo que se va a operar, en vez de texto simulado que se
  // haría pasar por una evaluación del modelo.
  const CRITERIOS_IA: [string, string][] = [
    [
      "Claridad de la idea de negocio",
      "El problema y la usuaria están delimitados con datos concretos del campo mexicano.",
    ],
    [
      "Innovación y relevancia tecnológica",
      "La visión por computadora corresponde al problema planteado y no es decorativa.",
    ],
    [
      "Impacto social",
      "El beneficio esperado es medible y está acotado a una población concreta.",
    ],
    [
      "Viabilidad técnica y económica",
      "Falta detalle sobre el costo del hardware y la vía de adopción con productores.",
    ],
    [
      "Presentación del video",
      "Sin transcripción disponible: puntaje estimado a partir de la propuesta escrita.",
    ],
  ];

  for (const { id, s } of creadas) {
    if (s.estado === "draft") continue;

    const listo = Boolean(s.fijo);
    const semilla = s.promedio;

    await db.aiEvaluation.create({
      data: {
        applicationId: id,
        estado: listo ? "ok" : "pending",
        resumen: listo
          ? `App móvil que usa visión por computadora para detectar plagas en cultivos desde fotografías, con un modelo ligero que opera sin conexión. Mercado inicial: productores familiares del Estado de México.`
          : null,
        criterios: listo
          ? CRITERIOS_IA.map(([criterio, justificacion], k) => ({
              criterio,
              score: s.fijo
                ? s.fijo.ia[k]
                : Number(Math.min(5, Math.max(1, semilla - 5 + (k % 3) * 0.4)).toFixed(1)),
              justificacion,
            }))
          : [],
        scoreGlobal: listo
          ? (s.fijo?.iaGlobal ?? Number(Math.min(5, semilla - 5 + 0.3).toFixed(1)))
          : null,
        verificaciones: listo
          ? [
              { label: "El promedio declarado coincide con la relacion de estudios", ok: true },
              { label: "Constancia vigente de universidad ANUIES", ok: true },
              { label: "Declara no cursar el último año del programa", ok: s.semestre <= 7 },
              { label: "Los cinco documentos obligatorios están completos", ok: s.docs === 5 },
            ]
          : [],
        modelo: listo ? "seed" : null,
        usoTranscripcion: false,
        generadaEn: listo ? new Date() : null,
      },
    });
  }

  console.log("Equipos del Demo Day…");
  const seleccionadas = creadas.filter((c) => c.s.dictamen === "selected");
  if (seleccionadas.length) {
    const equipo = await db.team.create({
      data: { nombre: "Equipo 1 · Visión aplicada", tecnologia: "ia" },
    });
    await db.application.updateMany({
      where: { id: { in: seleccionadas.map((s) => s.id) } },
      data: { equipoId: equipo.id },
    });
  }

  await db.auditLog.create({
    data: {
      accion: "seed.ejecutado",
      actorId: admin.id,
      entidad: "Edicion",
      entidadId: "2026",
      detalle: { aplicaciones: creadas.length },
    },
  });

  console.log(`\nListo: ${creadas.length} aplicaciones, ${evaluadores.length} evaluadores.`);
  console.log("\nCredenciales de prueba");
  console.log("  admin      admin@anuies4mx.test      Admin2026!");
  console.log("  anuies     anuies@anuies4mx.test     Anuies2026!");
  console.log("  aplicante  aplicante@anuies4mx.test  Aplicante2026!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
