import type { Application, TipoVideo } from "@prisma/client";
import { DOCUMENTOS, PASOS, PASO_DE_VIDEO, VIDEOS } from "./constantes";

/** Una sola fuente para "qué le falta a esta aplicación".
 *
 *  El tablero, los cuatro pasos del asistente y la validación del envío usan
 *  estas funciones. Si cada vista calculara lo suyo, el checklist del último
 *  paso y el botón de enviar acabarían discrepando. */

/** Etiquetas de los campos, para poder nombrar en español lo que falta en vez
 *  de decir "hay campos incompletos". */
export const CAMPOS_DATOS: [keyof NonNullable<Application["datos"]> | string, string][] = [
  ["nombreCompleto", "Nombre completo"],
  ["curp", "CURP"],
  ["fechaNacimiento", "Fecha de nacimiento"],
  ["telefono", "Teléfono"],
  ["correoInstitucional", "Correo institucional"],
  ["estadoUniversidad", "Estado de la universidad"],
  ["universidad", "Universidad"],
  ["programaEducativo", "Programa educativo"],
  ["nivel", "Nivel"],
  ["semestre", "Semestre actual"],
  ["promedio", "Promedio global acumulado"],
  ["declaraNoUltimoAnio", "Declaración de no cursar el último año"],
];

export const CAMPOS_PROPUESTA: [string, string][] = [
  ["nombrePropuesta", "Nombre de la propuesta"],
  ["problema", "Problema u oportunidad"],
  ["impacto", "Impacto social esperado"],
];

export function datosCompletos(app: Application) {
  const d = app.datos;
  const a = app.academicos;

  return Boolean(
    d?.nombreCompleto &&
      d.curp &&
      d.fechaNacimiento &&
      d.telefono &&
      d.correoInstitucional &&
      a?.estadoUniversidad &&
      a.universidad &&
      a.programaEducativo &&
      a.nivel &&
      a.semestre &&
      a.promedio != null &&
      a.declaraNoUltimoAnio,
  );
}

export function propuestaCompleta(app: Application) {
  const p = app.propuesta;
  return Boolean(p?.nombre && p.problema && p.impacto);
}

export function documentosFaltantes(app: Application) {
  const entregados = new Set(app.documentos.map((d) => d.tipo));
  return DOCUMENTOS.filter((d) => !entregados.has(d.tipo));
}

export function videoDe(app: Application, tipo: TipoVideo) {
  return app.videos.find((v) => v.tipo === tipo) ?? null;
}

/** Motivo por el que un video no es aceptable, o null si lo es. Recorre la
 *  definición de VIDEOS: cuál es obligatorio es una decisión de la
 *  convocatoria y al cambiarla ahí la validación la sigue sola. */
export function problemaDeVideo(app: Application, tipo: TipoVideo) {
  const regla = VIDEOS.find((v) => v.tipo === tipo);
  if (!regla) return null;

  const video = videoDe(app, tipo);
  if (!video) return regla.obligatorio ? `Falta el ${regla.nombre.toLowerCase()}.` : null;

  if (video.duracionSegundos > regla.maxSegundos) {
    return `El ${regla.nombre.toLowerCase()} dura ${video.duracionSegundos} s y el límite es ${regla.maxSegundos} s.`;
  }
  return null;
}

/** Videos que se capturan en un paso dado. */
export function videosDelPaso(slug: (typeof PASOS)[number]["slug"]) {
  return VIDEOS.filter((v) => PASO_DE_VIDEO[v.tipo] === slug);
}

function problemasDeVideosEn(app: Application, slug: "datos" | "propuesta") {
  return videosDelPaso(slug)
    .map((v) => problemaDeVideo(app, v.tipo))
    .filter((p): p is string => p !== null);
}

export function pasoCompleto(app: Application, slug: (typeof PASOS)[number]["slug"]) {
  switch (slug) {
    case "datos":
      return datosCompletos(app) && problemasDeVideosEn(app, "datos").length === 0;
    case "propuesta":
      return propuestaCompleta(app) && problemasDeVideosEn(app, "propuesta").length === 0;
    case "documentos":
      return documentosFaltantes(app).length === 0;
    case "revision":
      return app.estado !== "draft";
  }
}

export function avance(app: Application) {
  const completos = PASOS.filter((p) => pasoCompleto(app, p.slug)).length;
  return { completos, total: PASOS.length, fraccion: completos / PASOS.length };
}

/** Todo lo que impide enviar, en español y nombrando el dato. Vacía significa
 *  que se puede enviar. Es lo que pinta el checklist del último paso. */
export function faltantesParaEnviar(app: Application): string[] {
  const faltantes: string[] = [];

  if (!datosCompletos(app)) {
    faltantes.push("Completa los datos personales y académicos del paso 1.");
  }
  if (!propuestaCompleta(app)) {
    faltantes.push("Completa la propuesta del paso 2.");
  }

  faltantes.push(...problemasDeVideosEn(app, "datos"));
  faltantes.push(...problemasDeVideosEn(app, "propuesta"));

  for (const d of documentosFaltantes(app)) {
    faltantes.push(`Falta el documento: ${d.nombre}.`);
  }

  if (!app.declaraVeracidad) {
    faltantes.push("Falta declarar que la información y los documentos son verídicos.");
  }

  return faltantes;
}

export function puedeEnviar(app: Application) {
  return faltantesParaEnviar(app).length === 0;
}

export type ItemChecklist = { label: string; nota: string; ok: boolean };

/** Checklist del último paso: la misma verdad que `faltantesParaEnviar`, pero
 *  desglosada, porque la aplicante necesita ver también lo que ya resolvió. */
export function checklist(app: Application, promedioMinimo: number): ItemChecklist[] {
  const faltanDocs = documentosFaltantes(app);

  return [
    {
      label: "Datos personales y académicos",
      nota: datosCompletos(app)
        ? "Identificación y trayectoria capturadas."
        : "Falta información en el paso 1.",
      ok: datosCompletos(app),
    },
    {
      label: "Propuesta escrita",
      nota: propuestaCompleta(app)
        ? "Nombre, problema e impacto capturados."
        : "Falta información en el paso 2.",
      ok: propuestaCompleta(app),
    },
    ...VIDEOS.map((regla) => {
      const subido = videoDe(app, regla.tipo);
      const problema = problemaDeVideo(app, regla.tipo);
      return {
        label: `${regla.nombre} dentro de ${regla.maxSegundos} segundos`,
        nota: subido
          ? (problema ?? `Dura ${subido.duracionSegundos} s.`)
          : regla.obligatorio
            ? "Aún no lo entregas."
            : "Es opcional: puedes enviar sin él.",
        ok: problema === null && Boolean(subido),
      };
    }),
    {
      label: "Los cinco documentos obligatorios",
      nota:
        faltanDocs.length === 0
          ? "Los cinco PDF están cargados."
          : `Faltan: ${faltanDocs.map((d) => d.nombre).join(", ")}.`,
      ok: faltanDocs.length === 0,
    },
    {
      label: `Promedio mínimo de ${promedioMinimo.toFixed(1)}`,
      nota:
        app.academicos?.promedio != null
          ? `Declaraste ${app.academicos.promedio.toFixed(1)}.`
          : "Sin capturar.",
      ok: app.academicos?.promedio != null && app.academicos.promedio >= promedioMinimo,
    },
  ];
}
