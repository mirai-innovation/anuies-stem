import type { Application } from "@prisma/client";
import type { TipoVideo } from "@prisma/client";
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
      a?.universidad &&
      a.programaEducativo &&
      a.nivel &&
      a.semestre &&
      a.promedio != null &&
      a.areaStem &&
      p?.nombre &&
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

/** Devuelve el motivo por el que un video no es aceptable, o null si lo es.
 *
 *  Recorre la definición de VIDEOS en lugar de mirar solo el de propuesta:
 *  cuál es obligatorio es una decisión de la convocatoria, y al cambiarla ahí
 *  la validación del envío tiene que seguirla sola. */
export function problemaDeVideo(app: Application, tipo: TipoVideo = "propuesta") {
  const regla = VIDEOS.find((v) => v.tipo === tipo);
  if (!regla) return null;

  const video = app.videos.find((v) => v.tipo === tipo);
  if (!video) return regla.obligatorio ? `Falta el ${regla.nombre.toLowerCase()}.` : null;

  if (video.duracionSegundos > regla.maxSegundos) {
    return `El ${regla.nombre.toLowerCase()} dura ${video.duracionSegundos} s y el límite es ${regla.maxSegundos} s.`;
  }
  return null;
}

/** Todos los motivos pendientes en el paso de videos. */
export function problemasDeVideos(app: Application) {
  return VIDEOS.map((v) => problemaDeVideo(app, v.tipo)).filter(
    (p): p is string => p !== null,
  );
}

export function pasoCompleto(app: Application, slug: (typeof PASOS)[number]["slug"]) {
  switch (slug) {
    case "datos":
      return datosCompletos(app);
    case "videos":
      return problemasDeVideos(app).length === 0;
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

  faltantes.push(...problemasDeVideos(app));

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

  return [
    {
      label: "Datos personales y académicos completos",
      nota: datosCompletos(app)
        ? "Identificación, trayectoria y propuesta capturadas."
        : "Falta información en el paso 1.",
      ok: datosCompletos(app),
    },
    // Un renglón por video, en el orden en que se piden.
    ...VIDEOS.map((regla) => {
      const subido = app.videos.find((v) => v.tipo === regla.tipo);
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
