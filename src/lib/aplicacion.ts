import type { Application } from "@prisma/client";
import { DOCUMENTOS, PASOS, VIDEOS } from "./constantes";

/** Una sola fuente para "que le falta a esta aplicación".
 *
 *  El tablero, el asistente de 4 pasos y la validacion del envio usan estas
 *  funciones. Si cada vista calculara lo suyo, el checklist del paso 4 y el
 *  boton de enviar acabarian discrepando. */

export function datosCompletos(app: Application) {
  const d = app.datos;
  const a = app.academicos;
  const p = app.propuesta;

  return Boolean(
    d?.nombreCompleto &&
      d.curp &&
      d.fechaNacimiento &&
      d.telefono &&
      d.estadoResidencia &&
      d.correoInstitucional &&
      a?.universidadId &&
      a.programaEducativo &&
      a.nivel &&
      a.semestre &&
      a.promedio != null &&
      a.areaStem &&
      p?.nombre &&
      p.tecnologia &&
      p.problema &&
      p.impacto,
  );
}

export function documentosFaltantes(app: Application) {
  const entregados = new Set(app.documentos.map((d) => d.tipo));
  return DOCUMENTOS.filter((d) => !entregados.has(d.tipo));
}

export function videoPropuesta(app: Application) {
  return app.videos.find((v) => v.tipo === "propuesta") ?? null;
}

/** Devuelve el motivo por el que el video no es aceptable, o null si lo es. */
export function problemaDeVideo(app: Application) {
  const video = videoPropuesta(app);
  if (!video) return "Falta el video de propuesta.";

  const limite = VIDEOS.find((v) => v.tipo === "propuesta")!.maxSegundos;
  if (video.duracionSegundos > limite) {
    return `El video de propuesta dura ${video.duracionSegundos} s y el límite es ${limite} s.`;
  }
  return null;
}

export function pasoCompleto(app: Application, slug: (typeof PASOS)[number]["slug"]) {
  switch (slug) {
    case "datos":
      return datosCompletos(app);
    case "videos":
      return problemaDeVideo(app) === null;
    case "revision":
      return app.estado !== "draft";
  }
}

export function avance(app: Application) {
  const completos = PASOS.filter((p) => pasoCompleto(app, p.slug)).length;
  return { completos, total: PASOS.length, fraccion: completos / PASOS.length };
}

/** Lista en espanol de todo lo que impide enviar. Vacia significa que se puede
 *  enviar. Es lo que pinta el checklist del paso 4. */
export function faltantesParaEnviar(app: Application): string[] {
  const faltantes: string[] = [];

  if (!datosCompletos(app)) {
    faltantes.push("Completa los datos personales, académicos y la propuesta.");
  }

  const problema = problemaDeVideo(app);
  if (problema) faltantes.push(problema);

  if (!app.academicos?.declaraNoUltimoAnio) {
    faltantes.push("Falta firmar la declaracion de no cursar el último año del programa.");
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

/** Checklist del paso 4. Es la misma verdad que `faltantesParaEnviar`, pero
 *  desglosada punto por punto: la aplicante necesita ver también lo que ya
 *  tiene resuelto, no solo lo que le falta. */
export function checklist(app: Application, promedioMinimo: number): ItemChecklist[] {
  const video = videoPropuesta(app);
  const problema = problemaDeVideo(app);
  const limite = VIDEOS.find((v) => v.tipo === "propuesta")!.maxSegundos;
  const presentacion = app.videos.find((v) => v.tipo === "presentacion");

  return [
    {
      label: "Datos personales y académicos completos",
      nota: datosCompletos(app)
        ? "Identificación, trayectoria y propuesta capturadas."
        : "Falta información en el paso 1.",
      ok: datosCompletos(app),
    },
    {
      label: `Video de propuesta dentro de ${limite} segundos`,
      nota: video
        ? problema ?? `Dura ${video.duracionSegundos} s.`
        : "Aún no lo subes.",
      ok: problema === null,
    },
    {
      label: "Video de presentación",
      nota: presentacion
        ? `Dura ${presentacion.duracionSegundos} s.`
        : "Es recomendado, no obligatorio: puedes enviar sin él.",
      ok: Boolean(presentacion),
    },
    {
      label: "Declaración de no cursar el último año",
      nota: app.academicos?.declaraNoUltimoAnio
        ? "Firmada en el paso 1."
        : "Debes firmarla en el paso 1 para poder enviar.",
      ok: Boolean(app.academicos?.declaraNoUltimoAnio),
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

/** El expediente se integra DESPUÉS de la publicación de resultados y solo lo
 *  entregan las aplicantes seleccionadas. Por eso los documentos ya no
 *  aparecen en el checklist de envío: no condicionan la postulación. */
export function expedienteCompleto(app: Application) {
  return documentosFaltantes(app).length === 0;
}
