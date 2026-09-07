"use server";

import { revalidatePath } from "next/cache";
import type { TipoDocumento, TipoVideo } from "@prisma/client";
import { db } from "@/lib/db";
import { exigeRol } from "@/lib/sesion";
import { edicionActual, expedienteAbierto, recepcionAbierta } from "@/lib/edicion";
import {
  DOCUMENTOS,
  MAX_GRABACION_BYTES,
  MAX_PDF_BYTES,
  MAX_VIDEO_BYTES,
  TIPOS_GRABACION,
  TIPOS_PDF,
  TIPOS_VIDEO,
  VIDEOS,
} from "@/lib/constantes";
import { borrar, llave, autorizacionDeSubida, metadatos, almacenConfigurado } from "@/lib/almacen";
import { duracionDeVideo, excedeLimite } from "@/lib/video";
import { pesoArchivo } from "@/lib/fechas";

/** El archivo viaja del navegador a S3 con una URL firmada; al servidor solo
 *  llegan estas dos llamadas. La primera autoriza la subida, la segunda
 *  verifica el objeto que quedó en el bucket. La verificación es la que manda:
 *  lo que el formulario dijo sobre tamaño, tipo o duración no se cree. */

async function borradorEditable() {
  const usuario = await exigeRol("applicant");
  const edicion = await edicionActual();
  if (!recepcionAbierta(edicion)) throw new Error("La recepción de aplicaciones está cerrada.");

  const app = await db.application.findUnique({ where: { userId: usuario.id } });
  if (!app) throw new Error("No existe una aplicación para esta cuenta.");
  if (app.estado !== "draft") throw new Error("Tu aplicación ya fue enviada y no puede editarse.");
  return { usuario, app };
}

/** Guarda del expediente. Es otra ventana y otro requisito que la del
 *  borrador: aquí la aplicación ya se envió, ya se evaluó y el dictamen fue
 *  favorable. */
async function expedienteEditable() {
  const usuario = await exigeRol("applicant");
  const edicion = await edicionActual();

  const app = await db.application.findUnique({ where: { userId: usuario.id } });
  if (!app) throw new Error("No existe una aplicación para esta cuenta.");
  if (app.dictamen !== "selected") {
    throw new Error("El expediente solo lo integran las aplicantes seleccionadas.");
  }
  if (!expedienteAbierto(edicion)) {
    throw new Error("La integración de expedientes no está abierta.");
  }
  if (app.confirmacion?.estado === "declinada") {
    throw new Error("Declinaste tu lugar, así que no hay expediente que integrar.");
  }
  return { usuario, app };
}

export type Autorizacion = {
  url?: string;
  campos?: Record<string, string>;
  key?: string;
  error?: string;
};

export type ClaseArchivo = "documento" | "video" | "grabacion";

/** Reglas por clase de archivo. La grabación de cámara admite WebM —que es lo
 *  que produce MediaRecorder en Chrome y Firefox— y tiene un tope de peso muy
 *  por debajo del de un video producido aparte: un minuto de webcam pesa unos
 *  pocos MB. */
function reglas(clase: ClaseArchivo) {
  if (clase === "documento") {
    return { tipos: TIPOS_PDF, maximo: MAX_PDF_BYTES, error: "El documento debe ser un PDF." };
  }
  if (clase === "grabacion") {
    return {
      tipos: TIPOS_GRABACION,
      maximo: MAX_GRABACION_BYTES,
      error: "La grabación debe venir de la cámara del navegador.",
    };
  }
  return { tipos: TIPOS_VIDEO, maximo: MAX_VIDEO_BYTES, error: "El video debe ser MP4 o MOV." };
}

export async function autorizarSubida(datos: {
  clase: ClaseArchivo;
  nombreArchivo: string;
  contentType: string;
  tamanoBytes: number;
}): Promise<Autorizacion> {
  try {
    if (!almacenConfigurado()) {
      return { error: "El almacenamiento de archivos no está configurado en el servidor." };
    }

    const esDocumento = datos.clase === "documento";
    // Cada clase tiene su propia ventana: los videos son parte de la
    // postulación y los documentos, del expediente posterior.
    const { app } = esDocumento ? await expedienteEditable() : await borradorEditable();
    const { tipos, maximo, error } = reglas(datos.clase);

    // El navegador añade el códec al tipo, por ejemplo "video/webm;codecs=vp9".
    const tipoBase = datos.contentType.split(";")[0].trim();
    if (!tipos.includes(tipoBase)) return { error };

    if (datos.tamanoBytes > maximo) {
      return { error: `El archivo pesa ${pesoArchivo(datos.tamanoBytes)} y el máximo es ${pesoArchivo(maximo)}.` };
    }

    const key = llave(app.folio, esDocumento ? "documentos" : "videos", datos.nombreArchivo);
    // El máximo va en la política: S3 rechaza el archivo si se pasa, sin que
    // los bytes lleguen a ocupar espacio en el bucket.
    const { url, fields } = await autorizacionDeSubida(key, tipoBase, maximo);
    return { url, campos: fields, key };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo autorizar la subida." };
  }
}

export type ResultadoSubida = { ok?: boolean; error?: string; duracion?: number };

