import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sesionActual } from "@/lib/sesion";
import { metadatos, urlDeLectura } from "@/lib/almacen";

/** Entrega un archivo propio de la aplicante.
 *
 *  Nunca se guarda una URL de S3 en la base ni se manda al navegador una liga
 *  permanente: se comprueba quién pide, y solo entonces se firma una URL que
 *  caduca en minutos. */

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
  { params }: { params: Promise<{ clase: string; tipo: string }> },
) {
  const { clase, tipo } = await params;
  const usuario = await sesionActual();
  if (!usuario || usuario.rol !== "applicant") {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 });
  }

  const app = await db.application.findUnique({ where: { userId: usuario.id } });
  if (!app) return NextResponse.json({ error: "Sin aplicación" }, { status: 404 });

  const archivo =
    clase === "documento"
      ? app.documentos.find((d) => d.tipo === tipo)
      : app.videos.find((v) => v.tipo === tipo);

  if (!archivo) return NextResponse.json({ error: "Archivo no encontrado" }, { status: 404 });

  if (!(await existe(archivo.blobPathname))) {
    return NextResponse.json(
      { error: "El archivo ya no está disponible en el almacenamiento." },
      { status: 404 },
    );
  }

  const url = await urlDeLectura(archivo.blobPathname, archivo.nombreOriginal);
  return NextResponse.redirect(url);
}
