import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sesionActual } from "@/lib/sesion";
import { puedeRevisar } from "@/lib/sesion";
import { metadatos, urlDeLectura } from "@/lib/almacen";
import { registrar } from "@/lib/bitacora";

/** Entrega un archivo de cualquier aplicación a quien tiene permiso de
 *  revisarla. Los documentos traen datos personales, así que cada consulta
 *  queda en la bitácora: quién abrió qué y cuándo. */

/** El seed referencia archivos que no existen en S3. Sin esta comprobación el
 *  navegador recibiría el XML de error de AWS en lugar de una explicación. */
async function existe(key: string) {
  try {
    await metadatos(key);
    return true;
  } catch {
    return false;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; clase: string; tipo: string }> },
) {
  const { id, clase, tipo } = await params;
  const usuario = await sesionActual();
  if (!usuario || !puedeRevisar(usuario.rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const app = await db.application.findUnique({ where: { id } });
  if (!app) return NextResponse.json({ error: "Aplicación no encontrada" }, { status: 404 });

  // Un borrador no enviado no es consultable por el comité; administración sí
  // puede abrirlo para seguir el avance durante la convocatoria.
  if (app.estado === "draft" && usuario.rol !== "admin") {
    return NextResponse.json({ error: "La aplicación no ha sido enviada" }, { status: 404 });
  }

  const archivo =
    clase === "documento"
      ? app.documentos.find((d) => d.tipo === tipo)
      : app.videos.find((v) => v.tipo === tipo);

  if (!archivo) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  if (!(await existe(archivo.blobPathname))) {
    return NextResponse.json(
      {
        error:
          "El archivo ya no está disponible en el almacenamiento. Las aplicaciones del seed de prueba no traen archivos reales.",
      },
      { status: 404 },
    );
  }

  await registrar({
    accion: "archivo.consultado",
    actorId: usuario.id,
    entidad: "Application",
    entidadId: app.id,
    detalle: { folio: app.folio, clase, tipo },
  });

  const url = await urlDeLectura(archivo.blobPathname, archivo.nombreOriginal);
  return NextResponse.redirect(url);
}