export async function confirmarDocumento(
  tipo: TipoDocumento,
  key: string,
  nombreOriginal: string,
): Promise<ResultadoSubida> {
  try {
    const { app } = await expedienteEditable();
    if (!DOCUMENTOS.some((d) => d.tipo === tipo)) return { error: "Tipo de documento desconocido." };

    const meta = await metadatos(key);
    if (!TIPOS_PDF.includes(meta.contentType)) {
      await borrar(key);
      return { error: "El archivo que llegó no es un PDF." };
    }
    if (meta.tamanoBytes > MAX_PDF_BYTES) {
      await borrar(key);
      return { error: `El PDF pesa ${pesoArchivo(meta.tamanoBytes)} y el máximo es ${pesoArchivo(MAX_PDF_BYTES)}.` };
    }

    // Reemplazar: se borra el objeto anterior para no dejar basura en S3.
    const previo = app.documentos.find((d) => d.tipo === tipo);
    if (previo) await borrar(previo.blobPathname).catch(() => {});

    const documentos = [
      ...app.documentos.filter((d) => d.tipo !== tipo),
      {
        tipo,
        blobPathname: key,
        nombreOriginal,
        tamanoBytes: meta.tamanoBytes,
        contentType: meta.contentType,
        subidoEn: new Date(),
      },
    ];

    await db.application.update({
      where: { id: app.id },
      data: { documentos, guardadaEn: new Date() },
    });

    revalidatePath("/expediente");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo registrar el documento." };
  }
}

export async function confirmarVideo(
  tipo: TipoVideo,
  key: string,
  nombreOriginal: string,
  /** Solo para grabaciones de cámara: ver el comentario más abajo. */
  segundosDeclarados?: number,
): Promise<ResultadoSubida> {
  try {
    const { app } = await borradorEditable();
    const regla = VIDEOS.find((v) => v.tipo === tipo);
    if (!regla) return { error: "Tipo de video desconocido." };

    const esGrabacion = segundosDeclarados !== undefined;
    const { tipos, maximo } = reglas(esGrabacion ? "grabacion" : "video");

    const meta = await metadatos(key);
    const tipoBase = meta.contentType.split(";")[0].trim();
    if (!tipos.includes(tipoBase)) {
      await borrar(key);
      return { error: `El archivo que llegó es ${tipoBase} y no un formato de video admitido.` };
    }
    if (meta.tamanoBytes > maximo) {
      await borrar(key);
      return { error: `El video pesa ${pesoArchivo(meta.tamanoBytes)} y el máximo es ${pesoArchivo(maximo)}.` };
    }

    // La duración se lee del archivo ya subido, no de lo que informó el
    // navegador: el límite es una regla de la convocatoria.
    //
    // La excepción es la grabación de cámara. MediaRecorder produce un WebM
    // "en vivo" sin duración en la cabecera, así que no hay nada que leer. Se
    // acepta la cifra que reporta el navegador —que además detiene la
    // grabación por su cuenta al llegar al límite— y se rechaza igual si se
    // pasa. El tipo y el peso sí quedan impuestos por la política del POST
    // firmado y se vuelven a verificar arriba.
    const segundos = esGrabacion ? segundosDeclarados : await duracionDeVideo(key);

    if (segundos === null || segundos === undefined) {
      await borrar(key);
      return {
        error:
          "No se pudo leer la duración del video. Vuelve a exportarlo como MP4 (H.264) e inténtalo de nuevo.",
      };
    }
    if (excedeLimite(segundos, regla.maxSegundos)) {
      await borrar(key);
      return {
        error: `Tu ${regla.nombre.toLowerCase()} dura ${Math.round(segundos)} segundos y el máximo es ${regla.maxSegundos}. Recórtalo y vuelve a subirlo.`,
      };
    }

    const previo = app.videos.find((v) => v.tipo === tipo);
    if (previo) await borrar(previo.blobPathname).catch(() => {});

    const videos = [
      ...app.videos.filter((v) => v.tipo !== tipo),
      {
        tipo,
        blobPathname: key,
        nombreOriginal,
        tamanoBytes: meta.tamanoBytes,
        contentType: meta.contentType,
        duracionSegundos: Math.round(segundos),
        resumen: previo?.resumen ?? null,
        transcripcion: null,
        subidoEn: new Date(),
      },
    ];

    await db.application.update({
      where: { id: app.id },
      data: { videos, guardadaEn: new Date() },
    });

    revalidatePath("/aplicacion", "layout");
    revalidatePath("/dashboard");
    return { ok: true, duracion: Math.round(segundos) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo registrar el video." };
  }
}

export async function guardarResumenVideo(resumen: string): Promise<ResultadoSubida> {
  try {
    const { app } = await borradorEditable();
    const videos = app.videos.map((v) =>
      v.tipo === "propuesta" ? { ...v, resumen: resumen.trim().slice(0, 600) || null } : v,
    );
    await db.application.update({
      where: { id: app.id },
      data: { videos, guardadaEn: new Date() },
    });
    revalidatePath("/aplicacion", "layout");
    return { ok: true };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No se pudo guardar el resumen." };
  }
}
