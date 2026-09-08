import { cache } from "react";
import { db } from "./db";

export const CLAVE_EDICION = process.env.EDICION ?? "2026";

/** Se lee una sola vez por request. */
export const edicionActual = cache(async () => {
  const edicion = await db.edicion.findUnique({ where: { clave: CLAVE_EDICION } });
  if (!edicion) {
    throw new Error(
      `No existe la edicion "${CLAVE_EDICION}". Corre "npm run db:seed" antes de levantar la app.`,
    );
  }
  return edicion;
});

type Edicion = Awaited<ReturnType<typeof edicionActual>>;

/** Antes del cierre se puede crear y editar la aplicacion; despues, no.
 *  Es una sola funcion para que ninguna vista invente su propia regla. */
export function recepcionAbierta(e: Edicion, ahora = new Date()) {
  return ahora <= e.cierreRecepcion;
}

export function resultadosPublicados(e: Edicion, ahora = new Date()) {
  return e.resultadosPublicadosEn !== null && e.resultadosPublicadosEn <= ahora;
}

export function confirmacionAbierta(e: Edicion, ahora = new Date()) {
  return ahora >= e.confirmacionAbre && ahora <= e.confirmacionCierra;
}

