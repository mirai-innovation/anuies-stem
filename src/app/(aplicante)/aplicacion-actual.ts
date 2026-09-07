import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { siguienteFolio } from "@/lib/folio";
import { edicionActual, recepcionAbierta } from "@/lib/edicion";

/** Devuelve la aplicacion de la sesion, creando el borrador la primera vez.
 *
 *  Despues del cierre ya no se crean borradores: quien no alcanzo a empezar no
 *  puede empezar ahora. */
export async function aplicacionDe(userId: string) {
  const existente = await db.application.findUnique({
    where: { userId },
    include: { universidad: true },
  });
  if (existente) return existente;

  const edicion = await edicionActual();
  if (!recepcionAbierta(edicion)) return null;

  const folio = await siguienteFolio();
  return db.application.create({
    data: { folio, userId, estado: "draft" },
    include: { universidad: true },
  });
}

export async function aplicacionOFalla(userId: string) {
  const app = await aplicacionDe(userId);
  if (!app) notFound();
  return app;
}
